require("dotenv").config();
const { PORT, INTEROP_OTH_DISABLED } = process.env;

const oth = require("./oth");
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const cookieParser = require("socket.io-cookie-parser");
const fetch = require("node-fetch");
const db = require("./db");
const path = require("path");
const { Op } = require("sequelize");
const SocketEvent = {
  CREATE_ENTRY: "create entry",
  CREATED_ENTRY: "created entry",
  UPDATE_ENTRY: "update entry",
  UPDATED_ENTRY: "updated entry",
  DELETE_ENTRY: "delete entry",
  DELETED_ENTRY: "deleted entry",
  FORCE_DELETE_ENTRY: "force delete entry",
  UNDELETE_ENTRY: "undelete entry",
  SEND_ENTRIES: "send entries",
  SEND_DELETED_ENTRIES: "send deleted entries",
  CONNECTION_COUNT: "connection count",
  USERINFO_RECEIVED: "userinfo received",
};

app.use("/", express.static(path.join(__dirname, "public")));
app.use("/oth", oth.app);
app.get("/export", async (req, res) => {
  const streamItems = await db.StreamList.findAll();
  const itemsByType = streamItems.reduce((acc, streamItem) => {
    acc[streamItem.type] = acc[streamItem.type] || [];

    const isCoop = streamItem.isCoop ? "(coop) " : "";
    const isVersus = streamItem.isVersus ? "(versus) " : "";
    const tags = (isCoop + isVersus).trim();
    acc[streamItem.type].push(`${streamItem.title} ${tags}`);

    return acc;
  }, {});

  let finalText = "";
  let first = true;
  Object.keys(itemsByType).forEach((key) => {
    if (!first) {
      finalText += "\r\n";
    }
    finalText += key.toUpperCase() + "\r\n";

    itemsByType[key].forEach((item) => {
      finalText += item + "\r\n";
    });

    first = false;
  });

  res.writeHead(200, {
    "Content-Type": "application/force-download",
    "Content-disposition": "attachment; filename=gamelist.txt",
  });
  res.end(finalText);
});

io.use(cookieParser());

let connectionCount = 0;
io.on("connection", async (socket) => {
  socket.permissions = [];

  const sid = socket.request.cookies.sid;
  await fetchPermissions();

  async function fetchPermissions() {
    if (+INTEROP_OTH_DISABLED === 1) {
      const perms = ["MODIFY_STREAMLIST"];
      socket.permissions = perms;
      socket.emit(SocketEvent.USERINFO_RECEIVED, {
        email: "",
        permissions: perms,
      });
      return;
    }

    if (sid) {
      try {
        const res = await oth.getPermissions(sid);

        const { email, permissions } = res;

        socket.permissions = permissions;
        socket.emit(SocketEvent.USERINFO_RECEIVED, {
          email,
          permissions,
        });
      } catch {
        resetPermissions();
      }
    } else {
      resetPermissions();
    }
  }

  function resetPermissions() {
    socket.permissions = [];
    socket.emit(SocketEvent.USERINFO_RECEIVED, {
      permissions: socket.permissions,
    });
  }

  function hasModifyPermission() {
    if (+INTEROP_OTH_DISABLED === 1) {
      return true;
    }

    return socket.permissions.includes("MODIFY_STREAMLIST");
  }

  connectionCount++;
  io.emit(SocketEvent.CONNECTION_COUNT, connectionCount);

  async function getDeletedEntries() {
    return db.StreamList.findAll({
      where: {
        deletedAt: {
          [Op.ne]: null,
        },
      },
      order: [["deletedAt", "DESC"]],
      limit: 5,
      paranoid: false,
    });
  }

  const allEntries = await db.StreamList.findAll();
  const deletedEntries = await getDeletedEntries();
  socket.emit(SocketEvent.SEND_ENTRIES, allEntries);
  socket.emit(SocketEvent.SEND_DELETED_ENTRIES, deletedEntries);

  socket.on(SocketEvent.CREATE_ENTRY, async (entry, requestId) => {
    await fetchPermissions();
    if (!hasModifyPermission()) {
      return;
    }

    if (!entry.title.trim()) {
      return;
    }

    const newEntry = (
      await db.StreamList.create({
        title: entry.title,
      })
    ).get({ plain: true });

    socket.broadcast.emit(SocketEvent.CREATED_ENTRY, newEntry);
    socket.emit(SocketEvent.CREATED_ENTRY, newEntry, requestId);
  });

  socket.on(SocketEvent.DELETE_ENTRY, async (id) => {
    await fetchPermissions();
    if (!hasModifyPermission()) {
      return;
    }

    if (!id) {
      return;
    }

    await db.StreamList.destroy({
      where: {
        id,
      },
    });

    io.emit(SocketEvent.DELETED_ENTRY, id);

    const newDeletedEntries = await getDeletedEntries();
    io.emit(SocketEvent.SEND_DELETED_ENTRIES, newDeletedEntries);
  });

  socket.on(SocketEvent.FORCE_DELETE_ENTRY, async (id) => {
    await fetchPermissions();
    if (!hasModifyPermission()) {
      return;
    }

    if (!id) {
      return;
    }

    await db.StreamList.destroy({
      where: {
        id,
      },
      force: true,
      paranoid: false,
    });

    const newDeletedEntries = await getDeletedEntries();

    io.emit(SocketEvent.SEND_DELETED_ENTRIES, newDeletedEntries);
  });

  socket.on(SocketEvent.UNDELETE_ENTRY, async (id) => {
    await fetchPermissions();
    if (!hasModifyPermission()) {
      return;
    }

    if (!id) {
      return;
    }

    const entry = await db.StreamList.findOne({
      where: {
        id,
      },
      paranoid: false,
    });
    if (!entry) {
      return;
    }

    await entry.restore();

    const newDeletedEntries = await getDeletedEntries();

    io.emit(SocketEvent.CREATED_ENTRY, entry);
    io.emit(SocketEvent.SEND_DELETED_ENTRIES, newDeletedEntries);
  });

  socket.on(SocketEvent.UPDATE_ENTRY, async (entry, requestId) => {
    await fetchPermissions();
    if (!hasModifyPermission()) {
      return;
    }

    await db.StreamList.update(
      {
        title: entry.title,
        type: entry.type,
        isCoop: entry.type === "game" && entry.isCoop,
        isVersus: entry.type === "game" && entry.isVersus,
      },
      {
        where: {
          id: entry.id,
        },
      }
    );

    const updatedEntry = await db.StreamList.findOne(
      {
        where: {
          id: entry.id,
        },
      },
      { plain: true }
    );

    socket.broadcast.emit(SocketEvent.UPDATED_ENTRY, updatedEntry);
    socket.emit(SocketEvent.UPDATED_ENTRY, updatedEntry, requestId);
  });

  socket.on("disconnect", () => {
    connectionCount--;
    io.emit(SocketEvent.CONNECTION_COUNT, connectionCount);
  });
});

db.isReady().then(() => {
  http.listen(PORT, () => {
    console.log(`StreamList running on port ${PORT}`);
  });
});
