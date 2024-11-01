require("dotenv").config();
const { PORT } = process.env;

const express = require("express");
const app = express();
const http = require("http").createServer(app);
const path = require("path");

const oth = require("./oth");
const streamlist = require("./streamlist")(http);
const loctrac = require("./loctrac");

app.use("/", express.static(path.join(__dirname, "public")));
app.use("/oth", oth.app);
app.use("/streamlist", streamlist.app);
app.use("/loctrac", loctrac.app);

http.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});
