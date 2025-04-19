const express = require("express");
const app = express();
const path = require("path");

let chatHistory = [];
let queuedMessages = [];

app.set('trust proxy', true);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/", express.static(path.join(__dirname, "public")));

// disable Access-Control-Allow-Origin
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.post('/set-chat', (req, res) => {
    chatHistory = req.body;

    res.send('Chat history received and stored successfully');
});

app.get('/get-chat', (req, res) => {
    res.json(chatHistory);
});

app.post('/queue-message', (req, res) => {
    queuedMessages.push(req.body);
    console.log('Queued message:', req.body);

    res.send('Message queued successfully');
});

app.get('/queued-messages', (req, res) => {
    res.json(queuedMessages);
    queuedMessages = [];
});

console.log("Silly Tavern MP loaded");

module.exports = {
  app,
};
