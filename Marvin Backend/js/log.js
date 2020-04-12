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
module.exports = { SaveLog, SaveError, SaveBackendStatus, SaveErrorCounter };

//Functions
function SaveLog(type, log) {
  console.log(Misc.GetReadableDateTime() + " - " + log);
  if(Config.enableLogging) {
    var dateTime = Misc.GetReadableDateTime();
    var dataToSave = [{'DateTime': dateTime, 'Type': type, 'Log': log}];
    TotalLogData.push(dataToSave[0]);
    fs.writeFile('./data/logs/backend_' + LogTime + '.json', JSON.stringify(TotalLogData), (err) => { if (err) console.error(err) });
    fs.writeFile('../../../var/www/guardianstats.com/data/marvin/backend_log.json', JSON.stringify(TotalLogData), (err) => { if (err) console.error(err) });
  }
}

function SaveError(log) {
  console.log(log);
  if(Config.enableLogging) {
    var dateTime = Misc.GetReadableDateTime();
    var dataToSave = [{'DateTime': dateTime, 'Type': 'Error', 'Log': log}];
    TotalLogData.push(dataToSave[0]);
    fs.writeFile('./data/logs/backend_' + LogTime + '.json', JSON.stringify(TotalLogData), (err) => { if (err) console.error(err) });
    fs.writeFile('../../../var/www/guardianstats.com/data/marvin/backend_log.json', JSON.stringify(TotalLogData), (err) => { if (err) console.error(err) });
  }
}

function SaveBackendStatus(ClanScans, ScanLength, LastScanTime, StartupTime, ProcessingClans, ScanSpeed, APIDisabled) {
  var thisTime = new Date().getTime();
  var totalTime = thisTime - StartupTime;
  var lastScan = thisTime - LastScanTime;
  var status = {
    "scanSpeed": ScanSpeed,
    "processingClans": ProcessingClans,
    "uptime": totalTime,
    "scans": ClanScans,
    "scanTime": ScanLength,
    "lastScan": lastScan,
    "APIDisabled": APIDisabled
  }
  fs.writeFile('./data/backend_status.json', JSON.stringify(status), (err) => { if (err) console.error(err) });
  fs.writeFile('../../../var/www/guardianstats.com/data/marvin/backend_status.json', JSON.stringify(status), (err) => { if (err) console.error(err) });
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
  fs.writeFile('../../../var/www/guardianstats.com/data/marvin/errors.json', JSON.stringify(errors), (err) => { if (err) console.error(err) });
}
