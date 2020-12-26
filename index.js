require('dotenv').config();
const { 
  PORT, 
  INTEROP_OTH_IP,
  INTEROP_OTH_PORT
} = process.env;

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const cookieParser = require('socket.io-cookie-parser');
const fetch = require('node-fetch');
const db = require('./db');
const path = require('path');
const SocketEvent = {
  CREATE_ENTRY: "create entry",
  CREATED_ENTRY: "created entry",
  UPDATE_ENTRY: "update entry",
  UPDATED_ENTRY: "updated entry",
  DELETE_ENTRY: "delete entry",
  DELETED_ENTRY: "deleted entry",
  SEND_ENTRIES: "send entries",
  CONNECTION_COUNT: "connection count",
  USERINFO_RECEIVED: "userinfo received"
};

app.use('/', express.static(path.join(__dirname, 'public')));
app.get('/export', async (req, res) => {
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
  Object.keys(itemsByType).forEach(key => {
    if (!first) {
      finalText += "\r\n";
    }
    finalText += key.toUpperCase() + "\r\n";

    itemsByType[key].forEach(item => {
      finalText += item + "\r\n";
    });

    first = false;
  });

  res.writeHead(200, {
    'Content-Type': 'application/force-download',
    'Content-disposition':'attachment; filename=gamelist.txt'
  });
  res.end(finalText);
});

io.use(cookieParser());

let connectionCount = 0;
io.on('connection', async (socket) => {
  socket.permissions = [];

  const sid = socket.request.cookies.sid;
  await fetchPermissions(); 

  async function fetchPermissions() {
    if (sid) {
      const res = await fetch(`http://${INTEROP_OTH_IP}:${INTEROP_OTH_PORT}/session/${sid}/user-info`);
      if (res.ok) {
        const { email, permissions } = await res.json();
        
        socket.permissions = permissions;
        socket.emit(SocketEvent.USERINFO_RECEIVED, {
          email,
          permissions
        });
      } else {
        resetPermissions();
      }
    } else {
      resetPermissions();
    }
  }

  function resetPermissions() {
    socket.permissions = [];
    socket.emit(SocketEvent.USERINFO_RECEIVED, {
      permissions: socket.permissions
    });
  }

  function hasModifyPermission() {
    return socket.permissions.includes("MODIFY_STREAMLIST");
  }

  connectionCount++;
  io.emit(SocketEvent.CONNECTION_COUNT, connectionCount);

  const allEntries = await db.StreamList.findAll();
  socket.emit(SocketEvent.SEND_ENTRIES, allEntries);

  socket.on(SocketEvent.CREATE_ENTRY, async (entry, requestId) => {
    await fetchPermissions(); 
    if (!hasModifyPermission()) {
      return;
    }

    if (!entry.title.trim()) {
      return;
    }

    const newEntry = (await db.StreamList.create({
      title: entry.title
    })).get({ plain: true });

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
        id
      }
    });
    
    io.emit(SocketEvent.DELETED_ENTRY, id);
  });

  socket.on(SocketEvent.UPDATE_ENTRY, async (entry, requestId) => {
    await fetchPermissions(); 
    if (!hasModifyPermission()) {
      return;
    }

    await db.StreamList.update({
      title: entry.title,
      type: entry.type,
      isCoop: entry.type === "game" && entry.isCoop,
      isVersus: entry.type === "game" && entry.isVersus
    }, {
      where: {
        id: entry.id
      }
    });

    const updatedEntry = await db.StreamList.findOne({
      where: {
        id: entry.id
      }
    }, { plain: true });

    socket.broadcast.emit(SocketEvent.UPDATED_ENTRY, updatedEntry);
    socket.emit(SocketEvent.UPDATED_ENTRY, updatedEntry, requestId);
  });

  socket.on('disconnect', () => {
    connectionCount--;
    io.emit(SocketEvent.CONNECTION_COUNT, connectionCount);
  });
});

db.isReady().then(() => {
  http.listen(PORT, () => {
    console.log(`StreamList running on port ${PORT}`);
  });
});
