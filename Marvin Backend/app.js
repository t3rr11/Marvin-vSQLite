//Modules
const fs = require('fs');
let Config = require('../Combined/configs/config.json');
let Backend_config = require('../Combined/configs/backend_config.json');
let Misc = require(__dirname + '/js/misc.js');
let Log = require(__dirname + '/js/log.js');
let Database = require(__dirname + '/modules/Database.js');
let ClanData = require(__dirname + '/modules/ClanData.js');

//Data
var Users = [];
var Players = [];
var Clans = [];
var Definitions = [];
var StartupTime = new Date().getTime();
var CommandsInput = 0;
var ClanScans = 0;
var ScanSpeed = Backend_config.scan_speed;
var ProcessingClans = null;
var LastScanTime = null;
var ScanLength = null;
var APIDisabled = false;
var currentSeason = 0;

async function CheckMaintenance() {
  //Check if api is down for maintenance using my clan id.
  await ClanData.GetClanDetails("3917089").then(function(data) {
    if(data.error && data.reason.ErrorCode === 5) { if(APIDisabled === false) { Log.SaveError("The Bungie API is temporarily disabled for maintenance."); APIDisabled = true; } }
    else { if(APIDisabled === true) { Log.SaveError("The Bungie API is back online!"); APIDisabled = false; } }
  });
}

async function CheckScanSpeedChange() {
  var newConfig = JSON.parse(fs.readFileSync('../Combined/configs/backend_config.json').toString());
  if(newConfig.scan_speed !== ScanSpeed) { ScanSpeed = newConfig.scan_speed; }
}


async function UpdateLocalData() {
  await new Promise(resolve => Database.GetClans((isError, Data) => { if(!isError) { Clans = Data; } resolve(true); }) );
  await new Promise(resolve => Database.GetUsers((isError, Data) => { if(!isError) { Users = Data; } resolve(true); }) );
  await new Promise(resolve => Database.GetPlayers((isError, Data) => { if(!isError) { Players = Data; } resolve(true); }) );
  await new Promise(resolve => Database.GetDefinitions((isError, Data) => { if(!isError) { Definitions = Data; } resolve(true); }) );

  Log.SaveBackendStatus(ClanScans, ScanLength, LastScanTime, StartupTime, ScanSpeed, APIDisabled);
}

async function StartUp() {
  //Startup checks
  Log.SaveErrorCounter(null);
  await CheckMaintenance();
  await UpdateLocalData();

  //Define variables
  var id = -1; //The current id value that the scanner is scanning.
  var trackedClans = [];
  var allTrackedClans = [];
  var processingClans = [];
  var startTime = new Date().getTime();
  LastScanTime = new Date().getTime();

  async function CheckProcessingClans() {
    for(let i in processingClans) {
      var clan = processingClans[i];
      if((((new Date() - new Date(clan.added)) / 1000) / 60) > 10) {
        processingClans.splice(processingClans.indexOf(processingClans.find(e => e.clan_id === clan.clan_id)), 1);
        console.log(`${ clan.clan_id } has been removed from the Queue due to timeout. (${ Math.floor(((new Date() - new Date(clan.added)) / 1000) / 60) } mins)`);
      }
    }
  }

  //Clan scanner function
  clanScanner = async function() {
    id++; //Increase id value to make sure this scans the next aval clan.
    ProcessingClans = processingClans.length; //Keep track of how many clans have started to be scanned.

    //Alorigthm to check how many clans are being processed, for optimal time we want this to be between 20-30 at all times possible. But never over 30.
    if(processingClans.length >= Math.round(ScanSpeed * 0.8)) { setTimeout(clanScanner, 1000 * 5); }
    else if(processingClans.length >= ScanSpeed) { setTimeout(clanScanner, 1000 * 120); }
    else { setTimeout(clanScanner, 100); }

    //Reset function, this will restart the scanning process if marvin has scanned mostly all clans. Again trying to keep above 20 so it will rescan before it is finished the previous scan.
    function restartTracking() {
      LastScanTime = new Date().getTime();
      Database.GetGuilds(function(isError, Data) {
        if(!isError) {
          ScanLength = new Date().getTime() - startTime; //Get timing of last scan. This is for tracking purposes.
          trackedClans = []; //These are all the clans that need to be scanned.
          allTrackedClans = []; //This is all the tracked clans, The difference is this is to log how many clans there are, rather than what clans to scan, this prevents duplication scanning.

          //Check processing clans, If any are taking longer than 15 minutes, remove from processing queue and re-add.
          for(var i in processingClans) { if((new Date().getTime() - processingClans[i].added) > (1000 * 60 * 15)) { processingClans.splice(processingClans.indexOf(processingClans.find(e => e.clan_id === processingClans[i].clan_id)), 1); } }

          //Loop through all clans and see which ones need to be scanned.
          for(var i in Data) {
            if(Data[i].isTracking === "true") {
              //Create total count of clans tracked
              var clans = Data[i].clans.split(",");
              for(var j in clans) {
                //Check if clan has been added to the total clan list, if not add it.
                if(!allTrackedClans.find(e => e === clans[j])) { allTrackedClans.push(clans[j]); }
                //Check to see if clan is already being processed
                if(!processingClans.find(e => e.clan_id === clans[j])) {
                  //If clan is not being processed, check if it has already been added to the scan list.
                  if(!trackedClans.find(e => e.clan_id === clans[j])) {
                    trackedClans.push({ "guild_id": Data[i].guild_id, "clan_id": clans[j] });
                  }
                }
              }
            }
          }
          //Store the total clan list length in the ClansTracked variable. Reset the scan timer and reset the id value back to the start.
          startTime = new Date().getTime();
          id = -1;
        }
      });
    }

    //Checks, these will determine what marvin should do with the data his recieved. Does he need to scan the clan, wait, restart or reset if error.
    if(id < trackedClans.length) {
      var processingData = { "guild_id": trackedClans[id].guild_id, "clan_id": trackedClans[id].clan_id, "added": new Date().getTime() }
      processingClans.push(processingData);
      try { await ClanData.CheckClanMembers(trackedClans[id], Definitions).then(function(clan_id) { processingClans.splice(processingClans.indexOf(processingClans.find(e => e.clan_id === clan_id)), 1); }); ClanScans++; }
      catch (err) {
        if(err.type === "invalid-json") { }
        else if(err.errno && err.errno === "ETIMEDOUT") { }
        else { console.log('\x1b[31m%s\x1b[0m', "Failed to update clan: " + err); }
      }
    }
    else {
      if(!APIDisabled) {
        if((new Date().getTime() - new Date(LastScanTime).getTime()) > 1800000) {
          Log.SaveError("I stopped scanning for 30 minutes, so i have automatically reset.");
          Log.SaveLog("Info", "I stopped scanning for 30 minutes, so i have automatically reset.");
          console.log(`processingClans.length: ${ processingClans.length }`);
          console.log(`Math.round(ScanSpeed * 0.6): ${ Math.round(ScanSpeed * 0.6) }`);
          console.log(`processingClans:`);
          console.log(processingClans);
          processingClans = [];
          restartTracking();
        }
        else if(processingClans.length <= Math.round(ScanSpeed * 0.6)) {
          if((new Date().getTime() - new Date(LastScanTime).getTime()) > 5000) {
            restartTracking();
          }
        }
      }
    }
  };

  if(Config.enableTracking) {
    //Start scanning...
    clanScanner();
  }

	//SetTimeouts
	setInterval(function() { CheckMaintenance() }, 1000 * 60 * 5);
	setInterval(function() { UpdateLocalData() }, 1000 * 60 * 1);
	setInterval(function() { CheckScanSpeedChange() }, 1000 * 60 * 1);
	setInterval(function() { CheckProcessingClans() }, 1000 * 60 * 1);
  setInterval(function() { Log.SaveBackendStatus(ClanScans, ScanLength, LastScanTime, StartupTime, ProcessingClans, ScanSpeed, APIDisabled) }, 10000);

  //Start Up Console Log
  if(Config.enableDebug){ console.clear(); }
  Log.SaveLog("Info", `Backend server has started.`);
  Log.SaveLog("Info", `Tracking ${ Config.enableTracking ? "Enabled." : "Disabled." }`);
};

StartUp();
