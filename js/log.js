//Required Libraraies
const fs = require('fs');
var Misc = require("../js/misc.js");

//Variables
var LogTime = Misc.GetDateString();
var TotalLogData = [];
var canLog = true;

//Exports
module.exports = { SaveLog };

//Functions
function SaveLog(type, log) {
  if(canLog == true){
    var dateTime = Misc.GetReadableDateTime();
    var dataToSave = [{'DateTime': dateTime, 'Type': type, 'Log': log}];
    TotalLogData.push(dataToSave[0]);
    fs.writeFile('./data/logs/' + LogTime + '.json', JSON.stringify(TotalLogData), (err) => { if (err) console.error(err) });
  }
}
