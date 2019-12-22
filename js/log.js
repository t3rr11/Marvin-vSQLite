//Required Libraraies
const fs = require('fs');
var Misc = require("../js/misc.js");

//Variables
var LogTime = Misc.GetDateString();
var TotalLogData = [];
var canLog = true;

//Exports
module.exports = { SaveLog, SaveDiscordLog };

//Functions
function SaveLog(type, log) {
  if(canLog == true){
    var dateTime = Misc.GetReadableDateTime();
    var dataToSave = [{'DateTime': dateTime, 'Type': type, 'Log': log}];
    TotalLogData.push(dataToSave[0]);
    fs.writeFile('./data/logs/' + LogTime + '.json', JSON.stringify(TotalLogData), (err) => { if (err) console.error(err) });
    fs.writeFile('../../var/www/html/data/marvin/currentLog.json', JSON.stringify(TotalLogData), (err) => { if (err) console.error(err) });
  }
}

function SaveDiscordLog(Clans, Players, ClanScans, ClansTracked, StartupTime, client) {
  var thisTime = new Date().getTime();
  var totalTime = thisTime - StartupTime;
  totalTime = Misc.formatTime(totalTime / 1000);
  var status = {
    "users": client.users.size,
    "servers": client.guilds.size,
    "uptime": totalTime,
    "players": Players.length,
    "clans": ClansTracked,
    "scans": ClanScans
  }
  fs.writeFile('./data/status.json', JSON.stringify(status), (err) => { if (err) console.error(err) });
  fs.writeFile('../../var/www/html/data/marvin/status.json', JSON.stringify(status), (err) => { if (err) console.error(err) });
}
