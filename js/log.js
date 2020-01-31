//Required Libraraies
const fs = require('fs');
var Misc = require("./misc.js");
var Config = require("../data/config.json");

//Variables
var LogTime = Misc.GetDateString();
var TotalLogData = [];

var ShardErrors = 0;
var OtherErrors = 0;

//Exports
module.exports = { SaveLog, SaveError, SaveDiscordLog, SaveErrorCounter };

//Functions
function SaveLog(type, log) {
  console.log(Misc.GetReadableDateTime() + " - " + log);
  if(Config.enableLogging) {
    var dateTime = Misc.GetReadableDateTime();
    var dataToSave = [{'DateTime': dateTime, 'Type': type, 'Log': log}];
    TotalLogData.push(dataToSave[0]);
    fs.writeFile('./data/logs/' + LogTime + '.json', JSON.stringify(TotalLogData), (err) => { if (err) console.error(err) });
    fs.writeFile('../../var/www/html/data/marvin/currentLog.json', JSON.stringify(TotalLogData), (err) => { if (err) console.error(err) });
  }
}

function SaveError(log) {
  console.log(log);
  if(Config.enableLogging) {
    var dateTime = Misc.GetReadableDateTime();
    var dataToSave = [{'DateTime': dateTime, 'Type': 'Error', 'Log': log}];
    TotalLogData.push(dataToSave[0]);
    fs.writeFile('./data/logs/' + LogTime + '.json', JSON.stringify(TotalLogData), (err) => { if (err) console.error(err) });
    fs.writeFile('../../var/www/html/data/marvin/currentLog.json', JSON.stringify(TotalLogData), (err) => { if (err) console.error(err) });
  }
}

function SaveDiscordLog(Users, Players, ClanScans, ProcessingClans, ScanLength, LastScanTime, ClansTracked, StartupTime, APIDisabled, client) {
  var thisTime = new Date().getTime();
  var totalTime = thisTime - StartupTime;
  totalTime = Misc.formatTime(totalTime / 1000);
  var status = {
    "users": client.users.size,
    "servers": client.guilds.size,
    "uptime": totalTime,
    "registeredUsers": Users.length,
    "players": Players.length,
    "clans": ClansTracked,
    "processingClans": ProcessingClans,
    "scans": ClanScans,
    "scanTime": ScanLength,
    "lastScan": Misc.formatTime((new Date().getTime() - LastScanTime) / 1000),
    "apiDisabled": APIDisabled
  }
  fs.writeFile('./data/status.json', JSON.stringify(status), (err) => { if (err) console.error(err) });
  fs.writeFile('../../var/www/html/data/marvin/status.json', JSON.stringify(status), (err) => { if (err) console.error(err) });
}

function SaveErrorCounter(type) {
  if(type !== null) {
    if(type === "DestinyShardRelayProxyTimeout") { ShardErrors++; }
    else { OtherErrors++; }
  }
  var errors = {
    "shardErrors": ShardErrors,
    "otherErrors": OtherErrors
  }
  fs.writeFile('./data/errors.json', JSON.stringify(errors), (err) => { if (err) console.error(err) });
  fs.writeFile('../../var/www/html/data/marvin/errors.json', JSON.stringify(errors), (err) => { if (err) console.error(err) });
}
