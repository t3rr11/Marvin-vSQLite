//Express
const MySQL = require('mysql');
const { db } = require("./modules/Database");
const Config = require("./data/config.json");
const Misc = require("./js/misc.js");
const Log = require("./js/log.js");
const fs = require('fs');
const cors = require("cors")
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require("node-fetch");
var app = express();

app.use(cors());
app.use(bodyParser.json({ extended: true }));

module.exports = { app };

//Posts
app.post("/API/GetGuildsFromDiscordID", async function(req, res) { await expressPOSTRequest(req, res, `GetGuildsFromDiscordID`, `SELECT * FROM guilds WHERE owner_id="${ req.body.id }" AND owner_avatar="${ req.body.avatar }"`); });
app.post("/API/GetClan", async function(req, res) { await expressPOSTRequest(req, res, `GetClan`, `SELECT * FROM clans WHERE clan_id="${ req.body.clan_id }"`); });

//Gets
app.get("/API/GetClans", async function(req, res) { await expressGETRequest(req, res, `GetClans`, `SELECT * FROM clans`); });
app.get("/API/GetCurrentStatus", async function(req, res) { await expressGETRequest(req, res, `GetCurrentStatus`, `SELECT * FROM status ORDER BY id DESC LIMIT 1`); });
app.get("/API/GetDailyStatus", async function(req, res) { await expressGETRequest(req, res, `GetDailyStatus`, `SELECT * FROM status LIMIT ${ 1 * 10 * 24 }`); });
app.get("/API/GetWeeklyStatus", async function(req, res) { await expressGETRequest(req, res, `GetWeeklyStatus`, `SELECT * FROM ( SELECT @row := @row +1 AS rownum, users_all, users_tracked, players_all, players_tracked, players_online, clans_all, clans_tracked, guilds_all, guilds_tracked, servers, date FROM ( SELECT @row :=0) r, status ) ranked WHERE rownum % 144 = 1`); });
app.get("/API/GetMonthlyStatus", async function(req, res) { await expressGETRequest(req, res, `GetMonthlyStatus`, `SELECT * FROM ( SELECT @row := @row +1 AS rownum, users_all, users_tracked, players_all, players_tracked, players_online, clans_all, clans_tracked, guilds_all, guilds_tracked, servers, date FROM ( SELECT @row :=0) r, status ) ranked WHERE rownum % 1008 = 1`); });
app.get("/API/GetYearlyStatus", async function(req, res) { await expressGETRequest(req, res, `GetYearlyStatus`, `SELECT * FROM ( SELECT @row := @row +1 AS rownum, users_all, users_tracked, players_all, players_tracked, players_online, clans_all, clans_tracked, guilds_all, guilds_tracked, servers, date FROM ( SELECT @row :=0) r, status ) ranked WHERE rownum % 4320 = 1`); });

//Request Processing
async function expressPOSTRequest(req, res, name, sql) {
  Log.SaveLog("Request", `POST Request to: ${ name }`);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error: ${ error }`); res.status(200).send({ error: "Failed" }); }
    else { if(rows.length > 0) { res.status(200).send({ error: null, data: rows }) } else { res.status(200).send({ error: "No data found" }) } }
  });
}
async function expressGETRequest(req, res, name, sql) {
  Log.SaveLog("Request", `GET Request to: ${ name }`);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error: ${ error }`); res.status(200).send({ error: "Failed" }); }
    else { if(rows.length > 0) { res.status(200).send({ error: null, data: rows }) } else { res.status(200).send({ error: "No data found" }) } }
  });
}
async function apiRequest(sql, callback) {
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error: ${ error }`); callback(true); }
    else { if(rows.length > 0) { callback(false, true, rows); } else { callback(false, false); } }
  });
}

//Logging
async function logStatus() {
  //Get all data together
  var backend_status = JSON.parse(fs.readFileSync('../Marvin Backend/data/backend_status.json').toString());
  var frontend_status = JSON.parse(fs.readFileSync('../Marvin Frontend/data/frontend_status.json').toString());
  var Users = frontend_status.users;
  var Servers = frontend_status.servers;
  var T_Users = await new Promise(resolve => apiRequest(`SELECT COUNT(*) FROM users`, (isError, isFound, Data) => { resolve(Data[0]["COUNT(*)"]); }) );
  var Players = await new Promise(resolve => apiRequest(`SELECT COUNT(*) FROM playerInfo`, (isError, isFound, Data) => { resolve(Data[0]["COUNT(*)"]); }) );
  var T_Players = await new Promise(resolve => apiRequest(`SELECT member_count FROM clans`, (isError, isFound, Data) => { var count = 0; for(var i in Data) { count = count + Data[i].member_count } resolve(count); }) );
  var O_Players = await new Promise(resolve => apiRequest(`SELECT online_players FROM clans`, (isError, isFound, Data) => { var count = 0; for(var i in Data) { count = count + Data[i].online_players } resolve(count); }) );
  var Clans = await new Promise(resolve => apiRequest(`SELECT COUNT(*) FROM clans`, (isError, isFound, Data) => { resolve(Data[0]["COUNT(*)"]); }) );
  var T_Clans = await new Promise(resolve => apiRequest(`SELECT COUNT(*) FROM clans WHERE isTracking="true"`, (isError, isFound, Data) => { resolve(Data[0]["COUNT(*)"]); }) );
  var Guilds = await new Promise(resolve => apiRequest(`SELECT COUNT(*) FROM guilds`, (isError, isFound, Data) => { resolve(Data[0]["COUNT(*)"]); }) );
  var T_Guilds = await new Promise(resolve => apiRequest(`SELECT COUNT(*) FROM guilds WHERE isTracking="true"`, (isError, isFound, Data) => { resolve(Data[0]["COUNT(*)"]); }) );

  //Now that all data is obtained, save log every 10 minutes.
  var sql = `INSERT INTO status (users_all, users_tracked, players_all, players_tracked, players_online, clans_all, clans_tracked, guilds_all, guilds_tracked, servers, date) VALUES(?,?,?,?,?,?,?,?,?,?,"${ new Date().getTime() }")`
  var inserts = [Users, T_Users, Players, T_Players, O_Players, Clans, T_Clans, Guilds, T_Guilds, Servers];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(error) { console.log(`Failed to log status: ${ error }`); }
    else { console.log(`Logged Status: ${ new Date() }`); }
  });
}

//Interval for 10 minute logging.
var logged = false;
setInterval(function() {
  var numbers = [0,1,2,3,4,5,6]
  if(numbers.includes(new Date().getMinutes() / 10)) {
    if(logged === false) {
      logged = true;
      logStatus();
    }
  }
  else { if(logged) { logged = false; } }
}, 1000);

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
