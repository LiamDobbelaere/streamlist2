require('dotenv').config();

const { LOCTRAC_ACCESS_KEY } = process.env;

const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const app = express();

let lastLat = 0;
let lastLon = 0;

const requestees = [];

app.use(bodyParser.json());
app.use("/", express.static(path.join(__dirname, "public")));

app.get("/reg-loc", async (req, res) => {
  const lat = +req.query.lat;
  const lon = +req.query.lon;

  if (lat && lon) {
    lastLat = lat;
    lastLon = lon;
  }

  res.json({
    lat: lastLat,
    lon: lastLon,
  });
});

app.get("/get-loc", async (req, res) => {
  // get access key from request query parms
  const key = req.query.key;
  if (key !== LOCTRAC_ACCESS_KEY) {
    return res.status(403).send("Unauthorized");
  }

  const ip = req.ip;
  if (!requestees.includes(ip)) {
    requestees.push(ip);
  }

  res.json({
    lat: lastLat,
    lon: lastLon,
  });
});

app.get("/get-reqs", async (req, res) => {
  res.json({
    requestees,
  });
});

module.exports = {
  app,
};
