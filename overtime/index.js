// OVERTIME multiplayer: a thin relay for two-player rooms.
//
// The server pairs two browsers under a four-letter code, tells each about the other and forwards packets
// between them without parsing them. The host's browser runs the whole simulation (enemies, waves, drops), so
// the server keeps no game state at all: a room is two socket ids, a mode, a few lobby options and a timestamp.
// Binary packets (poses, enemy snapshots) are relayed as Buffers; small JSON events (spawns, deaths, shop) as-is.
//
// Cleanup: a player leaving (or dropping) removes them at once; the host leaving closes the room; empty rooms
// are deleted immediately; lobbies nobody starts and games with no traffic expire on a sweep; sockets that sit
// outside any room are disconnected after a while.
//
// Mounted at /overtime. The built game (vite build in D:\Git\3d-shooter-game-threejs) is served from
// OVERTIME_DIST or ./public; /overtime/ABCD redirects to the join link.
module.exports = function (http) {
  const express = require("express");
  const fs = require("fs");
  const path = require("path");
  const { Server } = require("socket.io");

  const app = express();
  const DIST = process.env.OVERTIME_DIST || path.join(__dirname, "public");

  const MAX_ROOMS = 200;            // hard cap on live rooms
  const MAX_PLAYERS = 2;
  const LOBBY_TTL = 30 * 60e3;      // a room nobody starts
  const IDLE_TTL = 15 * 60e3;       // a started room with no traffic (both tabs in the background)
  const ORPHAN_TTL = 10 * 60e3;     // a connected socket that never joins a room
  const SWEEP_EVERY = 30e3;
  const MAX_JSON = 2048;            // bytes per JSON relay event
  const MAX_BINARY = 4096;          // bytes per binary relay packet (a snapshot of 255 enemies is ~2.9 KB)
  const MODES = new Set(["coop", "versus"]);
  const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";   // no 0/O/1/I

  const io = new Server(http, {
    path: "/overtime/socket.io",
    serveClient: false,
    maxHttpBufferSize: 8192,
    pingInterval: 10000,
    pingTimeout: 10000,
  });

  const rooms = new Map();   // code -> { code, mode, hostId, state, opts, players: Map<socketId, {id, name, slot}>, created, last }

  function makeCode() {
    for (let tries = 0; tries < 50; tries++) {
      let c = "";
      for (let i = 0; i < 4; i++) c += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
      if (!rooms.has(c)) return c;
    }
    return null;
  }

  function cleanName(n) {
    const s = String(n == null ? "" : n).replace(/[^\w \-'.]/g, "").trim().slice(0, 16);
    return s || "Player";
  }

  function cleanOpts(o) {
    const opts = {};
    if (o && typeof o === "object") {
      const shift = parseInt(o.shift, 10);
      if ([5, 10, 15].includes(shift)) opts.shift = shift;
    }
    return opts;
  }

  function roomInfo(room) {
    return {
      code: room.code,
      mode: room.mode,
      hostId: room.hostId,
      state: room.state,
      opts: room.opts,
      players: [...room.players.values()],
    };
  }

  function touch(room) {
    room.last = Date.now();
  }

  function socketOf(id) {
    return io.sockets.sockets.get(id);
  }

  function closeRoom(room, reason) {
    for (const p of room.players.values()) {
      const s = socketOf(p.id);
      if (s) {
        s.leave(room.code);
        s.room = null;
        s.emit("closed", { reason });
      }
    }
    room.players.clear();
    rooms.delete(room.code);
  }

  function leave(socket, reason) {
    const room = socket.room;
    if (!room) return;
    const me = room.players.get(socket.id);
    room.players.delete(socket.id);
    socket.leave(room.code);
    socket.room = null;
    if (!room.players.size) {
      rooms.delete(room.code);
      return;
    }
    if (socket.id === room.hostId) {
      // the simulation lived in the host's browser; nothing to continue
      closeRoom(room, reason === "disconnect" ? "host_disconnected" : "host_left");
      return;
    }
    touch(room);
    io.to(room.code).emit("peer_left", { id: socket.id, name: me ? me.name : "", reason });
    io.to(room.code).emit("room", roomInfo(room));
  }

  // token bucket per socket: 60 messages/s sustained, bursts of 120
  function allow(socket) {
    const now = Date.now();
    const b = socket.bucket;
    b.tokens = Math.min(120, b.tokens + (now - b.t) * 0.06);
    b.t = now;
    if (b.tokens < 1) return false;
    b.tokens -= 1;
    return true;
  }

  function reply(ack, value) {
    if (typeof ack === "function") ack(value);
  }

  io.on("connection", (socket) => {
    socket.room = null;
    socket.since = Date.now();
    socket.bucket = { tokens: 120, t: Date.now() };

    socket.on("create", (data, ack) => {
      if (socket.room) return reply(ack, { error: "already in a room" });
      if (rooms.size >= MAX_ROOMS) return reply(ack, { error: "the office is full, try again later" });
      const mode = data && MODES.has(data.mode) ? data.mode : null;
      if (!mode) return reply(ack, { error: "unknown mode" });
      const code = makeCode();
      if (!code) return reply(ack, { error: "no room codes left" });
      const room = {
        code, mode, hostId: socket.id, state: "lobby", opts: cleanOpts(data.opts),
        players: new Map(), created: Date.now(), last: Date.now(),
      };
      room.players.set(socket.id, { id: socket.id, name: cleanName(data.name), slot: 0 });
      rooms.set(code, room);
      socket.room = room;
      socket.join(code);
      reply(ack, { room: roomInfo(room), me: socket.id });
    });

    socket.on("join", (data, ack) => {
      if (socket.room) return reply(ack, { error: "already in a room" });
      const code = String((data && data.code) || "").toUpperCase().trim();
      const room = rooms.get(code);
      if (!room) return reply(ack, { error: "no such room" });
      if (room.state !== "lobby") return reply(ack, { error: "that shift already started" });
      if (room.players.size >= MAX_PLAYERS) return reply(ack, { error: "that room is full" });
      const used = new Set([...room.players.values()].map((p) => p.slot));
      let slot = 0;
      while (used.has(slot)) slot++;
      room.players.set(socket.id, { id: socket.id, name: cleanName(data.name), slot });
      socket.room = room;
      socket.join(code);
      touch(room);
      reply(ack, { room: roomInfo(room), me: socket.id });
      socket.to(code).emit("room", roomInfo(room));
    });

    socket.on("leave", () => leave(socket, "left"));

    // host only: lobby options (shift length) and starting the shift
    socket.on("options", (opts) => {
      const room = socket.room;
      if (!room || room.hostId !== socket.id || room.state !== "lobby") return;
      room.opts = cleanOpts(opts);
      touch(room);
      io.to(room.code).emit("room", roomInfo(room));
    });

    socket.on("start", (opts) => {
      const room = socket.room;
      if (!room || room.hostId !== socket.id || room.state !== "lobby") return;
      if (room.players.size < MAX_PLAYERS) return;
      room.state = "playing";
      room.opts = cleanOpts(opts || room.opts);
      touch(room);
      io.to(room.code).emit("start", roomInfo(room));
    });

    // host only: hand the host role (and the shooter seat in versus) to the other player
    socket.on("swap", () => {
      const room = socket.room;
      if (!room || room.hostId !== socket.id || room.state !== "lobby") return;
      const other = [...room.players.values()].find((p) => p.id !== socket.id);
      if (!other) return;
      const me = room.players.get(socket.id);
      [me.slot, other.slot] = [other.slot, me.slot];
      room.hostId = other.id;
      touch(room);
      io.to(room.code).emit("room", roomInfo(room));
    });

    // host only: the shift ended, everyone back to the lobby
    socket.on("relobby", () => {
      const room = socket.room;
      if (!room || room.hostId !== socket.id || room.state === "lobby") return;
      room.state = "lobby";
      touch(room);
      io.to(room.code).emit("room", roomInfo(room));
    });

    // relays: JSON events (reliable, small) and binary state packets; both only inside a started room
    socket.on("j", (data) => {
      const room = socket.room;
      if (!room || room.state !== "playing" || !allow(socket)) return;
      if (!Array.isArray(data) || JSON.stringify(data).length > MAX_JSON) return;
      touch(room);
      socket.to(room.code).emit("j", data);
    });

    socket.on("b", (data) => {
      const room = socket.room;
      if (!room || room.state !== "playing" || !allow(socket)) return;
      if (!Buffer.isBuffer(data) || data.length === 0 || data.length > MAX_BINARY) return;
      touch(room);
      socket.to(room.code).emit("b", data);
    });

    socket.on("disconnect", () => leave(socket, "disconnect"));
  });

  const sweep = setInterval(() => {
    const now = Date.now();
    for (const room of rooms.values()) {
      const ttl = room.state === "lobby" ? LOBBY_TTL : IDLE_TTL;
      if (now - room.last > ttl) closeRoom(room, "expired");
    }
    for (const s of io.sockets.sockets.values()) {
      if (!s.room && now - s.since > ORPHAN_TTL) s.disconnect(true);
    }
  }, SWEEP_EVERY);
  if (sweep.unref) sweep.unref();

  // ------------------------------------------------------------------------------------------------ http
  app.get("/:code([A-Za-z0-9]{4})", (req, res) => {
    res.redirect(`/overtime/?room=${req.params.code.toUpperCase()}`);
  });

  app.get("/stats", (req, res) => {
    let players = 0;
    for (const r of rooms.values()) players += r.players.size;
    res.json({ rooms: rooms.size, players, sockets: io.sockets.sockets.size });
  });

  if (fs.existsSync(path.join(DIST, "index.html"))) {
    // index.html must never be cached: it names the hashed build files, and a stale copy points at files that are gone
    app.use("/", express.static(DIST, {
      setHeaders(res, filePath) {
        if (filePath.endsWith("index.html")) res.setHeader("Cache-Control", "no-cache");
      },
    }));
  } else {
    console.log(`(overtime: no build found at ${DIST}; run "npm run deploy" in the game repo)`);
    app.get("/", (req, res) => res.status(503).send("OVERTIME is not built yet. Run `npm run deploy` in the game repository."));
  }

  console.log("OVERTIME loaded");

  return { app, io, rooms };
};
