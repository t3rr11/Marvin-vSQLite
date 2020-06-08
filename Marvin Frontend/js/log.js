//Required Libraraies
const fs = require('fs');
var Misc = require("./misc.js");
const Config = require('../../Combined/configs/config.json');

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
    fs.writeFile('../../../var/www/guardianstats.com/data/marvin/frontend_log.json', JSON.stringify(TotalLogData), (err) => { if (err) console.error(err) });
  }
}

function SaveError(log) {
  console.log(log);
  if(Config.enableLogging) {
    var dateTime = Misc.GetReadableDateTime();
    var dataToSave = [{'DateTime': dateTime, 'Type': 'Error', 'Log': log}];
    TotalLogData.push(dataToSave[0]);
    fs.writeFile('./data/logs/frontend_' + LogTime + '.json', JSON.stringify(TotalLogData), (err) => { if (err) console.error(err) });
    fs.writeFile('../../../var/www/guardianstats.com/data/marvin/frontend_log.json', JSON.stringify(TotalLogData), (err) => { if (err) console.error(err) });
  }
}

function SaveDiscordLog(StartupTime, Users, CommandsInput, currentSeason, client) {
  var thisTime = new Date().getTime();
  var totalTime = thisTime - StartupTime;
  var status = {
    "users": Users,
    "servers": client.guilds.size,
    "commandsInput": CommandsInput,
    "uptime": totalTime,
    "currentSeason": currentSeason
  }
  fs.writeFile('./data/frontend_status.json', JSON.stringify(status), (err) => { if (err) console.error(err) });
  fs.writeFile('../../../var/www/guardianstats.com/data/marvin/frontend_status.json', JSON.stringify(status), (err) => { if (err) console.error(err) });
}
