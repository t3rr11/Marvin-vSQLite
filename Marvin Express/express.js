//Express
const MySQL = require('mysql');
const { db } = require("./modules/Database");
const Config = require("./data/config.json");
const Misc = require("./js/misc.js");
const Log = require("./js/log.js");
const cors = require("cors")
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require("node-fetch");
var app = express();

app.use(cors());
app.use(bodyParser.json({ extended: true }));

module.exports = { app };

//Posts
app.post("/API/GetGuildsFromDiscordID", async function(req, res) { await apiRequest(req, res, `GetGuildsFromDiscordID`, `SELECT * FROM guilds WHERE owner_id="${ req.body.id }" AND owner_avatar="${ req.body.avatar }"`); });
app.post("/API/GetClans", async function(req, res) { await apiRequest(req, res, `GetClans`, `SELECT * FROM clans`); });
app.post("/API/GetClan", async function(req, res) { await apiRequest(req, res, `GetClan`, `SELECT * FROM clans WHERE clan_id="${ req.body.clan_id }"`); });

//Request Processing
async function apiRequest(req, res, name, sql) {
  Log.SaveLog("Request", `Request to: ${ name }`);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error: ${ error }`); res.status(200).send({ error: "Failed" }); }
    else { if(rows.length > 0) { res.status(200).send({ error: null, data: rows }) } else { res.status(200).send({ error: "No data found" }) } }
  });
}

//This stuff is for the WiFi module. Leave alone.
app.get("/api", async function(req, res) {
  const apiReq = req.query;
  if(apiReq.type === "1") {
    const headers = { headers: { "X-API-Key": Config.apiKey, "Content-Type": "application/json" } };
    const request = await fetch(`https://bungie.net/Platform/Destiny2/${ apiReq.membershipType }/Profile/${ apiReq.membershipId }/?components=100,200,202,204,800,900`, headers);
    const response = await request.json();
    if(request.ok && response.ErrorCode && response.ErrorCode === 1) {
      var titles = [];

      var wayfarer = response.Response.profileRecords.data.records["2757681677"].objectives[0].complete;
      var dredgen = response.Response.profileRecords.data.records["3798931976"].objectives[0].complete;
      var unbroken = response.Response.profileRecords.data.records["3369119720"].objectives[0].complete;
      var chronicler = response.Response.profileRecords.data.records["1754983323"].objectives[0].complete;
      var cursebreaker = response.Response.profileRecords.data.records["1693645129"].objectives[0].complete;
      var rivensbane = response.Response.profileRecords.data.records["2182090828"].objectives[0].complete;
      var blacksmith = response.Response.profileRecords.data.records["2053985130"].objectives[0].complete;
      var reckoner = response.Response.profileRecords.data.records["1313291220"].objectives[0].complete;
      var mmxix = response.Response.profileRecords.data.records["2254764897"].objectives[0].complete;
      var shadow = response.Response.profileRecords.data.records["1883929036"].objectives[0].complete;
      var undying = response.Response.profileRecords.data.records["2707428411"].objectives[0].complete;
      var enlightened = response.Response.profileRecords.data.records["3387213440"].objectives[0].complete;
      var harbinger = response.Response.profileRecords.data.records["3793754396"].objectives[0].complete;
      var savior = response.Response.profileRecords.data.records["2460356851"].objectives[0].complete;

      if(wayfarer){ titles.push("Wayfarer"); }
      if(dredgen){ titles.push("Dredgen"); }
      if(unbroken){ titles.push("Unbroken"); }
      if(chronicler){ titles.push("Chronicler"); }
      if(cursebreaker){ titles.push("Cursebreaker"); }
      if(rivensbane){ titles.push("Rivensbane"); }
      if(blacksmith){ titles.push("Blacksmith"); }
      if(reckoner){ titles.push("Reckoner"); }
      if(mmxix){ titles.push("MMXIX"); }
      if(shadow){ titles.push("Shadow"); }
      if(undying){ titles.push("Undying"); }
      if(enlightened){ titles.push("Enlightened"); }
      if(harbinger){ titles.push("Harbinger"); }
      if(savior){ titles.push("Savior"); }

      res.status(200).send({ error: null, titles });
    }
    else if(response.ErrorCode === 5) { res.status(200).send({ error: "SystemDisabled" }); }
    else { res.status(200).send({ error: `Failed: ${ JSON.stringify(response) }`}); }
  }
  else { res.status(200).send({ error: "Unknown type of request" }); }
});

app.listen(3000, function () { Log.SaveLog("Normal", "Express is listening on port 3000...") });
