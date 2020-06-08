//Required Libraraies
const fs = require('fs');
var Misc = require("./misc.js");
const Config = require("../../Combined/configs/config.json");

//Variables
var LogTime = Misc.GetDateString();
var TotalLogData = [];

var ShardErrors = 0;
var OtherErrors = 0;

//Exports
module.exports = { SaveLog, SaveError };

//Functions
function SaveLog(type, log) {
  console.log(Misc.GetReadableDateTime() + " - " + log);
  if(Config.enableLogging) {
    var dateTime = Misc.GetReadableDateTime();
    var dataToSave = [{'DateTime': dateTime, 'Type': type, 'Log': log}];
    TotalLogData.push(dataToSave[0]);
    fs.writeFile('./data/logs/express_' + LogTime + '.json', JSON.stringify(TotalLogData), (err) => {  });
    fs.writeFile('../../../var/www/guardianstats.com/data/marvin/express_log.json', JSON.stringify(TotalLogData), (err) => {  });
  }
}

function SaveError(log) {
  console.log(log);
  if(Config.enableLogging) {
    var dateTime = Misc.GetReadableDateTime();
    var dataToSave = [{'DateTime': dateTime, 'Type': 'Error', 'Log': log}];
    TotalLogData.push(dataToSave[0]);
    fs.writeFile('./data/logs/express_' + LogTime + '.json', JSON.stringify(TotalLogData), (err) => {  });
    fs.writeFile('../../../var/www/guardianstats.com/data/marvin/express_log.json', JSON.stringify(TotalLogData), (err) => {  });
  }
}
