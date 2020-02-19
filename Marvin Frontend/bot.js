//Required Libraraies
const Discord = require('discord.js');
const fs = require('fs');
const client = new Discord.Client();

//Modules
let Config = require(__dirname + "/data/config.json");
let Misc = require(__dirname + '/js/misc.js');
let Log = require(__dirname + '/js/log.js');
let Database = require(__dirname + '/modules/Database.js');
let DiscordCommands = require(__dirname + '/modules/DiscordCommands.js');
let Register = require(__dirname + '/modules/Register.js');
let ManageClans = require(__dirname + '/modules/ManageClans.js');
let Broadcasts = require(__dirname + '/modules/Broadcasts.js');

//Data
var Clans = [];
var NewClans = [];
var Guilds = [];
var Players = [];
var Users = [];
var StartupTime = new Date().getTime();
var CommandsInput = 0;
var LastScanTime = null;
var ScanLength = null;
var APIDisabled = null;
var TimedOutUsers = [];

//Functions
function UpdateActivityList() {
  if(APIDisabled) { client.user.setActivity("The Bungie API is undergoing maintenance. Commands will work like normal but may not show the latest information due to this."); }
  else {
    var ActivityList = [];
    ActivityList.push(`Serving ${client.users.size} users`);
    ActivityList.push('Tracking ' + Players.length + ' players!');
    ActivityList.push('Tracking ' + Clans.length + ' clans!');
    ActivityList.push(`Use ~HELP for Support`);
    ActivityList.push(`Consider ~Supporting`);
    var activity = ActivityList[Math.floor(Math.random() * ActivityList.length)];
    client.user.setActivity(activity);
  }
}

//New Commands
async function CheckMaintenance() {
  //Check if api is down for maintenance
  var backend_status = JSON.parse(fs.readFileSync('../Marvin Backend/data/backend_status.json').toString());
  if(APIDisabled === null) { APIDisabled = backend_status.APIDisabled; }
  else {
    if(backend_status.APIDisabled) { if(APIDisabled === false) { Log.SaveError("The Bungie API is temporarily disabled for maintenance."); APIDisabled = true; } }
    else { if(APIDisabled === true) { Log.SaveError("The Bungie API is back online!"); APIDisabled = false; } }
  }
}
async function CheckForNewlyScannedClans() {
  await new Promise(resolve => Database.GetClans((isError, Data) => { Clans = Data; resolve(true); }) );
  await new Promise(resolve => Database.GetGuilds((isError, Data) => { Guilds = Data; resolve(true); }) );
  await new Promise(resolve => Database.GetPlayers((isError, Data) => { Players = Data; resolve(true); }) );
  await new Promise(resolve => Database.GetUsers((isError, Data) => { Users = Data; resolve(true); }) );
  for(var i in Clans) {
    if(Clans[i].firstScan === "true") {
      if(!NewClans.find(e => e === Clans[i].clan_id)) {
        //Found new clan, added.
        NewClans.push(Clans[i].clan_id);
      }
    }
    else {
      if(NewClans.find(e => e === Clans[i].clan_id)) {
        //Remove and broadcast that it's finished loading.
        NewClans.splice(NewClans.indexOf(Clans[i].clan_id), 1);
        Broadcasts.SendFinishedLoadingAnnouncement(client, Clans[i]);
      }
    }
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
function GetScanSpeed(message) {
  var backend_status = JSON.parse(fs.readFileSync('../Marvin Backend/data/backend_status.json').toString());
  console.log(backend_status);
  message.channel.send(`ScanSpeed is scanning at a rate of ${ backend_status.scanSpeed } clans per second. With a slow down rate of ${ Math.round(backend_status.scanSpeed * 0.8) } and a reset of ${ Math.round(backend_status.scanSpeed * 0.6) }`);
}
function SetScanSpeed(message, input) {
  var backend_config = JSON.parse(fs.readFileSync('../Marvin Backend/data/config.json').toString());
  backend_config.scan_speed = parseInt(input);
  fs.writeFile('../Marvin Backend/data/config.json', JSON.stringify(backend_config), (err) => { if (err) console.error(err) });
  message.channel.send(`ScanSpeed is now scanning at a rate of ${ input } clans per second. With a slow down rate of ${ Math.round(input * 0.8) } and a reset of ${ Math.round(input * 0.6) }`);
}
function CheckForBroadcasts() {
  Database.GetNewBroadcasts(async function (isError, isFound, broadcasts) {
    for(var i in broadcasts) {
      await new Promise(resolve =>
        Database.CheckNewBroadcast(broadcasts[i].membershipId, broadcasts[i].season, broadcasts[i].broadcast, function (isError, isFound) {
          if(!isFound) { Broadcasts.SendBroadcast(client, broadcasts[i]); }
          else { Database.RemoveAwaitingBroadcast(broadcasts[i]); }
          resolve(true);
        })
      );
    }
  });
}

//Discord Client Code
client.on("ready", async () => {
  //Define variables
  await CheckMaintenance();
  await CheckForNewlyScannedClans();

	//SetTimeouts
	setInterval(function() { UpdateActivityList() }, 10000);
	setInterval(function() { CheckForBroadcasts() }, 10000);
	setInterval(function() { CheckForNewlyScannedClans() }, 10000);
  setInterval(function() { Log.SaveDiscordLog(Clans, Players, StartupTime, client) }, 10000);

  //Start Up Console Log
  Log.SaveLog("Info", `Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
  Log.SaveLog("Info", 'Tracking ' + Players.length + ' players!');
  Log.SaveLog("Info", 'Tracking ' + Clans.length + ' clans!');
});

client.on("guildCreate", guild => {
  //Joined a server
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
client.on("guildDelete", guild => {
  //Removed from a server
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
        else if(command.startsWith("~SET SCANSPEED ")) { var input = command.substr("~SET SCANSPEED ".length); SetScanSpeed(message, input); }
        else if(command === "~REGISTER") { message.reply("To register please use: Use: `~Register example` example being your steam name."); }
        else if(command === "~DONATE" || command === "~SPONSOR" || command === "~SUPPORTING") { message.channel.send("Want to help support future updates or bots? Visit my Patreon! https://www.patreon.com/Terrii"); }
        else if(command === "~HELP" || command === "~COMMANDS") { DiscordCommands.Help(message); }
        else if(command === "~PROFILE") { DiscordCommands.Profile(message); }
        else if(command === "~FORCE RESCAN") { DiscordCommands.ForceFullScan(message); }
        else if(command === "~SCANSPEED") { GetScanSpeed(message); }
        else if(command === "~CHECKAPI") { if(APIDisabled) { message.reply("API is offline."); } else { message.reply("API is online."); } }
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
        else if(command.startsWith("~BLACKLIST ")) { Broadcasts.AddToBlacklist(message, default_command.substr("~BLACKLIST ".length)); }
        else if(command.startsWith("~WHITELIST ")) { Broadcasts.AddToWhitelist(message, default_command.substr("~WHITELIST ".length)); }
        else if(command.startsWith("~ADD CLAN")) { ManageClans.AddClan(message, command.substr("~ADD CLAN ".length)); }
        else if(command.startsWith("~REMOVE CLAN")) { ManageClans.RemoveClan(message, command.substr("~REMOVE CLAN ".length)); }
        else if(command.startsWith("~TRANSFER ")) { DiscordCommands.TransferLeadership(message); }
        else if(command === "~BROADCASTS HELP") { DiscordCommands.BroadcastsHelp(message); }
        else if(command === "~REMOVE BROADCASTS") { Broadcasts.RemoveBroadcasts(message); }
        else if(command === "~SET BROADCASTS") { message.reply("Please set the broadcasts channel by tagging it in the message. E.g: `~Set Broadcasts #general`"); }
        else if(command === "~TOGGLE WHITELIST") { DiscordCommands.ToggleWhitelist(message); }
        else if(command === "~SET CLAN") { ManageClans.RegisterClan(message); }
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
      console.log(err);
      try { message.reply("Missing permissions."); }
      catch (err) { Log.SaveError("Failed to send permissions message due to missing permissions... Duh."); }
      Log.SaveError("Failed to send message due to missing permissions.");
    }
  }
});

client.on('error', async error => { console.log(error.message); });
client.login(Config.token);
