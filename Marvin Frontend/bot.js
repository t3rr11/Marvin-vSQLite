//Required Libraraies
const Discord = require('discord.js');
const fs = require('fs');
const client = new Discord.Client();
const DBL = require("dblapi.js");
const dbl = new DBL('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYzMTM1MTM2Njc5OTA2NTA4OCIsImJvdCI6dHJ1ZSwiaWF0IjoxNTg0NDIxMzAxfQ.qZ5CrrQdaC9cIfeuqx7svNTwiSTH_R0JD5H-1CVzrCo', client);

//Modules
let Config = require('../Combined/configs/config.json');
let Misc = require(__dirname + '/js/misc.js');
let Log = require(__dirname + '/js/log.js');
let Database = require(__dirname + '/modules/Database.js');
let DiscordCommands = require(__dirname + '/modules/DiscordCommands.js');
let Register = require(__dirname + '/modules/Register.js');
let ManageClans = require(__dirname + '/modules/ManageClans.js');
let Broadcasts = require(__dirname + '/modules/Broadcasts.js');

//Data
var ClansLength = null;
var NewClans = [];
var StartupTime = new Date().getTime();
var CommandsInput = 0;
var APIDisabled = null;
var TimedOutUsers = [];
var BannedUsers = [];
var Users = 0;
var NewSeasonCountdown = null;
var NewSeasonDate = null;

//Functions
function UpdateActivityList() {
  if(APIDisabled) { client.user.setActivity("The Bungie API is undergoing maintenance. Commands will work like normal but may not show the latest information due to this."); }
  else {
    var ActivityList = [];
    ActivityList.push(`Serving ${ Users } users`);
    ActivityList.push(`Tracking ${ ClansLength } clans!`);
    ActivityList.push(`Use ~HELP for Support`);
    ActivityList.push(`Consider Donating? ~Donate`);
    ActivityList.push(`Try ~Trials`);
    ActivityList.push(`Try ~Guardian Games`);
    ActivityList.push(`Try ~Season`);
    var activity = ActivityList[Math.floor(Math.random() * ActivityList.length)];
    client.user.setActivity(activity);
  }
}

//New Commands
async function CheckMaintenance() {
  //Check if api is down for maintenance
  try {
    var backend_status = JSON.parse(fs.readFileSync('../Marvin Backend/data/backend_status.json').toString());
    if(APIDisabled === null) { APIDisabled = backend_status.APIDisabled; }
    else {
      if(backend_status.APIDisabled) { if(APIDisabled === false) { Log.SaveError("The Bungie API is temporarily disabled for maintenance."); APIDisabled = true; } }
      else { if(APIDisabled === true) { Log.SaveError("The Bungie API is back online!"); APIDisabled = false; } }
    }
  }
  catch (err) { console.log(Misc.GetReadableDateTime() + " - " + "Failed to check for maintenance as the data was corrupt."); }
}
async function UpdateClans() {
  //Grab discord user count first
  Users = 0; for(let g of client.guilds.array()) { Users = Users + (g.members.size - 1) }

  //Then continue
  CheckMaintenance();
  CheckForBroadcasts();
  UpdateActivityList();
  UpdateBannedUsers();

  //Log status
  Log.SaveDiscordLog(StartupTime, Users, CommandsInput, client);

  await new Promise(resolve => Database.GetClans((isError, Clans) => {
    ClansLength = Clans.length;
    CheckForNewlyScannedClans(Clans);
    resolve(true);
  }));
}
function CheckForNewlyScannedClans(Clans) {
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
function CheckForBroadcasts() {
  Database.GetNewBroadcasts(async function (isError, isFound, broadcasts) {
    for(var i in broadcasts) {
      if(broadcasts[i].type === "clan") {
        await new Promise(resolve =>
          Database.CheckNewClanBroadcast(broadcasts[i].clanId, broadcasts[i].season, broadcasts[i].broadcast, function (isError, isFound) {
            if(!isFound) { Broadcasts.SendBroadcast(client, broadcasts[i]); }
            else { Database.RemoveAwaitingClanBroadcast(broadcasts[i]); }
            resolve(true);
          })
        );
      }
      else {
        await new Promise(resolve =>
          Database.CheckNewBroadcast(broadcasts[i].membershipId, broadcasts[i].season, broadcasts[i].broadcast, function (isError, isFound) {
            if(!isFound) { Broadcasts.SendBroadcast(client, broadcasts[i]); }
            else { Database.RemoveAwaitingBroadcast(broadcasts[i]); }
            resolve(true);
          })
        );
      }
    }
  });
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
  var backend_config = JSON.parse(fs.readFileSync('../Combined/configs/backend_config.json').toString());
  backend_config.scan_speed = parseInt(input);
  fs.writeFile('../Combined/configs/backend_config.json', JSON.stringify(backend_config), (err) => { if (err) console.error(err) });
  message.channel.send(`ScanSpeed is now scanning at a rate of ${ input } clans per second. With a slow down rate of ${ Math.round(input * 0.8) } and a reset of ${ Math.round(input * 0.6) }`);
}
function CheckNewSeason() {
  if(NewSeasonDate !== null) {
    if(new Date(NewSeasonDate) - new Date() < 0) {
      Config.newSeasonDate = new Date(new Date(NewSeasonDate).getTime() + 7776000000).toISOString();
      Config.currentSeason = Config.currentSeason + 1;
      NewSeasonDate = null;
      fs.writeFile('../Combined/configs/config.json', JSON.stringify(Config), (err) => { if (err) console.error(err) });
      try { client.guilds.get('664237007261925404').channels.get('664237007261925409').send(`A new season is upon us. The current season has been changed from ${ Config.currentSeason-1 } to ${ Config.currentSeason }`); }
      catch (err) { console.log("Failed to send new season message."); }
    }
  }
  else { NewSeasonDate = Config.newSeasonDate; }
}
function GetTimeLeftOnSeason() { return Misc.formatTime(Math.ceil((NewSeasonCountdown._idleStart + NewSeasonCountdown._idleTimeout - Date.now()) / 1000)); }
function ForceTopGGUpdate(message) { dbl.postStats(client.guilds.size); message.channel.send("Updated stats on Top.GG"); }
function UpdateBannedUsers() { try { BannedUsers = JSON.parse(fs.readFileSync('./data/banned_users.json').toString()); } catch(err) { console.log("Couldn't parse banned users file."); } }
function CheckBanned(message) {
  var isFound = BannedUsers.find(usr => usr.id == message.author.id);
  if(isFound !== undefined) {
    const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("You have been banned and can no longer use this bots features.")
      .setDescription(`**User:** ${ message.author.username }\n**Reason:** ${ isFound.reason }`)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp();
    message.channel.send({embed});
    return true;
  }
  else { return false; }
}
function AddBannedUser(message) {
  var id = message.content.toUpperCase().substr(6, 18);
  var reason = message.content.substr(`~MBAN ${ id } `.length);
  if(!BannedUsers.find(usr => usr.id == id)) {
    BannedUsers.push({
      "id": id,
      "reason": reason.length > 4 ? reason : "You have been banned."
    });
    fs.writeFile('./data/banned_users.json', JSON.stringify(BannedUsers), (err) => { if (err) console.error(err) });
    const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("User has been banned!")
      .setDescription(`**User:** ${ id }\n**Reason:** ${ reason.length > 4 ? reason : "You have been banned." }`)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp();
    message.channel.send({embed});
  }
  else { message.reply("Cannot ban this user as they are already banned. To unban please use: ~MUNBAN"); }
}
function RemoveBannedUser(message) {
  var id = message.content.toUpperCase().substr(8, 18);
  if(BannedUsers.find(usr => usr.id == id)) {
    BannedUsers.splice(BannedUsers.indexOf(BannedUsers.find(usr => usr.id === id)), 1);
    fs.writeFile('./data/banned_users.json', JSON.stringify(BannedUsers), (err) => { if (err) console.error(err) });
    const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("User has been unbanned!")
      .setDescription(`**User:** ${ id }`)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp();
    message.channel.send({embed});
  }
  else { message.reply("Cannot Unban as this user is not banned."); }
}
function ChangeBannedUser(message) {
  var id = message.content.toUpperCase().substr(9, 18);
  if(BannedUsers.find(usr => usr.id == id)) {
    var user = BannedUsers.find(usr => usr.id == id);
    var previousReason = user.reason;
    var newReason = message.content.substr(`~MCHANGE ${ id } `.length);
    if(newReason.length > 4) {
      user.reason = newReason;
      fs.writeFile('./data/banned_users.json', JSON.stringify(BannedUsers), (err) => { if (err) console.error(err) });
      const embed = new Discord.RichEmbed()
        .setColor(0x0099FF)
        .setAuthor("Reason for users ban updated.")
        .setDescription(`**User:** ${ user.id }\n**Previous Reason:** ${ previousReason }\n**Reason:** ${ user.reason }`)
        .setFooter(Config.defaultFooter, Config.defaultLogoURL)
        .setTimestamp();
      message.channel.send({embed});
    }
    else { message.reply("No reason specified.. Did not update."); }
  }
  else { message.reply("Cannot change reason as this user is not banned."); }
}
function ViewBans(message) {
  const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor("Here lies a list of banned users. Who no longer have access to Marvins features.")
    .setDescription(
      BannedUsers.map((user) => {
        return (`**User: ** ${ user.id }\n**Reason: ** ${ user.reason }\n`)
      })
    )
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp();
  message.channel.send({embed});
}

//Discord Client Code
client.on("ready", async () => {
  if(ClansLength === null) {
    //Define variables
    await UpdateClans();
  
    //SetTimeouts
    setInterval(function() { UpdateClans() }, 10000);
    setInterval(() => { dbl.postStats(client.guilds.size); }, 1800000);
    NewSeasonCountdown = setInterval(() => { CheckNewSeason(); }, 1000)
  
    //Start Up Console Log
    if(Config.enableDebug){ console.clear(); }
    Log.SaveLog("Info", `Bot has started, with ${ Users } users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
    Log.SaveLog("Info", `Tracking ${ ClansLength } clans!`);
  }
  else { Log.SaveError(`Bot lost connection to discord, It has been reconnected now, but in order to avoid spam broadcasts the startup funciton has been cancelled, As the bot has already started.`); }
});

client.on("guildCreate", guild => {
  //Joined a server
  try {
    Log.SaveLog("Server", "Joined a new guild: " + guild.name);
    Database.EnableTracking(guild.id, function(isError, isFound) {
      if(!isError) {
        if(isFound) { Log.SaveLog("Clans", "Clan Tracking Re-Enabled: " + guild.name); }
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

  //Ignored Commands
  var ignoredCommands = [
    "~~", "~PLAY", "~PRUNE", "~PURGE", "~FEED", "~PAY", "~GRAB", "~BANK", "~VAULT", "~BAL", "~BUY", "~SELECT", "~SHOOT", "~SHOP", "~OPEN", "~STEAL",
    "~DRUGS", "~EXCH", "~BM", "~SMOKE", "~DOSE", "~COLLECT", "~KIDNAPPED", "~ADOPT", "~GOOSE", "~HARVEST", "~SLOTS", "~BRIEFCASES", "~DRUG", "~SPOUSE",
    "~UPGRADE", "~PUNCH"
  ];

  //Commands
  if(message.author.bot) return;
  if(message.guild) {
    if(message.guild.id === "110373943822540800" || message.guild.id === "264445053596991498") return;
    if(command.startsWith("~") && ignoredCommands.filter(f => command.startsWith(f)).length === 0 && !command.endsWith("~")) {
      try {
        if(command.startsWith("~REGISTER ")) { if(!CheckBanned(message)) { if(command.substr("~REGISTER ".length) !== "EXAMPLE") { Register(message, message.author.id, command.substr("~REGISTER ".length)) } else { message.reply("To register please use: Use: `~Register example` example being your steam name.") } } }
        else if(command.startsWith("~REQUEST ")) { if(!CheckBanned(message)) { if(CheckTimeout(message)) { DiscordCommands.Request(client, message) } } }
        else if(command.startsWith("~DEL ")) { if(!CheckBanned(message)) { var amount = command.substr("~DEL ".length); Misc.DeleteMessages(message, amount); } }
        else if(command.startsWith("~SET SCANSPEED ")) { if(!CheckBanned(message)) { var input = command.substr("~SET SCANSPEED ".length); SetScanSpeed(message, input); } }
        else if(command.startsWith("~PROFILE ")) { if(!CheckBanned(message)) { DiscordCommands.Profile(message); } }
        else if(command.startsWith("~MBAN ")) { if(message.author.id === "194972321168097280") { AddBannedUser(message) } else { message.channel.send("No permission to use this command."); } }
        else if(command.startsWith("~MUNBAN ")) { if(message.author.id === "194972321168097280") { RemoveBannedUser(message) } else { message.channel.send("No permission to use this command."); } }
        else if(command.startsWith("~MCHANGE ")) { if(message.author.id === "194972321168097280") { ChangeBannedUser(message) } else { message.channel.send("No permission to use this command."); } }
        else if(command === "~REGISTER") { if(!CheckBanned(message)) { message.reply("To register please use: Use: `~Register example` example being your steam name."); } }
        else if(command === "~DONATE" || command === "~SPONSOR" || command === "~SUPPORTING") { if(!CheckBanned(message)) { message.channel.send("Want to help support future updates or bots? Visit my Patreon! https://www.patreon.com/Terrii"); } }
        else if(command === "~PROFILE") { if(!CheckBanned(message)) { DiscordCommands.Profile(message); } }
        else if(command === "~FORCE RESCAN") { if(message.author.id === "194972321168097280") { DiscordCommands.ForceFullScan(message); } else { message.channel.send("No permission to use this command."); } }
        else if(command === "~FORCE GUILD CHECK") { if(message.author.id === "194972321168097280") { DiscordCommands.ForceGuildCheck(client, message); } else { message.channel.send("No permission to use this command."); } }
        else if(command === "~FORCE TOPGG") { if(message.author.id === "194972321168097280") { ForceTopGGUpdate(message); } else { message.channel.send("No permission to use this command."); } }
        else if(command === "~MBANS") { if(message.author.id === "194972321168097280") { ViewBans(message); } else { message.channel.send("No permission to use this command."); } }
        else if(command === "~SCANSPEED") { if(!CheckBanned(message)) { GetScanSpeed(message); } }
        else if(command === "~CHECKAPI") { if(APIDisabled) { message.reply("API is offline."); } else { message.reply("API is online."); } }
        else if(command === "~NEW SEASON" || command === "~SEASON 11" || command === "~NEXT SEASON") {
          if(new Date(NewSeasonDate) - new Date() > 0) { message.channel.send(`Next season starts in: ${ Misc.formatTime((new Date(NewSeasonDate) - new Date().getTime()) / 1000) }`); }
          else { message.channel.send(`Season ${ Config.currentSeason } has already started!`) }
        }
        else if(command === "~CURRENT SEASON" || command === "~SEASON") { message.channel.send(`Destiny 2 is currently in season ${ Config.currentSeason }. Season ${ Config.currentSeason+1 } starts in: ${ Misc.formatTime((new Date(NewSeasonDate) - new Date().getTime()) / 1000) }`) }
        else if(command === "~TEST") {
          if(message.author.id === "194972321168097280") {
            //message.reply("We saw and we did nothing.");
          }
          else {
            message.reply("Test what? I do not understand.");
          }
        }

        //Help menu
        else if(command.startsWith("~HELP ")) {
          if(!CheckBanned(message)) {
            if(command === "~HELP RANKINGS") { DiscordCommands.Help(message, "rankings"); }
            else if(command === "~HELP RAIDS") { DiscordCommands.Help(message, "raids"); }
            else if(command === "~HELP ITEMS") { DiscordCommands.Help(message, "items"); }
            else if(command === "~HELP TITLES") { DiscordCommands.Help(message, "titles"); }
            else if(command === "~HELP SEASONAL") { DiscordCommands.Help(message, "seasonal"); }
            else if(command === "~HELP PRESEASONAL" || command === "~HELP PRE-SEASONAL") { DiscordCommands.Help(message, "preseasonal"); }
            else if(command === "~HELP CLANS" || command === "~HELP CLAN") { DiscordCommands.Help(message, "clan"); }
            else if(command === "~HELP GLOBALS" || command === "~HELP GLOBAL") { DiscordCommands.Help(message, "globals"); }
            else if(command === "~HELP DRYSTREAKS" || command === "HELP DRYSTREAK") { DiscordCommands.Help(message, "drystreaks"); }
            else if(command === "~HELP TRIALS") { DiscordCommands.Help(message, "trials"); }
            else if(command === "~HELP BROADCASTS") { DiscordCommands.BroadcastsHelp(message); }
            else if(command === "~HELP OTHERS" || command === "~HELP OTHER") { DiscordCommands.Help(message, "others"); }
            else { message.reply("I am unsure of that help command, type `~help` to see them all."); }
          }
        }
        else if(command === "~HELP" || command === "~COMMANDS") { if(!CheckBanned(message)) { DiscordCommands.Help(message, "none"); } }
        else if(command === "~RANKINGS") { if(!CheckBanned(message)) { DiscordCommands.Help(message, "rankings"); } }
        else if(command === "~RAIDS") { if(!CheckBanned(message)) { DiscordCommands.Help(message, "raids"); } }
        else if(command === "~SEASONAL") { if(!CheckBanned(message)) { DiscordCommands.Help(message, "seasonal"); } }
        else if(command === "~PRESEASONAL") { if(!CheckBanned(message)) { DiscordCommands.Help(message, "preseasonal"); } }
        else if(command === "~CLANS" || command === "~CLAN") { if(!CheckBanned(message)) { DiscordCommands.Help(message, "clan"); } }
        else if(command === "~GLOBALS" || command === "~GLOBAL") { if(!CheckBanned(message)) { DiscordCommands.Help(message, "globals"); } }
        else if(command === "~TRIALS" || command === "~GLOBAL TRIALS") { if(!CheckBanned(message)) { DiscordCommands.Help(message, "trials"); } }
        else if(command === "~OTHERS" || command === "~OTHER") { if(!CheckBanned(message)) { DiscordCommands.Help(message, "others"); } }

        //Rankings
        else if(command.startsWith("~DRYSTREAK ")) { if(!CheckBanned(message)) { DiscordCommands.DryStreak(message, command.substr("~DRYSTREAK ".length)); } }
        else if(command.startsWith("~ITEM ")) { if(!CheckBanned(message)) { DiscordCommands.Rankings("item", message); } }
        else if(command.startsWith("~TITLE ")) { if(!CheckBanned(message)) { DiscordCommands.Rankings("title", message); } }
        else if(command === "~DRYSTREAK" || command === "~DRYSTREAKS") { if(!CheckBanned(message)) { DiscordCommands.DrystreaksHelp(message); } }
        else if(command === "~INFAMY") { if(!CheckBanned(message)) { DiscordCommands.Rankings("infamy", message); } }
        else if(command === "~VALOR") { if(!CheckBanned(message)) { DiscordCommands.Rankings("valor", message); } }
        else if(command === "~GLORY") { if(!CheckBanned(message)) { DiscordCommands.Rankings("glory", message); } }
        else if(command === "~IRON BANNER") { if(!CheckBanned(message)) { DiscordCommands.Rankings("ironBanner", message); } }
        else if(command === "~LEVIATHAN" || command === "~LEVI") { if(!CheckBanned(message)) { DiscordCommands.Rankings("levi", message); } }
        else if(command === "~PRESTIGELEVIATHAN" || command === "~PRESTIGELEVI" || command === "~PLEVI") { if(!CheckBanned(message)) { DiscordCommands.Rankings("leviPres", message); } }
        else if(command === "~EATEROFWORLDS" || command === "~EOW") { if(!CheckBanned(message)) { DiscordCommands.Rankings("eow", message); } }
        else if(command === "~PRESTIGEEATEROFWORLDS" || command === "~PRESTIGEEOW" || command === "~PEOW") { if(!CheckBanned(message)) { DiscordCommands.Rankings("eowPres", message); } }
        else if(command === "~SPIREOFSTARS" || command === "~SOS") { if(!CheckBanned(message)) { DiscordCommands.Rankings("sos", message); } }
        else if(command === "~PRESTIGESPIRE" || command === "~PRESTIGESOS" || command === "~PSOS") { if(!CheckBanned(message)) { DiscordCommands.Rankings("sosPres", message); } }
        else if(command === "~LW" || command === "~LAST WISH") { if(!CheckBanned(message)) { DiscordCommands.Rankings("lastWish", message); } }
        else if(command === "~SOTP" || command === "~SCOURGE") { if(!CheckBanned(message)) { DiscordCommands.Rankings("scourge", message); } }
        else if(command === "~COS" || command === "~CROWN") { if(!CheckBanned(message)) { DiscordCommands.Rankings("sorrows", message); } }
        else if(command === "~GOS" || command === "~GARDEN") { if(!CheckBanned(message)) { DiscordCommands.Rankings("garden", message); } }
        else if(command === "~SUNDIAL") { if(!CheckBanned(message)) { DiscordCommands.Rankings("sundial", message); } }
        else if(command === "~FRACTALINE") { if(!CheckBanned(message)) { DiscordCommands.Rankings("fractaline", message); } }
        else if(command === "~RESONANCE") { if(!CheckBanned(message)) { DiscordCommands.Rankings("resonance", message); } }
        else if(command === "~TRIUMPH SCORE" || command === "~TRIUMPHSCORE") { if(!CheckBanned(message)) { DiscordCommands.Rankings("triumphScore", message); } }
        else if(command === "~CLAN TIME" || command === "~TIME PLAYED" || command === "~TOTAL TIME" || command === "~TOTALTIME" || command === "~TIME") { if(!CheckBanned(message)) { DiscordCommands.Rankings("totalTime", message); } }
        else if(command === "~SEASON RANKS" || command === "~SEASONRANKS" || command === "~SEASON RANK" || command === "~SEASONRANK") { if(!CheckBanned(message)) { DiscordCommands.Rankings("seasonRank", message); } }
        else if(command === "~ITEMS") { if(!CheckBanned(message)) { DiscordCommands.GetTrackedItems(message); } }
        else if(command === "~TITLES") { if(!CheckBanned(message)) { DiscordCommands.GetTrackedTitles(message); } }
        else if(command === "~TITLES TOTAL" || command === "~THENUMBEROFTITLESTHATIHAVEEARNED") { if(!CheckBanned(message)) { DiscordCommands.Rankings("totalTitles", message); } }
        else if(command.startsWith("~TRIALS ")) {
          if(!CheckBanned(message)) {
            if(command.startsWith("~TRIALS WEEKLY ")) {
              if(message.mentions.users.first()) { DiscordCommands.Trials(message, "weekly"); }
              else {
                if(command.substr("~TRIALS WEEKLY ".length) === "WINS") { DiscordCommands.TrialsRankings(message, "weekly", "wins") }
                else if(command.substr("~TRIALS WEEKLY ".length) === "WIN STREAK") { DiscordCommands.TrialsRankings(message, "weekly", "winStreak") }
                else if(command.substr("~TRIALS WEEKLY ".length) === "FLAWLESS") { DiscordCommands.TrialsRankings(message, "weekly", "flawlessTickets") }
                else if(command.substr("~TRIALS WEEKLY ".length) === "FINAL BLOWS") { DiscordCommands.TrialsRankings(message, "weekly", "finalBlows") }
                else if(command.substr("~TRIALS WEEKLY ".length) === "POST WINS") { DiscordCommands.TrialsRankings(message, "weekly", "postFlawlessWins") }
                else if(command.substr("~TRIALS WEEKLY ".length) === "CARRIES") { DiscordCommands.TrialsRankings(message, "weekly", "carries") }
                else { message.reply("I am not sure what this trials command is sorry. For help use: `~Trials Help`"); }
              }
            }
            else if(command.startsWith("~TRIALS SEASONAL ")) {
              if(message.mentions.users.first()) { DiscordCommands.Trials(message, "seasonal"); }
              else {
                if(command.substr("~TRIALS SEASONAL ".length) === "WINS") { DiscordCommands.TrialsRankings(message, "seasonal", "wins") }
                else if(command.substr("~TRIALS SEASONAL ".length) === "WIN STREAK") { DiscordCommands.TrialsRankings(message, "seasonal", "winStreak") }
                else if(command.substr("~TRIALS SEASONAL ".length) === "FLAWLESS") { DiscordCommands.TrialsRankings(message, "seasonal", "flawlessTickets") }
                else if(command.substr("~TRIALS SEASONAL ".length) === "FINAL BLOWS") { DiscordCommands.TrialsRankings(message, "seasonal", "finalBlows") }
                else if(command.substr("~TRIALS SEASONAL ".length) === "POST WINS") { DiscordCommands.TrialsRankings(message, "seasonal", "postFlawlessWins") }
                else if(command.substr("~TRIALS SEASONAL ".length) === "CARRIES") { DiscordCommands.TrialsRankings(message, "seasonal", "carries") }
                else { message.reply("I am not sure what this trials command is sorry. For help use: `~Trials Help`"); }
              }
            }
            else if(command.startsWith("~TRIALS OVERALL ")) {
              if(message.mentions.users.first()) { DiscordCommands.Trials(message, "overall"); }
              else {
                if(command.substr("~TRIALS OVERALL ".length) === "WINS") { DiscordCommands.TrialsRankings(message, "overall", "wins") }
                else if(command.substr("~TRIALS OVERALL ".length) === "FLAWLESS") { DiscordCommands.TrialsRankings(message, "overall", "flawlessTickets") }
                else if(command.substr("~TRIALS OVERALL ".length) === "FINAL BLOWS") { DiscordCommands.TrialsRankings(message, "overall", "finalBlows") }
                else if(command.substr("~TRIALS OVERALL ".length) === "POST WINS") { DiscordCommands.TrialsRankings(message, "overall", "postFlawlessWins") }
                else if(command.substr("~TRIALS OVERALL ".length) === "CARRIES") { DiscordCommands.TrialsRankings(message, "overall", "carries") }
                else { message.reply("I am not sure what this trials command is sorry. For help use: `~Trials Help`"); }
              }
            }
            else if(command.startsWith("~TRIALS PROFILE ")) {
              if(command.startsWith("~TRIALS PROFILE WEEKLY")) { DiscordCommands.Trials(message, "weekly") }
              else if(command.startsWith("~TRIALS PROFILE SEASONAL")) { DiscordCommands.Trials(message, "seasonal") }
              else if(command.startsWith("~TRIALS PROFILE OVERALL")) { DiscordCommands.Trials(message, "overall") }
              else { DiscordCommands.Trials(message, "overall"); }
            }
            else if(command.startsWith("~TRIALS WINS ")) {
              if(command.startsWith("~TRIALS WINS WEEKLY")) { DiscordCommands.TrialsRankings(message, "weekly", "wins"); }
              else if(command.startsWith("~TRIALS WINS SEASONAL")) { DiscordCommands.TrialsRankings(message, "seasonal", "wins"); }
              else if(command.startsWith("~TRIALS WINS OVERALL")) { DiscordCommands.TrialsRankings(message, "overall", "wins"); }
              else { DiscordCommands.TrialsRankings(message, "weekly", "wins"); }
            }
            else if(command.startsWith("~TRIALS FLAWLESS ")) {
              if(command.startsWith("~TRIALS FLAWLESS WEEKLY")) { DiscordCommands.TrialsRankings(message, "weekly", "flawlessTickets"); }
              else if(command.startsWith("~TRIALS FLAWLESS SEASONAL")) { DiscordCommands.TrialsRankings(message, "seasonal", "flawlessTickets"); }
              else if(command.startsWith("~TRIALS FLAWLESS OVERALL")) { DiscordCommands.TrialsRankings(message, "overall", "flawlessTickets"); }
              else { DiscordCommands.TrialsRankings(message, "weekly", "flawlessTickets"); }
            }
            else if(command.startsWith("~TRIALS FINAL BLOWS ")) {
              if(command.startsWith("~TRIALS FINAL BLOWS WEEKLY")) { DiscordCommands.TrialsRankings(message, "weekly", "finalBlows"); }
              else if(command.startsWith("~TRIALS FINAL BLOWS SEASONAL")) { DiscordCommands.TrialsRankings(message, "seasonal", "finalBlows"); }
              else if(command.startsWith("~TRIALS FINAL BLOWS OVERALL")) { DiscordCommands.TrialsRankings(message, "overall", "finalBlows"); }
              else { DiscordCommands.TrialsRankings(message, "weekly", "finalBlows"); }
            }
            else if(command.startsWith("~TRIALS POST WINS ")) {
              if(command.startsWith("~TRIALS POST WINS WEEKLY")) { DiscordCommands.TrialsRankings(message, "weekly", "postFlawlessWins"); }
              else if(command.startsWith("~TRIALS POST WINS SEASONAL")) { DiscordCommands.TrialsRankings(message, "seasonal", "postFlawlessWins"); }
              else if(command.startsWith("~TRIALS POST WINS OVERALL")) { DiscordCommands.TrialsRankings(message, "overall", "postFlawlessWins"); }
              else { DiscordCommands.TrialsRankings(message, "weekly", "postFlawlessWins"); }
            }
            else if(command.startsWith("~TRIALS CARRIES ")) {
              if(command.startsWith("~TRIALS CARRIES WEEKLY")) { DiscordCommands.TrialsRankings(message, "weekly", "carries"); }
              else if(command.startsWith("~TRIALS CARRIES SEASONAL")) { DiscordCommands.TrialsRankings(message, "seasonal", "carries"); }
              else if(command.startsWith("~TRIALS CARRIES OVERALL")) { DiscordCommands.TrialsRankings(message, "overall", "carries"); }
              else { DiscordCommands.TrialsRankings(message, "weekly", "carries"); }
            }
            else if(command === "~TRIALS PROFILE") { DiscordCommands.Trials(message, "overall") }
            else if(command === "~TRIALS WINS") { DiscordCommands.TrialsRankings(message, "weekly", "wins"); }
            else if(command === "~TRIALS FLAWLESS") { DiscordCommands.TrialsRankings(message, "weekly", "flawlessTickets"); }
            else if(command === "~TRIALS FINAL BLOWS") { DiscordCommands.TrialsRankings(message, "weekly", "finalBlows"); }
            else if(command === "~TRIALS POST WINS") { DiscordCommands.TrialsRankings(message, "weekly", "postFlawlessWins"); }
            else if(command === "~TRIALS CARRIES") { DiscordCommands.TrialsRankings(message, "weekly", "carries"); }
            else if(command === "~TRIALS PROFILE") { DiscordCommands.Trials(message, "overall") }
            else { DiscordCommands.Help(message, "trials"); }
          }
        }
        else if(command.startsWith("~GG ")) {
          if(!CheckBanned(message)) {
            if(command === "~GG LAURELS" || command === "~GG LAUREL") { DiscordCommands.Rankings("gg_laurels", message); }
            else if(command === "~GG MEDALS" || command === "~GG MEDAL") { DiscordCommands.Rankings("gg_medals", message); }
            else if(command === "~GG TRIUMPHS" || command === "~GG TRIUMPH") { DiscordCommands.Rankings("gg_triumphs", message); }
            else if(command === "~GG SUPER KILLS" || command === "~GG SUPERS" || command === "~GG RUMBLE") { DiscordCommands.Rankings("gg_rumble_super_kills", message); }
            else if(command === "~GG CLASSES" || command === "~GG CLASS") { DiscordCommands.Rankings("gg_classes", message); }
            else { DiscordCommands.Help(message, "guardianGames"); }
          }
        }
        else if(command === "~GUARDIAN GAMES" || command === "~GG") { if(!CheckBanned(message)) { DiscordCommands.Help(message, "guardianGames"); } }
        else if(command === "~CLASSES") { if(!CheckBanned(message)) { DiscordCommands.Rankings("gg_classes", message); } }

        //Clan Management
        else if(command.startsWith("~SET BROADCASTS ")) { if(!CheckBanned(message)) { Broadcasts.SetupBroadcasts(message); } }
        else if(command.startsWith("~FILTER ")) { if(!CheckBanned(message)) { Broadcasts.AddToBlacklist(message, default_command.substr("~FILTER ".length)); } }
        else if(command.startsWith("~BLACKLIST ")) { if(!CheckBanned(message)) { Broadcasts.AddToBlacklist(message, default_command.substr("~BLACKLIST ".length)); } }
        else if(command.startsWith("~WHITELIST ")) { if(!CheckBanned(message)) { Broadcasts.AddToWhitelist(message, default_command.substr("~WHITELIST ".length)); } }
        else if(command.startsWith("~ADD CLAN")) { if(!CheckBanned(message)) { ManageClans.AddClan(message, command.substr("~ADD CLAN ".length)); } }
        else if(command.startsWith("~REMOVE CLAN")) { if(!CheckBanned(message)) { ManageClans.RemoveClan(message, command.substr("~REMOVE CLAN ".length)); } }
        else if(command.startsWith("~TRANSFER ")) { if(!CheckBanned(message)) { DiscordCommands.TransferLeadership(message); } }
        else if(command === "~BROADCASTS HELP") { if(!CheckBanned(message)) { DiscordCommands.BroadcastsHelp(message); } }
        else if(command === "~REMOVE BROADCASTS") { if(!CheckBanned(message)) { Broadcasts.RemoveBroadcasts(message); } }
        else if(command === "~SET BROADCASTS") { if(!CheckBanned(message)) { message.reply("Please set the broadcasts channel by tagging it in the message. E.g: `~Set Broadcasts #general`"); } }
        else if(command === "~TOGGLE WHITELIST") { if(!CheckBanned(message)) { DiscordCommands.ToggleWhitelist(message); } }
        else if(command === "~SET CLAN") { if(!CheckBanned(message)) { ManageClans.RegisterClan(message); } }
        else if(command === "~TRACKED CLANS" || command === "~CLANS TRACKED") { if(!CheckBanned(message)) { DiscordCommands.GetTrackedClans(message); } }
        else if(command === "~REAUTH") { if(!CheckBanned(message)) { DiscordCommands.RenewLeadership(message); } }
        else if(command === "~CLANINFO" || command === "~CLAN INFO") { if(!CheckBanned(message)) { DiscordCommands.ClanInfo(message); } }
        else if(command === "~CONFIG BROADCASTS" || command === "~CONFIGURE BROADCASTS") { if(!CheckBanned(message)) { Broadcasts.ConfigureBroadcasts(message); } }
        else if(command === "~TOGGLE BROADCASTS") { if(!CheckBanned(message)) { DiscordCommands.BroadcastsHelp(message); } }
        else if(command === "~TOGGLE ITEM BROADCASTS" || command === "~TOGGLE ITEMS BROADCASTS" || command === "~TOGGLE ITEM BROADCAST" || command === "~TOGGLE ITEMS BROADCAST") { if(!CheckBanned(message)) { Broadcasts.ToggleBroadcasts(message, "Item"); } }
        else if(command === "~TOGGLE TITLE BROADCASTS" || command === "~TOGGLE TITLES BROADCASTS" || command === "~TOGGLE TITLE BROADCAST" || command === "~TOGGLE TITLES BROADCAST") { if(!CheckBanned(message)) { Broadcasts.ToggleBroadcasts(message, "Title"); } }
        else if(command === "~TOGGLE CLAN BROADCASTS" || command === "~TOGGLE CLANS BROADCASTS" || command === "~TOGGLE CLAN BROADCAST" || command === "~TOGGLE CLANS BROADCAST") { if(!CheckBanned(message)) { Broadcasts.ToggleBroadcasts(message, "Clan"); } }

        //Globals
        else if(command.startsWith("~GLOBAL DRYSTREAK ")) { if(!CheckBanned(message)) { DiscordCommands.GlobalDryStreak(message, command.substr("~GLOBAL DRYSTREAK ".length)) } }
        else if(command === "~GLOBAL DRYSTREAK" || command === "~GLOBAL DRYSTREAKS") { if(!CheckBanned(message)) { DiscordCommands.DrystreaksHelp(message); } }
        else if(command === "~GLOBAL IRON BANNER" || command === "~GLOBAL IRONBANNER") { if(!CheckBanned(message)) { DiscordCommands.GlobalRankings("ironBanner", message); } }
        else if(command === "~GLOBAL SEASON RANK" || command === "~GLOBAL SEASON RANKS") { if(!CheckBanned(message)) { DiscordCommands.GlobalRankings("seasonRank", message); } }
        else if(command === "~GLOBAL FRACTALINE") { if(!CheckBanned(message)) { DiscordCommands.GlobalRankings("fractaline", message); } }
        else if(command === "~GLOBAL RESONANCE") { if(!CheckBanned(message)) { DiscordCommands.GlobalRankings("resonance", message); } }
        else if(command === "~GLOBAL CLAN TIME" || command === "~GLOBAL TIME PLAYED" || command === "~GLOBAL TOTAL TIME" || command === "~GLOBAL TOTALTIME") { if(!CheckBanned(message)) { DiscordCommands.GlobalRankings("totalTime", message); } }
        else if(command === "~GLOBAL TRIUMPH SCORE" || command === "~GLOBAL TRIUMPHSCORE") { if(!CheckBanned(message)) { DiscordCommands.GlobalRankings("triumphScore", message); } }
        else if(command === "~GLOBAL TRIALS WEEKLY WINS" || command === "~GLOBAL TRIALS WINS") { if(!CheckBanned(message)) { DiscordCommands.GlobalRankings("weekly_trials_wins", message); } }
        else if(command === "~GLOBAL TRIALS WEEKLY FLAWLESS" || command === "~GLOBAL TRIALS FLAWLESS") { if(!CheckBanned(message)) { DiscordCommands.GlobalRankings("weekly_trials_flawless", message); } }
        else if(command === "~GLOBAL TRIALS WEEKLY CARRIES" || command === "~GLOBAL TRIALS CARRIES") { if(!CheckBanned(message)) { DiscordCommands.GlobalRankings("weekly_trials_carries", message); } }
        else if(command === "~GLOBAL TRIALS SEASONAL WINS") { if(!CheckBanned(message)) { DiscordCommands.GlobalRankings("seasonal_trials_wins", message); } }
        else if(command === "~GLOBAL TRIALS SEASONAL FLAWLESS") { if(!CheckBanned(message)) { DiscordCommands.GlobalRankings("seasonal_trials_flawless", message); } }
        else if(command === "~GLOBAL TRIALS SEASONAL CARRIES") { if(!CheckBanned(message)) { DiscordCommands.GlobalRankings("seasonal_trials_carries", message); } }
        else if(command === "~GLOBAL TRIALS OVERALL WINS") { if(!CheckBanned(message)) { DiscordCommands.GlobalRankings("overall_trials_wins", message); } }
        else if(command === "~GLOBAL TRIALS OVERALL FLAWLESS") { if(!CheckBanned(message)) { DiscordCommands.GlobalRankings("overall_trials_flawless", message); } }
        else if(command === "~GLOBAL TRIALS OVERALL CARRIES") { if(!CheckBanned(message)) { DiscordCommands.GlobalRankings("overall_trials_carries", message); } }
        else if(command === "~GLOBAL CLASSES") { if(!CheckBanned(message)) { DiscordCommands.GlobalRankings("gg_classes", message); } }
        else if(command === "~GLOBAL LAURELS" || command === "~GLOBAL GG LAURELS") { if(!CheckBanned(message)) { DiscordCommands.GlobalRankings("gg_laurels", message); } }
        else if(command === "~GLOBAL MEDALS" || command === "~GLOBAL GG LAURELS") { if(!CheckBanned(message)) { DiscordCommands.GlobalRankings("gg_medals", message); } }

        //Clan Global Rankings
        else if(command === "~CLANRANK FRACTALINE") { if(!CheckBanned(message)) { DiscordCommands.DisplayClanRankings("fractaline", message); } }
        else if(command === "~CLANRANK RESONANCE") { if(!CheckBanned(message)) { DiscordCommands.DisplayClanRankings("resonance", message); } }

        //Other
        else { message.reply('I\'m not sure what that commands is sorry. Use ~help to see commands.').then(msg => { msg.delete(2000) }).catch(); }

        try { Log.SaveLog("Command", 'User: ' + message.member.user.tag + ', Command: ' + command); CommandsInput++; }
        catch (err) { try { Log.SaveError('Tried to log command in: ' + message.guild.name + ', Command: ' + command); } catch (err) {  } }
      }
      catch (err) {
        console.log(err);
        try { message.reply("Missing permissions."); }
        catch (err) { Log.SaveError("Failed to send permissions message due to missing permissions... Duh."); }
        Log.SaveError("Failed to send message due to missing permissions.");
      }
    }
  }
  else { message.reply("This bots features can only be used in a server. Sorry about that!"); }
});

client.on('error', async error => { console.log(error.message); });
client.login(Config.token);
