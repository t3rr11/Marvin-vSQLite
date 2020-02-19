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
module.exports = { SaveLog, SaveError, SaveDiscordLog };

//Functions
function SaveLog(type, log) {
  console.log(Misc.GetReadableDateTime() + " - " + log);
  if(Config.enableLogging) {
    var dateTime = Misc.GetReadableDateTime();
    var dataToSave = [{'DateTime': dateTime, 'Type': type, 'Log': log}];
    TotalLogData.push(dataToSave[0]);
    fs.writeFile('./data/logs/frontend_' + LogTime + '.json', JSON.stringify(TotalLogData), (err) => { if (err) console.error(err) });
    fs.writeFile('../../../var/www/html/data/marvin/frontend_log.json', JSON.stringify(TotalLogData), (err) => { if (err) console.error(err) });
  }
}

function SaveError(log) {
  console.log(log);
  if(Config.enableLogging) {
    var dateTime = Misc.GetReadableDateTime();
    var dataToSave = [{'DateTime': dateTime, 'Type': 'Error', 'Log': log}];
    TotalLogData.push(dataToSave[0]);
    fs.writeFile('./data/logs/frontend_' + LogTime + '.json', JSON.stringify(TotalLogData), (err) => { if (err) console.error(err) });
    fs.writeFile('../../../var/www/html/data/marvin/frontend_log.json', JSON.stringify(TotalLogData), (err) => { if (err) console.error(err) });
  }
}

function SaveDiscordLog(Clans, Players, StartupTime, client) {
  var thisTime = new Date().getTime();
  var totalTime = thisTime - StartupTime;
  totalTime = Misc.formatTime(totalTime / 1000);
  var status = {
    "users": client.users.size,
    "servers": client.guilds.size,
    "clans": Clans.length,
    "players": Players.length,
    "uptime": totalTime
  }
  fs.writeFile('./data/frontend_status.json', JSON.stringify(status), (err) => { if (err) console.error(err) });
  fs.writeFile('../../../var/www/html/data/marvin/frontend_status.json', JSON.stringify(status), (err) => { if (err) console.error(err) });
}
