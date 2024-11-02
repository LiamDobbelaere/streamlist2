require('dotenv').config();

const { LOCTRAC_ACCESS_KEY } = process.env;

const fs = require("fs");
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const app = express();
app.set('trust proxy', true);

app.use(bodyParser.json());
app.use("/", express.static(path.join(__dirname, "public")));

const saveToJson = async (fileName, data) => {
  fs.writeFileSync(fileName, JSON.stringify(data));
};

const loadFromJson = async (fileName, def = {}) => {
  try {
    return JSON.parse(fs.readFileSync(fileName));
  } catch (e) {
    return def;
  }
};

const saveLatLon = async (lat, lon, date) => {
  const data = {
    lat,
    lon,
    date,
  };

  await saveToJson("latlon.json", data);
};

const loadLatLon = async () => {
  return await loadFromJson("latlon.json", { lat: -1, lon: -1, date: -1 });
};

const saveRequestees = async (requestees) => {
  await saveToJson("requestees.json", requestees);
};

const loadRequestees = async () => {
  return await loadFromJson("requestees.json", []);
};

app.get("/reg-loc", async (req, res) => {
  const lat = +req.query.lat;
  const lon = +req.query.lon;
  const date = new Date().valueOf();

  if (lat && lon) {
    await saveLatLon(lat, lon, date);
  }

  res.json({
    lat,
    lon,
    date,
  });
});

app.get("/get-loc", async (req, res) => {
  // get access key from request query parms
  const key = req.query.key;
  if (key !== LOCTRAC_ACCESS_KEY) {
    return res.status(403).send("Unauthorized");
  }

  const ip = req.ip;
  const requestees = await loadRequestees();
  requestees.push(ip);
  await saveRequestees(requestees);

  const response = await loadLatLon();

  res.json(response);
});

app.get("/get-reqs", async (req, res) => {
  const key = req.query.key;
  if (key !== LOCTRAC_ACCESS_KEY) {
    return res.status(403).send("Unauthorized");
  }

  const requestees = await loadRequestees();

  res.json(requestees);
});

module.exports = {
  app,
};
