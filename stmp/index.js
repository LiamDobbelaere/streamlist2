const express = require("express");
const app = express();
const path = require("path");

let chatHistoryByLobbyId = {};
let queuedMessagesByLobbyId = [];

app.set('trust proxy', true);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get('/:lobbyId/join', (req, res) => {
    if (!req.params.lobbyId) {
        return res.status(400).send('Lobby ID is required');
    }

    res.redirect('/?lobbyId=' + req.params.lobbyId);
});

// disable Access-Control-Allow-Origin
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});


app.post('/:lobbyId/set-chat', (req, res) => {
    if (!req.params.lobbyId) {
        return res.status(400).send('Lobby ID is required');
    }

    chatHistoryByLobbyId[req.params.lobbyId] = req.body;

    res.send('Chat history received and stored successfully');
});

app.get('/:lobbyId/get-chat', (req, res) => {
    if (!req.params.lobbyId) {
        return res.status(400).send('Lobby ID is required');
    }

    res.json(chatHistoryByLobbyId[req.params.lobbyId] || []);
});

app.post('/:lobbyId/queue-message', (req, res) => {
    if (!req.params.lobbyId) {
        return res.status(400).send('Lobby ID is required');
    }

    queuedMessagesByLobbyId[req.params.lobbyId] = queuedMessagesByLobbyId[req.params.lobbyId] || [];
    queuedMessagesByLobbyId[req.params.lobbyId].push(req.body);
    console.log('Queued message:', req.body);

    res.send('Message queued successfully');
});

app.get('/:lobbyId/queued-messages', (req, res) => {
    if (!req.params.lobbyId) {
        return res.status(400).send('Lobby ID is required');
    }

    res.json(queuedMessagesByLobbyId[req.params.lobbyId] || []);
    queuedMessagesByLobbyId[req.params.lobbyId] = [];
});

app.use("/", express.static(path.join(__dirname, "public")));

console.log("Silly Tavern MP loaded");

module.exports = {
  app,
};
