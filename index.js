require('dotenv').config();
const { PORT } = process.env;

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const db = require('./db');
const path = require('path');
const SocketEvent = {
  CREATE_ENTRY: "create entry",
  CREATED_ENTRY: "created entry",
  UPDATE_ENTRY: "update entry",
  UPDATED_ENTRY: "updated entry",
  DELETE_ENTRY: "delete entry",
  DELETED_ENTRY: "deleted entry",
  SEND_ENTRIES: "send entries"
};

app.use('/', express.static(path.join(__dirname, 'public')));

io.on('connection', async (socket) => {
  const allEntries = await db.StreamList.findAll();
  socket.emit(SocketEvent.SEND_ENTRIES, allEntries);

  socket.on(SocketEvent.CREATE_ENTRY, async (entry, requestId) => {
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

  });
});

db.isReady().then(() => {
  http.listen(PORT, () => {
    console.log(`StreamList running on port ${PORT}`);
  });
});
