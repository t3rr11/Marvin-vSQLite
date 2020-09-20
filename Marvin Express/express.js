//Express
const { db } = require("./modules/Database");
const APIRequestHandler = require("./modules/APIRequestHandler");
const WiFiModuleHandler = require("./modules/WiFiModuleHandler");
const Log = require("./js/log.js");
const fs = require('fs');
const cors = require("cors")
const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
var app = express();

app.use(cors());
app.use(compression());
app.use(bodyParser.json({ extended: true }));

module.exports = { app };

//Posts
app.post("/GetGuildsFromDiscordID", async function(req, res) { await APIRequestHandler.expressPOSTRequest(req, res, `GetGuildsFromDiscordID`, `SELECT * FROM guilds WHERE owner_id="${ req.body.id }" AND owner_avatar="${ req.body.avatar }"`); });
app.post("/GetClan", async function(req, res) { await APIRequestHandler.expressPOSTRequest(req, res, `GetClan`, `SELECT * FROM clans WHERE clan_id="${ req.body.clan_id }"`); });
app.post("/GetClanMembers", async function(req, res) { await APIRequestHandler.expressPOSTRequest(req, res, `GetClanMembers`, `SELECT * FROM playerInfo WHERE clanId="${ req.body.clan_id }"`); });
app.post("/CheckIfPatreon", async function(req, res) { await APIRequestHandler.expressPOSTRequest(req, res, `CheckIfPatreon`, `SELECT * FROM status_tags WHERE membershipId="${ req.body.membershipId }"`); });

//Update Posts
app.post("/UpdateServerInfo", async function(req, res) {
  await APIRequestHandler.expressUpdatePOSTRequest(req, res, `UpdateServerInfo`, 
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
app.get("/GetClans", async function(req, res) { await APIRequestHandler.expressGETRequest(req, res, `GetClans`, `SELECT * FROM clans`); });
app.get("/GetCurrentStatus", async function(req, res) { await APIRequestHandler.expressGETRequest(req, res, `GetCurrentStatus`, `SELECT * FROM status ORDER BY id DESC LIMIT 1`); });
app.get("/GetDailyStatus", async function(req, res) { await APIRequestHandler.expressGETRequest(req, res, `GetDailyStatus`, `SELECT * FROM status WHERE date > ${ new Date().getTime() - 86400000 } AND date <= ${ new Date().getTime() }`); });
app.get("/GetWeeklyStatus", async function(req, res) { await APIRequestHandler.expressGETRequest(req, res, `GetWeeklyStatus`, `SELECT * FROM status WHERE date > ${ new Date().getTime() - 604800000 } AND date <= ${ new Date().getTime() }`); });
app.get("/GetMonthlyStatus", async function(req, res) { await APIRequestHandler.expressGETRequest(req, res, `GetMonthlyStatus`, `SELECT * FROM status WHERE date > ${ new Date().getTime() - 2592000000 } AND date <= ${ new Date().getTime() }`); });

//JSON Gets
app.get("/GetFrontLog", async function(req, res) { await APIRequestHandler.expressGETJSON(req, res, `GetFrontendLog`, `https://guardianstats.com/data/marvin/frontend_log.json`) });
app.get("/GetBackLog", async function(req, res) { await APIRequestHandler.expressGETJSON(req, res, `GetBackLog`, `https://guardianstats.com/data/marvin/backend_log.json`) });
app.get("/GetFrontStatus", async function(req, res) { await APIRequestHandler.expressGETJSON(req, res, `GetFrontStatus`, `https://guardianstats.com/data/marvin/frontend_status.json`) });
app.get("/GetBackStatus", async function(req, res) { await APIRequestHandler.expressGETJSON(req, res, `GetBackStatus`, `https://guardianstats.com/data/marvin/backend_status.json`) });

//Formatted Gets
app.get("/GetReport", async function(req, res) { await APIRequestHandler.GetReport(req, res, `GetReport`) });
app.get("/GetClanRankings", async function(req, res) { await APIRequestHandler.GetClanRankings(req, res, `GetClanRankings`); });

//This stuff is for the WiFi module. Leave alone.
app.get("/GetTitles", async function(req, res) { await WiFiModuleHandler.GetPlayerTitles(req, res, `GetPlayerTitles`); });

//Below this point is the status logging, quite important.

//Interval for 10 minute status logging.
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

async function apiRequest(sql, callback) {
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error: ${ error }`); callback(true); }
    else { if(rows.length > 0) { callback(false, true, rows); } else { callback(false, false); } }
  });
}

async function logStatus() {
  //Get all data together
  var backend_status = JSON.parse(fs.readFileSync('../Marvin Backend/data/backend_status.json').toString());
  var frontend_status = await new Promise(resolve => apiRequest(`SELECT * FROM frontend_status ORDER BY id DESC LIMIT 1`, (isError, isFound, Data) => { resolve(Data[0]); }) );
  var Users = frontend_status.users;
  var Servers = frontend_status.servers;
  var T_Users = await new Promise(resolve => apiRequest(`SELECT COUNT(*) FROM users`, (isError, isFound, Data) => { resolve(Data[0]["COUNT(*)"]); }) );
  var PlayersCount = await new Promise(resolve => apiRequest(`SELECT COUNT(*) FROM playerInfo`, (isError, isFound, Data) => { resolve(Data[0]["COUNT(*)"]); }) );
  var Players = await new Promise(resolve => apiRequest(`SELECT * FROM playerInfo`, (isError, isFound, Data) => { resolve(Data); }) );
  var T_Players = await new Promise(resolve => apiRequest(`SELECT member_count FROM clans`, (isError, isFound, Data) => { var count = 0; for(var i in Data) { count = count + Data[i].member_count } resolve(count); }) );
  var O_Players = await new Promise(resolve => apiRequest(`SELECT online_players FROM clans`, (isError, isFound, Data) => { var count = 0; for(var i in Data) { count = count + Data[i].online_players } resolve(count); }) );
  var Clans = await new Promise(resolve => apiRequest(`SELECT COUNT(*) FROM clans`, (isError, isFound, Data) => { resolve(Data[0]["COUNT(*)"]); }) );
  var T_Clans = await new Promise(resolve => apiRequest(`SELECT COUNT(*) FROM clans WHERE isTracking="true"`, (isError, isFound, Data) => { resolve(Data[0]["COUNT(*)"]); }) );
  var Guilds = await new Promise(resolve => apiRequest(`SELECT COUNT(*) FROM guilds`, (isError, isFound, Data) => { resolve(Data[0]["COUNT(*)"]); }) );
  var T_Guilds = await new Promise(resolve => apiRequest(`SELECT COUNT(*) FROM guilds WHERE isTracking="true"`, (isError, isFound, Data) => { resolve(Data[0]["COUNT(*)"]); }) );
  var Broadcasts = await new Promise(resolve => apiRequest(`SELECT COUNT(*) FROM broadcasts`, (isError, isFound, Data) => { resolve(Data[0]["COUNT(*)"]); }) );
  
  //Get and sort Guardian games data
  Players = Players.filter(e => JSON.parse(e.guardianGames) !== null);
  var Guardian_Games = {
    All: { Warlock: 0, Hunter: 0, Titan: 0 },
    Online: { Warlock: 0, Hunter: 0, Titan: 0 },
    Medals: { Warlock: 0, Hunter: 0, Titan: 0 },
    Laurels: { Warlock: 0, Hunter: 0, Titan: 0 }
  };
  for(var i in Players) {
    let lastPlayed = parseInt(Players[i].lastPlayed);
    if((new Date().getTime() - new Date(lastPlayed).getTime()) < (1000 * 60 * 15)) { Guardian_Games.Online[Players[i].currentClass]++; }
    Guardian_Games.All[Players[i].currentClass]++;
    Guardian_Games.Medals[Players[i].currentClass] = parseInt(Guardian_Games.Medals[Players[i].currentClass]) + parseInt(JSON.parse(Players[i].guardianGames).medals);
    Guardian_Games.Laurels[Players[i].currentClass] = parseInt(Guardian_Games.Laurels[Players[i].currentClass]) + parseInt(JSON.parse(Players[i].guardianGames).laurels);
  }

  //Check API status
  if(backend_status.APIDisabled) { O_Players = 0; }
  var APIDisabled = backend_status.APIDisabled ? "Disabled" : "Online";

  //Now that all data is obtained, save log every 10 minutes.
  var sql = `INSERT INTO status (users_all, users_tracked, players_all, players_tracked, players_online, clans_all, clans_tracked, guilds_all, guilds_tracked, servers, broadcasts, guardian_games, api_status, date) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,"${ new Date().getTime() }")`
  var inserts = [Users, T_Users, PlayersCount, T_Players, O_Players, Clans, T_Clans, Guilds, T_Guilds, Servers, Broadcasts, JSON.stringify(Guardian_Games), APIDisabled];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(error) { console.log(`Failed to log status: ${ error }`); }
    else { console.log(`Logged Status: ${ new Date() }`); }
  });
}

app.listen(3000, function () { Log.SaveLog("Normal", "Express is listening on port 3000...") });
