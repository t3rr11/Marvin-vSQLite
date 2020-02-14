//Required Libraraies
const Discord = require('discord.js');
const fs = require('fs');
const fsExtra = require('fs-extra');
const client = new Discord.Client();

//Modules
let Config = require(__dirname + "/data/config.json");
let Misc = require(__dirname + '/js/misc.js');
let Log = require(__dirname + '/js/log.js');
let Database = require(__dirname + '/modules/Database.js');
let Dashboard = require(__dirname + '/modules/Express.js');
let DiscordCommands = require(__dirname + '/modules/DiscordCommands.js');
let ClanData = require(__dirname + '/modules/ClanData.js');
let Register = require(__dirname + '/modules/Register.js');
let ManageClans = require(__dirname + '/modules/ManageClans.js');
let Broadcasts = require(__dirname + '/modules/Broadcasts.js');

//Data
var Users = [];
var Players = [];
var Clans = [];
var StartupTime = new Date().getTime();
var CommandsInput = 0;
var ClanScans = 0;
var ClansTracked = 0;
var ScanSpeed = 30;
var ProcessingClans = null;
var LastScanTime = null;
var ScanLength = null;
var APIDisabled = false;
var TimedOutUsers = [];

//Exports
module.exports = { client, CommandsInput, ClanScans, StartupTime };

//Functions
function UpdateActivityList() {
  if(APIDisabled) { client.user.setActivity("The Bungie API is undergoing maintenance. Commands will work like normal but may not show the latest information due to this."); }
  else {
    var ActivityList = [];
    ActivityList.push(`Serving ${client.users.size} users`);
    ActivityList.push('Tracking ' + Players.length + ' players!');
    ActivityList.push('Tracking ' + ClansTracked + ' clans!');
    ActivityList.push(`Use ~HELP for Support`);
    ActivityList.push(`Consider ~Supporting`);
    var activity = ActivityList[Math.floor(Math.random() * ActivityList.length)];
    client.user.setActivity(activity);
  }
}
function CheckTimeout(message) {
  if(TimedOutUsers.includes(message.author.id)) { message.reply("You've been timed out. This lasts 5 minutes from your last " + Config.prefix + "request command. This is to protect from spam, sorry!"); return false; }
  else { SetTimeout(message); return true; }
}
function SetTimeout(message) {
  TimedOutUsers.push(message.author.id);
  setTimeout(function() { TimedOutUsers.splice(TimedOutUsers.findIndex(id => id === message.author.id), 1); }, 300000);
}
function UpdateUsersClans() {
  Database.GetRegisteredUsersFromDB(function(isError, Data) { if(!isError) { Users = Data; } });
  Database.GetRegisteredClansFromDB(function(isError, Data) { if(!isError) { Clans = Data; } });
  Database.GetTrackedPlayersFromDB(function(isError, Data) { if(!isError) { Players = Data; } });
}
function CheckMaintenance() {
  //Check if api is down for maintenance
  ClanData.GetClanMembers("3917089").then(function(error) {
    if(error === "SystemDisabled") { if(APIDisabled === false) { Log.SaveError("The Bungie API is temporarily disabled for maintenance."); APIDisabled = true; } }
    else { if(APIDisabled === true) { Log.SaveError("The Bungie API is back online!"); APIDisabled = false; } }
  });
}
function ChangeScanSpeed(message, input) {
  if(message.author.id == "194972321168097280") { ScanSpeed = input; message.channel.send(`ScanSpeed changed to: ${ ScanSpeed }`); }
  else { message.reply("You are not allowed to use this command. Sorry."); }
}
function GetScanSpeed(message) {
  message.channel.send(`ScanSpeed is scanning at a rate of ${ ScanSpeed } clans per second. With a slow down rate of ${ Math.round(ScanSpeed * 0.8) } and a reset of ${ Math.round(ScanSpeed * 0.6) }`);
}

//Init Before Discord Ready
UpdateUsersClans();
CheckMaintenance();
Log.SaveErrorCounter(null);

//Discord Client Code
client.on("ready", async () => {
  //Define variables
  var id = -1;
  var clansToScan = [];
  var trackedClans = [];
  var totalTrackedClans = [];
  var processingClans = [];
  var startTime = new Date().getTime();
  LastScanTime = new Date().getTime();

  //Get clans for first scan
  for(var i in Clans) {
    if(Clans[i].isTracking === "true") {
      if(!clansToScan.find(e => e === Clans[i].guild_id)) { clansToScan.push(Clans[i].guild_id); }
      var serverIds = Clans[i].server_clan_ids.split(",");
      for(var j in serverIds) { if(!trackedClans.find(e => e === serverIds[j])) { trackedClans.push(serverIds[j]); } }
    }
  }
  ClansTracked = trackedClans.length;

  //Clan scanner function
  clanScanner = async function() {
    //Keep track of how many clans have started to be scanned.
    id++;
    ProcessingClans = processingClans.length;

    //Alorigthm to check how many clans are being processed, for optimal time we want this to be between 20-30 at all times possible. But never over 30.
    if(processingClans.length >= Math.round(ScanSpeed * 0.8)) { setTimeout(clanScanner, 1000 * 5); }
    else if(processingClans.length >= ScanSpeed) { setTimeout(clanScanner, 1000 * 120); }
    else { setTimeout(clanScanner, 100); }

    //Reset function, this will restart the scanning process if marvin has scanned mostly all clans. Again trying to keep above 20 so it will rescan before it is finished the previous scan.
    function restartTracking() {
      LastScanTime = new Date().getTime();
      Database.GetRegisteredClansFromDB(function(isError, Data) {
        if(!isError) {
          ScanLength = Misc.formatTime((new Date().getTime() - startTime) / 1000);
          clansToScan = [];
          trackedClans = [];
          totalTrackedClans = [];
          for(var i in Data) {
            //Create total count of clans tracked
            var totalServerIds = Data[i].server_clan_ids.split(",");
            for(var j in totalServerIds) {
              if(!totalTrackedClans.find(e => e === totalServerIds[j])) {
                totalTrackedClans.push(totalServerIds[j]);
              }
            }
            //Start checking to see which clans need to be scanned
            if(Data[i].isTracking === "true") {
              //Check to see if clan is already being scanned
              if(!processingClans.find(e => e === Data[i].guild_id)) {
                //If clan is not being scanned, add it to the scan list
                clansToScan.push(Data[i].guild_id);
                var serverIds = Data[i].server_clan_ids.split(",");
                for(var j in serverIds) {
                  if(!trackedClans.find(e => e === serverIds[j])) {
                    trackedClans.push(serverIds[j]);
                  }
                }
              }
            }
          }
          ClansTracked = totalTrackedClans.length;
          startTime = new Date().getTime();
          id = -1;
        }
      });
    }

    //Checks, these will determine what marvin should do with the data his recieved. Does he need to scan the clan, wait, restart or reset if error.
    if(id < clansToScan.length) {
      processingClans.push(clansToScan[id]);
      try { await ClanData.CheckClanMembers(clansToScan[id], client); ClanScans++; }
      catch (err) { console.log('\x1b[31m%s\x1b[0m', "Failed to update clan: " + clansToScan[id], err); }
      processingClans.splice( processingClans.indexOf(processingClans.find(e => e === clansToScan[id])), 1);
    }
    else {
      if(!APIDisabled) {
        if((new Date().getTime() - new Date(LastScanTime).getTime()) > 1800000) {
          Log.SaveError("I stopped scanning for 30 minutes, so i have automatically reset.");
          processingClans = [];
          restartTracking();
        }
        else if(processingClans.length < Math.round(ScanSpeed * 0.6)) {
          if((new Date().getTime() - new Date(LastScanTime).getTime()) > 5000) {
            restartTracking();
          }
        }
      }
    }
  };
  if(Config.enableTracking) { clanScanner(); }

	//SetTimeouts
	setInterval(function() { UpdateActivityList() }, 10000);
	setInterval(function() { UpdateUsersClans() }, 30000);
	setInterval(function() { CheckMaintenance() }, 1000 * 60 * 5);
  setInterval(function() { Log.SaveDiscordLog(Users, Players, ClanScans, ProcessingClans, ScanLength, LastScanTime, ClansTracked, StartupTime, APIDisabled, client) }, 10000);
  setInterval(function() { Log.SaveErrorCounter(null) }, 10000);

  //Start Up Console Log
  Log.SaveLog("Info", `Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
  Log.SaveLog("Info", 'Tracking ' + Users.length + ' players!');
  Log.SaveLog("Info", 'Tracking ' + ClansTracked + ' clans!');
  Log.SaveLog("Info", `Tracking ${ Config.enableTracking ? "Enabled." : "Disabled." }`);
});

//Joined a server
client.on("guildCreate", guild => {
  try {
    Log.SaveLog("Server", "Joined a new guild: " + guild.name);
    Database.EnableTracking(guild.id, function(isError, isFound) {
      if(!isError) {
        if(isFound) {
          Log.SaveLog("Clans", "Clan Tracking Re-Enabled: " + guild.name);
        }
        else {
          const embed = new Discord.RichEmbed()
          .setColor(0x0099FF)
          .setAuthor("Hey there!")
          .setDescription("I am Marvin. To set me up first register with me by using the `~Register example` command. Replace example with your in-game username. \n\nOnce registration is complete use the `~Set clan` command and **then wait 5 minutes** whilst I scan your clan. That's it you'll be ready to go! \n\nTry out clan broadcasts this can be set up by typing `~Set Broadcasts #general` (does not have to be general). \n\nSee `~help` to see what I can do!")
          .setFooter(Config.defaultFooter, Config.defaultLogoURL)
          .setTimestamp();
          try { Misc.getDefaultChannel(guild).send({ embed }) } catch (err) { console.log(`Failed to give welcome message to: ${ guild.name } (${ guild.id })`); }
        }
      }
    });
  }
  catch (err) { console.log("Failed to re-enable tracking for a clan."); }
});

//Removed from a server
client.on("guildDelete", guild => {
    console.log(Misc.GetReadableDateTime() + " - " + "Left a guild: " + guild.name);
    Log.SaveLog("Server", "Left a guild: " + guild.name);
    Database.DisableTracking(guild.id);
});

//Detected message
client.on("message", async message => {
  //Translate command
  var default_command = message.content;
  var command = message.content.toUpperCase();

  //Commands
  if(message.author.bot) return;
  if(command.startsWith('~') && !command.startsWith('~~')) {
    try {
      if(message.guild) {
        if(command.startsWith("~REGISTER ")) { if(command.substr("~REGISTER ".length) !== "EXAMPLE") { Register(message, message.author.id, command.substr("~REGISTER ".length)); } else { message.reply("To register please use: Use: `~Register example` example being your steam name."); } }
        else if(command.startsWith("~REQUEST ")) { if(CheckTimeout(message)) { DiscordCommands.Request(client, message); } }
        else if(command.startsWith("~DEL ")) { var amount = command.substr("~DEL ".length); Misc.DeleteMessages(message, amount); }
        else if(command.startsWith("~SET SCANSPEED ")) { var input = command.substr("~SET SCANSPEED ".length); ChangeScanSpeed(message, input); }
        else if(command === "~REGISTER") { message.reply("To register please use: Use: `~Register example` example being your steam name."); }
        else if(command === "~DONATE" || command === "~SPONSOR" || command === "~SUPPORTING") { message.channel.send("Want to help support future updates or bots? Visit my Patreon! https://www.patreon.com/Terrii"); }
        else if(command === "~STATUS") { DiscordCommands.Status(Users, Players, ClanScans, ClansTracked, StartupTime, client, message); }
        else if(command === "~HELP" || command === "~COMMANDS") { DiscordCommands.Help(message); }
        else if(command === "~PROFILE") { DiscordCommands.Profile(message); }
        else if(command === "~FORCE RESCAN") { DiscordCommands.ForceFullScan(message); }
        else if(command === "~SCANSPEED") { GetScanSpeed(message); }
        else if(command === "~TEST") {
          if(message.author.id === "194972321168097280") {
            //message.reply("We saw and we did nothing.");
          }
          else {
            message.reply("Test what? I do not understand.");
          }
        }

        //Rankings
        else if(command.startsWith("~DRYSTREAK ")) { DiscordCommands.DryStreak(message, command.substr("~DRYSTREAK ".length)) }
        else if(command.startsWith("~ITEM ")) { DiscordCommands.Rankings("item", message); }
        else if(command.startsWith("~TITLE ")) { DiscordCommands.Rankings("title", message); }
        else if(command === "~INFAMY") { DiscordCommands.Rankings("infamy", message); }
        else if(command === "~VALOR") { DiscordCommands.Rankings("valor", message); }
        else if(command === "~GLORY") { DiscordCommands.Rankings("glory", message); }
        else if(command === "~IRON BANNER") { DiscordCommands.Rankings("ironBanner", message); }
        else if(command === "~LEVIATHAN" || command === "~LEVI") { DiscordCommands.Rankings("levi", message); }
        else if(command === "~PRESTIGELEVIATHAN" || command === "~PRESTIGELEVI" || command === "~PLEVI") { DiscordCommands.Rankings("leviPres", message); }
        else if(command === "~EATEROFWORLDS" || command === "~EOW") { DiscordCommands.Rankings("eow", message); }
        else if(command === "~PRESTIGEEATEROFWORLDS" || command === "~PRESTIGEEOW" || command === "~PEOW") { DiscordCommands.Rankings("eowPres", message); }
        else if(command === "~SPIREOFSTARS" || command === "~SOS") { DiscordCommands.Rankings("sos", message); }
        else if(command === "~PRESTIGESPIRE" || command === "~PRESTIGESOS" || command === "~PSOS") { DiscordCommands.Rankings("sosPres", message); }
        else if(command === "~LW" || command === "~LAST WISH") { DiscordCommands.Rankings("lastWish", message); }
        else if(command === "~SOTP" || command === "~SCOURGE") { DiscordCommands.Rankings("scourge", message); }
        else if(command === "~COS" || command === "~CROWN") { DiscordCommands.Rankings("sorrows", message); }
        else if(command === "~GOS" || command === "~GARDEN") { DiscordCommands.Rankings("garden", message); }
        else if(command === "~SUNDIAL") { DiscordCommands.Rankings("sundial", message); }
        else if(command === "~FRACTALINE") { DiscordCommands.Rankings("fractaline", message); }
        else if(command === "~RESONANCE") { DiscordCommands.Rankings("resonance", message); }
        else if(command === "~TRIUMPH SCORE" || command === "~TRIUMPHSCORE") { DiscordCommands.Rankings("triumphScore", message); }
        else if(command === "~CLAN TIME" || command === "~TIME PLAYED" || command === "~TOTAL TIME" || command === "~TOTALTIME" || command === "~TIME") { DiscordCommands.Rankings("totalTime", message);  }
        else if(command === "~SEASON RANKS" || command === "~SEASONRANKS" || command === "~SEASON RANK" || command === "~SEASONRANK") { DiscordCommands.Rankings("seasonRank", message); }
        else if(command === "~ITEMS") { DiscordCommands.GetTrackedItems(message); }
        else if(command === "~TITLES") { DiscordCommands.GetTrackedTitles(message); }

        //Clan Management
        else if(command.startsWith("~SET BROADCASTS ")) { Broadcasts.SetupBroadcasts(message); }
        else if(command.startsWith("~FILTER ")) { Broadcasts.AddToBlacklist(message, default_command.substr("~FILTER ".length)); }
        else if(command.startsWith("~WHITELIST ")) { Broadcasts.AddToWhitelist(message, default_command.substr("~WHITELIST ".length)); }
        else if(command.startsWith("~ADD CLAN")) { ManageClans.AddClan(message, command.substr("~ADD CLAN ".length)); }
        else if(command.startsWith("~REMOVE CLAN")) { ManageClans.RemoveClan(message, command.substr("~REMOVE CLAN ".length)); }
        else if(command.startsWith("~TRANSFER ")) { DiscordCommands.TransferLeadership(message); }
        else if(command === "~BROADCASTS HELP") { DiscordCommands.BroadcastsHelp(message); }
        else if(command === "~REMOVE BROADCASTS") { Broadcasts.RemoveBroadcasts(message); }
        else if(command === "~SET BROADCASTS") { message.reply("Please set the broadcasts channel by tagging it in the message. E.g: `~Set Broadcasts #general`"); }
        else if(command === "~TOGGLE WHITELIST") { DiscordCommands.ToggleWhitelist(message); }
        else if(command === "~SET CLAN") { ManageClans.RegisterClan(message); }
        else if(command === "~DELETE CLAN") { ManageClans.UserDeleteClan(message); }
        else if(command === "~TRACKED CLANS" || command === "~CLANS TRACKED") { DiscordCommands.GetTrackedClans(message); }
        else if(command === "~REAUTH") { DiscordCommands.RenewLeadership(message); }

        //Globals
        else if(command.startsWith("~GLOBAL DRYSTREAK ")) { DiscordCommands.GlobalDryStreak(message, command.substr("~GLOBAL DRYSTREAK ".length)) }
        else if(command === "~GLOBAL IRON BANNER") { DiscordCommands.GlobalRankings("ironBanner", message); }
        else if(command === "~GLOBAL SEASON RANK") { DiscordCommands.GlobalRankings("seasonRank", message); }
        else if(command === "~GLOBAL FRACTALINE") { DiscordCommands.GlobalRankings("fractaline", message); }
        else if(command === "~GLOBAL RESONANCE") { DiscordCommands.GlobalRankings("resonance", message); }
        else if(command === "~GLOBAL CLAN TIME" || command === "~GLOBAL TIME PLAYED" || command === "~GLOBAL TOTAL TIME" || command === "~GLOBAL TOTALTIME") { DiscordCommands.GlobalRankings("totalTime", message); }
        else if(command === "~GLOBAL TRIUMPH SCORE" || command === "~GLOBAL TRIUMPHSCORE") { DiscordCommands.GlobalRankings("triumphScore", message); }

        //Clan Global Rankings
        else if(command === "~CLANRANK FRACTALINE") {  DiscordCommands.DisplayClanRankings("fractaline", message);  }
        else if(command === "~CLANRANK RESONANCE") {  DiscordCommands.DisplayClanRankings("resonance", message);  }

        //Other
        else if(command.startsWith("~PLAY")) { } // Ignore this command
        else { message.reply('I\'m not sure what that commands is sorry. Use ~help to see commands.').then(msg => { msg.delete(2000) }).catch(); }

        try { Log.SaveLog("Command", 'User: ' + message.member.user.tag + ', Command: ' + command); }
        catch (err) { try { Log.SaveError('Tried to log command in: ' + message.guild.name + ', Command: ' + command); } catch (err) {  } }
      }
      else { message.reply("Using this bots features can only be used in a server. Sorry about that!"); }
    }
    catch (err) {
      try { message.reply("Missing permissions."); }
      catch (err) { Log.SaveError("Failed to send permissions message due to missing permissions... Duh."); }
      Log.SaveError("Failed to send message due to missing permissions.");
    }
  }
});

client.on('error', console.error);
client.login(Config.token);
