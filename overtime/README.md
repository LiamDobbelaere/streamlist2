# overtime

The multiplayer relay and static host for OVERTIME (the three.js office wave shooter in
`D:\Git\3d-shooter-game-threejs`), mounted at `/overtime` by `index.js`.

- `index.js` creates a second socket.io server on the shared http server at `/overtime/socket.io` (streamlist
  keeps `/socket.io`). Rooms of two: `create`, `join`, `leave`, `options`, `start`, `swap`, `relobby`, and two
  relay events (`j` JSON, `b` binary) forwarded to the other player unparsed. No game state lives here.
- Stale sessions: disconnect = leave; the host leaving closes the room; empty rooms are deleted at once; a sweep
  every 30 s closes lobbies older than 30 min, games silent for 15 min, and disconnects sockets that never
  joined a room within 10 min. Per-socket rate limit 60 msg/s (burst 120), 2 KB JSON / 4 KB binary caps.
- `GET /overtime/ABCD` redirects to `/overtime/?room=ABCD` (the share link). `GET /overtime/stats` reports
  room, player and socket counts.
- The built game is served from `OVERTIME_DIST` or `./public` (git-ignored). Build it with `npm run deploy`
  in the game repo, then restart this server (it checks for `public/index.html` at start-up).
