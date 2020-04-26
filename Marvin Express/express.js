//Express
const MySQL = require('mysql');
const { db } = require("./modules/Database");
const Config = require("../Combined/configs/config.json");
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
app.post("/GetGuildsFromDiscordID", async function(req, res) { await expressPOSTRequest(req, res, `GetGuildsFromDiscordID`, `SELECT * FROM guilds WHERE owner_id="${ req.body.id }" AND owner_avatar="${ req.body.avatar }"`); });
app.post("/GetClan", async function(req, res) { await expressPOSTRequest(req, res, `GetClan`, `SELECT * FROM clans WHERE clan_id="${ req.body.clan_id }"`); });
app.post("/GetClanMembers", async function(req, res) { await expressPOSTRequest(req, res, `GetClanMembers`, `SELECT * FROM playerInfo WHERE clanId="${ req.body.clan_id }"`); });
app.post("/CheckIfPatreon", async function(req, res) { await expressPOSTRequest(req, res, `CheckIfPatreon`, `SELECT * FROM status_tags WHERE membershipId="${ req.body.membershipId }"`); });

//Update Posts
app.post("/UpdateServerInfo", async function(req, res) {
  await expressUpdatePOSTRequest(req, res, `UpdateServerInfo`, 
    `UPDATE 
      guilds
    SET 
      enable_whitelist="${ req.body.enable_whitelist }",
      enable_broadcasts_items="${ req.body.enable_broadcasts_items }",
      enable_broadcasts_titles="${ req.body.enable_broadcasts_titles }",
      enable_broadcasts_clans="${ req.body.enable_broadcasts_clans }",
      enable_broadcasts_dungeons="${ req.body.enable_broadcasts_dungeons }",
      enable_broadcasts_catalysts="${ req.body.enable_broadcasts_catalysts }"
    WHERE 
      owner_id="${ req.body.owner_id }" AND owner_avatar="${ req.body.owner_avatar }" AND joinedOn="${ req.body.joinedOn }"`
  );
});

//Gets
app.get("/GetClans", async function(req, res) { await expressGETRequest(req, res, `GetClans`, `SELECT * FROM clans`); });
app.get("/GetCurrentStatus", async function(req, res) { await expressGETRequest(req, res, `GetCurrentStatus`, `SELECT * FROM status ORDER BY id DESC LIMIT 1`); });
app.get("/GetDailyStatus", async function(req, res) { await expressGETRequest(req, res, `GetDailyStatus`, `SELECT * FROM status WHERE date > ${ new Date().getTime() - 86400000 } AND date <= ${ new Date().getTime() }`); });
app.get("/GetWeeklyStatus", async function(req, res) { await expressGETRequest(req, res, `GetWeeklyStatus`, `SELECT * FROM status WHERE date > ${ new Date().getTime() - 604800000 } AND date <= ${ new Date().getTime() }`); });
app.get("/GetMonthlyStatus", async function(req, res) { await expressGETRequest(req, res, `GetMonthlyStatus`, `SELECT * FROM status WHERE date > ${ new Date().getTime() - 2592000000 } AND date <= ${ new Date().getTime() }`); });
app.get("/GetClanRankings", async function(req, res) { await expressGETClanRankings(req, res, `GetClanRankings`); });

//JSON Gets
app.get("/GetFrontLog", async function(req, res) { await expressGETJSON(req, res, `GetFrontendLog`, `https://guardianstats.com/data/marvin/frontend_log.json`) });
app.get("/GetBackLog", async function(req, res) { await expressGETJSON(req, res, `GetBackLog`, `https://guardianstats.com/data/marvin/backend_log.json`) });
app.get("/GetFrontStatus", async function(req, res) { await expressGETJSON(req, res, `GetFrontStatus`, `https://guardianstats.com/data/marvin/frontend_status.json`) });
app.get("/GetBackStatus", async function(req, res) { await expressGETJSON(req, res, `GetBackStatus`, `https://guardianstats.com/data/marvin/backend_status.json`) });

//Request Processing
async function expressPOSTRequest(req, res, name, sql) {
  Log.SaveLog("Request", `POST Request; From: ${ req.headers["x-forwarded-for"] } to: ${ name }`);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error: ${ error }`); res.status(200).send({ error: "Failed" }); }
    else { if(rows.length > 0) { res.status(200).send({ error: null, data: rows }) } else { res.status(200).send({ error: "No data found" }) } }
  });
}
async function expressUpdatePOSTRequest(req, res, name, sql) {
  Log.SaveLog("Request", `UPDATE POST Request; From: ${ req.headers["x-forwarded-for"] } to: ${ name }`);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error: ${ error }`); res.status(200).send({ error: "Failed" }); }
    else { res.status(200).send({ error: null, data: "Successfully updated guild information..." }) }
  });
}
async function expressGETRequest(req, res, name, sql) {
  Log.SaveLog("Request", `GET Request; From: ${ req.headers["x-forwarded-for"] } to: ${ name }`);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error: ${ error }`); res.status(200).send({ error: "Failed" }); }
    else { if(rows.length > 0) { res.status(200).send({ error: null, data: rows }) } else { res.status(200).send({ error: "No data found" }) } }
  });
}
async function expressGETClanRankings(req, res, name, url) {
  Log.SaveLog("Request", `GET Request to: ${ name }`);
  db.query("SELECT * FROM clans WHERE isTracking='true'", function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error: ${ error }`); res.status(200).send({ error: "Failed" }); }
    else {
      const clans = rows;
      db.query("SELECT * FROM playerInfo", function(error, rows, fields) {
        if(!!error) { Log.SaveError(`Error: ${ error }`); res.status(200).send({ error: "Failed" }); }
        else {
          var clanLeaderboards = [];
          for(var i in clans) {
            //Ignore non-tracked clans
            if(!clanLeaderboards.find(e => e.clan_id === clans[i].clan_id)) {
            var totalTimePlayed = 0;
            var totalTriumphScore = 0;
            var totalibKills = 0;
            var totalibWins = 0;
            var totalSundialCompletions = 0;
            var totalWellsCompleted = 0;
            var totalMenageire = 0;
            var totalLeviCompletions = 0;
            var totalEowCompletions = 0;
            var totalSosCompletions = 0;
            var totalLastWishCompletions = 0;
            var totalScourgeCompletions = 0;
            var totalSorrowsCompletions = 0;
            var totalGardenCompletions = 0;
            var totalRaidCompletions = 0;
            var totalSeasonRanks = 0;
            var totalFractaline = 0;
            var totalResonance = 0;
              //Scan each player add to respective clans
              for(var j in rows) {
                if(rows[j].clanId === clans[i].clan_id) {
                  totalTimePlayed = totalTimePlayed + rows[j].timePlayed;
                  totalTriumphScore = totalTriumphScore + rows[j].triumphScore;
                  totalibKills = totalibKills + rows[j].ibKills;
                  totalibWins = totalibWins + rows[j].ibWins;
                  totalSundialCompletions = totalSundialCompletions + rows[j].sundialCompletions;
                  totalWellsCompleted = totalWellsCompleted + rows[j].wellsCompleted;
                  totalMenageire = totalMenageire + rows[j].menageireEncounters;
                  totalLeviCompletions = totalLeviCompletions + ( rows[j].leviCompletions + rows[j].leviPresCompletions );
                  totalEowCompletions = totalEowCompletions + ( rows[j].eowCompletions + rows[j].eowPresCompletions );
                  totalSosCompletions = totalSosCompletions + ( rows[j].sosCompletions + rows[j].sosPresCompletions );
                  totalLastWishCompletions = totalLastWishCompletions + rows[j].lastWishCompletions;
                  totalScourgeCompletions = totalScourgeCompletions + rows[j].scourgeCompletions;
                  totalSorrowsCompletions = totalSorrowsCompletions + rows[j].sorrowsCompletions;
                  totalGardenCompletions = totalGardenCompletions + rows[j].gardenCompletions;
                  totalSeasonRanks = totalSeasonRanks + rows[j].seasonRank;
                  totalFractaline = totalFractaline + rows[j].fractalineDonated;
                  totalResonance = totalResonance + (rows[j].resonance+2);
                }
              }
              //Finally save all that data
              clanLeaderboards.push({
                "clan_id": clans[i].clan_id,
                "clan_name": clans[i].clan_name,
                "data": {
                  "timePlayed": totalTimePlayed,
                  "triumphScore": totalTriumphScore,
                  "ibKills": totalibKills,
                  "ibWins": totalibWins,
                  "sundial": totalSundialCompletions,
                  "wells": totalWellsCompleted,
                  "menageire": totalMenageire,
                  "leviCompletions": totalLeviCompletions,
                  "eowCompletions": totalEowCompletions,
                  "sosCompletions": totalSosCompletions,
                  "lwCompletions": totalLastWishCompletions,
                  "scourgeCompletions": totalScourgeCompletions,
                  "sorrowsCompletions": totalSorrowsCompletions,
                  "gardenCompletions": totalGardenCompletions,
                  "totalRaids": (totalLeviCompletions + totalEowCompletions + totalSosCompletions + totalLastWishCompletions + totalScourgeCompletions + totalSorrowsCompletions + totalGardenCompletions),
                  "seasonRanks": totalSeasonRanks,
                  "fractalineDonated": totalFractaline,
                  "resonance": totalResonance
                }
              });
            }
          }
          res.status(200).send({ error: null, data: clanLeaderboards })
        }
      });
    }
  });
}
async function expressGETJSON(req, res, name, url) {
  Log.SaveLog("Request", `JSON Request; From: ${ req.headers["x-forwarded-for"] } to: ${ name }`);
  const headers = { headers: { "Content-Type": "application/json" } };
  const request = await fetch(url, headers);
  const response = await request.json();
  if(request.ok) { res.status(200).send({ error: null, data: response }) }
  else { res.status(200).send({ error: "No data found" }) }
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
  var Broadcasts = await new Promise(resolve => apiRequest(`SELECT COUNT(*) FROM broadcasts`, (isError, isFound, Data) => { resolve(Data[0]["COUNT(*)"]); }) );

  //Check API status
  if(backend_status.APIDisabled) { O_Players = 0; }
  var APIDisabled = backend_status.APIDisabled ? "Disabled" : "Online";

  //Now that all data is obtained, save log every 10 minutes.
  var sql = `INSERT INTO status (users_all, users_tracked, players_all, players_tracked, players_online, clans_all, clans_tracked, guilds_all, guilds_tracked, servers, broadcasts, api_status, date) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,"${ new Date().getTime() }")`
  var inserts = [Users, T_Users, Players, T_Players, O_Players, Clans, T_Clans, Guilds, T_Guilds, Servers, Broadcasts, APIDisabled];
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
