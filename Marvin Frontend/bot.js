//Required Libraraies
const Discord = require('discord.js');
const { Permissions } = require('discord.js');
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
var CurrentSeason = 0;
var NewSeasonCountdown = null;
var NewSeasonDate = null;
var Definitions = [];

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
    ActivityList.push(`Try ~Power`);
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
      if(backend_status.APIDisabled) {
        if(APIDisabled === false) {
          Log.SaveError("The Bungie API is temporarily disabled for maintenance."); APIDisabled = true;
          Database.AddLog(null, "api offline", null, 5, null);
        }
      }
      else {
        if(APIDisabled === true) {
          Log.SaveError("The Bungie API is back online!"); APIDisabled = false;
          Database.AddLog(null, "api online", null, 4, null);
        }
      }
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
  Log.SaveDiscordLog(StartupTime, Users, CommandsInput, Config.currentSeason, client);

  await new Promise(resolve => Database.GetDefinitions((isError, Data) => { if(!isError) { Definitions = Data; } resolve(true); }) );
  await new Promise(resolve => Database.GetClans((isError, Clans) => { ClansLength = Clans.length; CheckForNewlyScannedClans(Clans); resolve(true); }));
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
    //This is a catch for broadcasts, if there is more than 10 then something went wrong, catch it and delete them.
    if(broadcasts) {
      if(broadcasts.length < 10) {
        //This array will hold the broadcasts processed from the awaiting_broadcasts list. This is to avoid sending duplicate broadcasts in the same scan.
        var processed_broadcasts = [];
        for(var i in broadcasts) {
          if(!processed_broadcasts.find(e => e.clanId === broadcasts[i].clanId && e.membershipId === broadcasts[i].membershipId && e.season === broadcasts[i].season && e.broadcast === broadcasts[i].broadcast)) {
            if(broadcasts[i].type === "clan") {
              await new Promise(resolve =>
                Database.CheckNewClanBroadcast(broadcasts[i].clanId, broadcasts[i].season, broadcasts[i].broadcast, function (isError, isFound) {
                  if(!isFound) { Broadcasts.ProcessBroadcast(client, broadcasts[i], Definitions); }
                  else { Database.RemoveAwaitingClanBroadcast(broadcasts[i]); }
                  resolve(true);
                })
              );
            }
            else {
              await new Promise(resolve =>
                Database.CheckNewBroadcast(broadcasts[i].membershipId, broadcasts[i].season, broadcasts[i].broadcast, function (isError, isFound) {
                  if(!isFound) { Broadcasts.ProcessBroadcast(client, broadcasts[i], Definitions); }
                  else { Database.RemoveAwaitingBroadcast(broadcasts[i]); }
                  resolve(true);
                })
              );
            }
            //Processed Broadcast, Add to filter.
            processed_broadcasts.push({ "clanId": broadcasts[i].clanId, "membershipId": broadcasts[i].membershipId, "season": broadcasts[i].season, "broadcast": broadcasts[i].broadcast });
          }
        }
      }
      else { Database.ClearAwaitingBroadcasts(); }
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
      try { Database.AddLog(null, "season change", null, 6, null); } catch (err) {  }
    }
  }
  else { NewSeasonDate = Config.newSeasonDate; }
}
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
    Database.AddLog(message, "ban", null, 7, null);
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
    Database.AddLog(message, "unban", null, 8, null);
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
function AddHash(message, hash) {
  Database.AddHashToDefinition(hash, function(isError) {
    if(!isError) { message.channel.send("Hash added successfully, Thank you."); }
    else { message.channel.send("Uhh Terrii fudged up and it didn't work, He'll cry in the morning."); }
  });
  Database.ForceFullScan(function(isError) {
    if(isError) { message.channel.send("Failed to force a full rescan. If this happens uhh use the panic command: `~addhash 0`. I'll fix in the morning."); }
  });
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
    Log.SaveLog("Info", `Bot has started, with ${ Users } users, in ${client.channels.size} channels of ${client.guilds.size} guilds. Tracking ${ ClansLength } clans!`);
    Database.AddLog(null, "startup", null, 9, null);
  }
  else {
    Log.SaveError(`Bot lost connection to discord, It has been reconnected now, but in order to avoid spam broadcasts the startup funciton has been cancelled, As the bot has already started.`);
    Database.AddLog(null, "error", null, 3, null);
  }
  DiscordCommands.GuildCheck(client);
});

client.on("guildCreate", guild => {
  //Joined a server
  try {
    Log.SaveLog("Server", `Joined a new guild: ${ guild.name }`);
    Database.AddLog({ "guild": { "id": guild.id, "name": guild.name } }, "joined guild", null, 1, null);
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
  Log.SaveLog("Server", "Left a guild: " + guild.name);
  Database.AddLog({ "guild": { "id": guild.id, "name": guild.name } }, "left guild", null, 2, null);
  Database.DisableTracking(guild.id);
});

//Detected message
client.on("message", async message => {
  //Translate command
  var default_command = message.content;
  var command = message.content.toUpperCase();
  var related = true;

  //Ignored Commands
  var ignoredCommands = [
    "~~", "~PLAY", "~PRUNE", "~PURGE", "~FEED", "~PAY", "~GRAB", "~BANK", "~VAULT", "~BAL", "~BUY", "~SELECT", "~SHOOT", "~SHOP", "~OPEN", "~STEAL",
    "~DRUGS", "~EXCH", "~BM", "~SMOKE", "~DOSE", "~COLLECT", "~KIDNAPPED", "~ADOPT", "~GOOSE", "~HARVEST", "~SLOTS", "~BRIEFCASES", "~DRUG", "~SPOUSE",
    "~UPGRADE", "~PUNCH", "~BLACKJACK", "~BRUH", "~ATTACK", "~INTEREST", "~GENERATOR", "~FUND", "~DIVORCE", "~MARRY"
  ];

  //Commands
  if(message.author.bot) return;
  if(message.guild) {
    if(message.guild.id === "110373943822540800" || message.guild.id === "264445053596991498") return;
    if(!message.guild.me.permissionsIn(message.channel.id).has('SEND_MESSAGES')) return;
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
        else if(command.startsWith("~ADDHASH")) {
          if(message.author.id === "194972321168097280" || message.author.id === "289210933501493258") {
            //AddHash(message, command.substr("~ADDHASH ".length));
            message.reply("Command is disabled at the moment.");
          }
          else { message.channel.send("Uhh no.. You cannot add items like this. Only permitted people can use this command."); }
        }

        //Help menu
        else if(command.startsWith("~HELP ")) {
          if(!CheckBanned(message)) {
            if(command === "~HELP RANKINGS") { DiscordCommands.Help(message, "rankings", Definitions); }
            else if(command === "~HELP RAIDS") { DiscordCommands.Help(message, "raids", Definitions); }
            else if(command === "~HELP ITEMS") { DiscordCommands.Help(message, "items", Definitions); }
            else if(command === "~HELP TITLES") { DiscordCommands.Help(message, "titles", Definitions); }
            else if(command === "~HELP SEASONAL") { DiscordCommands.Help(message, "seasonal", Definitions); }
            else if(command === "~HELP PRESEASONAL" || command === "~HELP PRE-SEASONAL") { DiscordCommands.Help(message, "preseasonal", Definitions); }
            else if(command === "~HELP CLANS" || command === "~HELP CLAN") { DiscordCommands.Help(message, "clan", Definitions); }
            else if(command === "~HELP GLOBALS" || command === "~HELP GLOBAL") { DiscordCommands.Help(message, "globals", Definitions); }
            else if(command === "~HELP DRYSTREAKS" || command === "HELP DRYSTREAK") { DiscordCommands.Help(message, "drystreaks", Definitions); }
            else if(command === "~HELP TRIALS") { DiscordCommands.Help(message, "trials", Definitions); }
            else if(command === "~HELP BROADCASTS") { DiscordCommands.BroadcastsHelp(message); }
            else if(command === "~HELP OTHERS" || command === "~HELP OTHER") { DiscordCommands.Help(message, "others", Definitions); }
            else if(command === "~HELP DUNGEONS" || command === "~HELP DUNGEON") { DiscordCommands.Help(message, "dungeons", Definitions); }
            else if(command === "~HELP CLANWARS" || command === "~HELP CLANWARS") { DiscordCommands.Help(message, "clanwars", Definitions); }
            else { message.reply("I am unsure of that help command, type `~help` to see them all."); }
          }
        }
        else if(command === "~HELP" || command === "~COMMANDS") { if(!CheckBanned(message)) { DiscordCommands.Help(message, "none", Definitions); } }
        else if(command === "~RANKINGS") { if(!CheckBanned(message)) { DiscordCommands.Help(message, "rankings", Definitions); } }
        else if(command === "~RAIDS") { if(!CheckBanned(message)) { DiscordCommands.Help(message, "raids", Definitions); } }
        else if(command === "~SEASONAL") { if(!CheckBanned(message)) { DiscordCommands.Help(message, "seasonal", Definitions); } }
        else if(command === "~PRESEASONAL") { if(!CheckBanned(message)) { DiscordCommands.Help(message, "preseasonal", Definitions); } }
        else if(command === "~CLANS" || command === "~CLAN") { if(!CheckBanned(message)) { DiscordCommands.Help(message, "clan", Definitions); } }
        else if(command === "~GLOBALS" || command === "~GLOBAL") { if(!CheckBanned(message)) { DiscordCommands.Help(message, "globals", Definitions); } }
        else if(command === "~TRIALS" || command === "~GLOBAL TRIALS") { if(!CheckBanned(message)) { DiscordCommands.Help(message, "trials", Definitions); } }
        else if(command === "~OTHERS" || command === "~OTHER") { if(!CheckBanned(message)) { DiscordCommands.Help(message, "others", Definitions); } }
        else if(command === "~DUNGEONS" || command === "~DUNGEON") { if(!CheckBanned(message)) { DiscordCommands.Help(message, "dungeons", Definitions); } }
        else if(command === "~CLANWARS") { if(!CheckBanned(message)) { DiscordCommands.Help(message, "clanwars", Definitions); } }
        else if(command === "~CLAN WARS") { if(!CheckBanned(message)) { message.reply("The command is used without a space: `~Clanwars`. It's for stability issues sorry."); } }

        //Rankings
        else if(command.startsWith("~DRYSTREAK ")) { if(!CheckBanned(message)) { DiscordCommands.DryStreak(message, command.substr("~DRYSTREAK ".length)); } }
        else if(command.startsWith("~ITEM ")) { if(!CheckBanned(message)) { DiscordCommands.Rankings("item", message, Definitions); } }
        else if(command.startsWith("~TITLE ")) { if(!CheckBanned(message)) { DiscordCommands.Rankings("title", message, Definitions); } }
        else if(command.startsWith("~!ITEM ")) { if(!CheckBanned(message)) { DiscordCommands.Rankings("notItem", message, Definitions); } }
        else if(command.startsWith("~!TITLE ")) { if(!CheckBanned(message)) { DiscordCommands.Rankings("notTitle", message, Definitions); } }
        else if(command === "~DRYSTREAK" || command === "~DRYSTREAKS") { if(!CheckBanned(message)) { DiscordCommands.DrystreaksHelp(message); } }
        else if(command === "~INFAMY") { if(!CheckBanned(message)) { DiscordCommands.Rankings("infamy", message, Definitions); } }
        else if(command === "~VALOR") { if(!CheckBanned(message)) { DiscordCommands.Rankings("valor", message, Definitions); } }
        else if(command === "~GLORY") { if(!CheckBanned(message)) { DiscordCommands.Rankings("glory", message, Definitions); } }
        else if(command === "~IRON BANNER") { if(!CheckBanned(message)) { DiscordCommands.Rankings("ironBanner", message, Definitions); } }
        else if(command === "~LEVIATHAN" || command === "~LEVI") { if(!CheckBanned(message)) { DiscordCommands.Rankings("levi", message, Definitions); } }
        else if(command === "~PRESTIGELEVIATHAN" || command === "~PRESTIGELEVI" || command === "~PLEVI") { if(!CheckBanned(message)) { DiscordCommands.Rankings("leviPres", message, Definitions); } }
        else if(command === "~EATEROFWORLDS" || command === "~EOW") { if(!CheckBanned(message)) { DiscordCommands.Rankings("eow", message, Definitions); } }
        else if(command === "~PRESTIGEEATEROFWORLDS" || command === "~PRESTIGEEOW" || command === "~PEOW") { if(!CheckBanned(message)) { DiscordCommands.Rankings("eowPres", message, Definitions); } }
        else if(command === "~SPIREOFSTARS" || command === "~SOS") { if(!CheckBanned(message)) { DiscordCommands.Rankings("sos", message, Definitions); } }
        else if(command === "~PRESTIGESPIRE" || command === "~PRESTIGESOS" || command === "~PSOS") { if(!CheckBanned(message)) { DiscordCommands.Rankings("sosPres", message, Definitions); } }
        else if(command === "~LW" || command === "~LAST WISH") { if(!CheckBanned(message)) { DiscordCommands.Rankings("lastWish", message, Definitions); } }
        else if(command === "~SOTP" || command === "~SCOURGE") { if(!CheckBanned(message)) { DiscordCommands.Rankings("scourge", message, Definitions); } }
        else if(command === "~COS" || command === "~CROWN") { if(!CheckBanned(message)) { DiscordCommands.Rankings("sorrows", message, Definitions); } }
        else if(command === "~GOS" || command === "~GARDEN") { if(!CheckBanned(message)) { DiscordCommands.Rankings("garden", message, Definitions); } }
        else if(command === "~RAIDS TOTAL" || command === "~TOTAL RAIDS") { if(!CheckBanned(message)) { DiscordCommands.Rankings("totalRaids", message, Definitions); } }
        else if(command === "~MAXPOWER" || command === "~MAX POWER" || command === "~MAX LIGHT" || command === "~MAXLIGHT" || command === "~POWER" || command === "~HIGHEST POWER" || command === "~HIGHESTPOWER") { if(!CheckBanned(message)) { DiscordCommands.Rankings("maxPower", message, Definitions); } }
        else if(command === "~SUNDIAL") { if(!CheckBanned(message)) { DiscordCommands.Rankings("sundial", message, Definitions); } }
        else if(command === "~FRACTALINE") { if(!CheckBanned(message)) { DiscordCommands.Rankings("fractaline", message, Definitions); } }
        else if(command === "~RESONANCE") { if(!CheckBanned(message)) { DiscordCommands.Rankings("resonance", message, Definitions); } }
        else if(command === "~TRIUMPH SCORE" || command === "~TRIUMPHSCORE") { if(!CheckBanned(message)) { DiscordCommands.Rankings("triumphScore", message, Definitions); } }
        else if(command === "~CLAN TIME" || command === "~TIME PLAYED" || command === "~TOTAL TIME" || command === "~TOTALTIME" || command === "~TIME") { if(!CheckBanned(message)) { DiscordCommands.Rankings("totalTime", message, Definitions); } }
        else if(command === "~SEASON RANKS" || command === "~SEASONRANKS" || command === "~SEASON RANK" || command === "~SEASONRANK") { if(!CheckBanned(message)) { DiscordCommands.Rankings("seasonRank", message, Definitions); } }
        else if(command === "~ITEMS") { if(!CheckBanned(message)) { DiscordCommands.GetTrackedItems(message, Definitions); } }
        else if(command === "~TITLES") { if(!CheckBanned(message)) { DiscordCommands.GetTrackedTitles(message, Definitions); } }
        else if(command === "~TITLES TOTAL" || command === "~THENUMBEROFTITLESTHATIHAVEEARNED") { if(!CheckBanned(message)) { DiscordCommands.Rankings("totalTitles", message, Definitions); } }
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
            else { DiscordCommands.Help(message, "trials", Definitions); }
          }
        }
        else if(command.startsWith("~GG ")) {
          if(!CheckBanned(message)) {
            if(command === "~GG LAURELS" || command === "~GG LAUREL") { DiscordCommands.Rankings("gg_laurels", message); }
            else if(command === "~GG MEDALS" || command === "~GG MEDAL") { DiscordCommands.Rankings("gg_medals", message); }
            else if(command === "~GG TRIUMPHS" || command === "~GG TRIUMPH") { DiscordCommands.Rankings("gg_triumphs", message); }
            else if(command === "~GG SUPER KILLS" || command === "~GG SUPERS" || command === "~GG RUMBLE") { DiscordCommands.Rankings("gg_rumble_super_kills", message); }
            else if(command === "~GG CLASSES" || command === "~GG CLASS") { DiscordCommands.Rankings("gg_classes", message); }
            else { DiscordCommands.Help(message, "guardianGames", Definitions); }
          }
        }
        else if(command === "~GUARDIAN GAMES" || command === "~GG") { if(!CheckBanned(message)) { DiscordCommands.Help(message, "guardianGames", Definitions); } }
        else if(command === "~CLASSES") { if(!CheckBanned(message)) { DiscordCommands.Rankings("gg_classes", message, Definitions); } }
        else if(command === "~SHATTERED THRONE") { if(!CheckBanned(message)) { DiscordCommands.Rankings("st_dungeon", message, Definitions); } }
        else if(command === "~SHATTERED THRONE FLAWLESS" || command === "~FLAWLESS SHATTERED THRONE") { if(!CheckBanned(message)) { DiscordCommands.Rankings("st_flawless_dungeon", message, Definitions); } }
        else if(command === "~PIT OF HERESY" || command === "~PIT") { if(!CheckBanned(message)) { DiscordCommands.Rankings("pit_dungeon", message, Definitions); } }
        else if(command === "~PIT OF HERESY FLAWLESS" || command === "~FLAWLESS PIT OF HERESY" || command === "~FLAWLESS PIT" || command === "~PIT FLAWLESS") { if(!CheckBanned(message)) { DiscordCommands.Rankings("pit_flawless_dungeon", message, Definitions); } }
        else if(command === "~PROPHECY" || command === "~PROHECY") { if(!CheckBanned(message)) { DiscordCommands.Rankings("prophecy_dungeon", message, Definitions); } }
        else if(command === "~PROPHECY FLAWLESS" || command === "~FLAWLESS PROPHECY") { if(!CheckBanned(message)) { DiscordCommands.Rankings("prophecy_flawless_dungeon", message, Definitions); } }

        //Clan Management
        else if(command.startsWith("~SET BROADCASTS ")) { if(!CheckBanned(message)) { Broadcasts.SetupBroadcasts(message); } }
        else if(command.startsWith("~FILTER ")) { if(!CheckBanned(message)) { Broadcasts.AddToBlacklist(message, default_command.substr("~FILTER ".length)); } }
        else if(command.startsWith("~BLACKLIST ")) { if(!CheckBanned(message)) { Broadcasts.AddToBlacklist(message, default_command.substr("~BLACKLIST ".length)); } }
        else if(command.startsWith("~WHITELIST ")) { if(!CheckBanned(message)) { Broadcasts.AddToWhitelist(message, default_command.substr("~WHITELIST ".length)); } }
        else if(command.startsWith("~ADD CLAN")) { if(!CheckBanned(message)) { ManageClans.AddClan(message, command.substr("~ADD CLAN ".length)); } }
        else if(command.startsWith("~REMOVE CLAN")) { if(!CheckBanned(message)) { ManageClans.RemoveClan(message, command.substr("~REMOVE CLAN ".length)); } }
        else if(command.startsWith("~DELETE CLAN")) { if(!CheckBanned(message)) { ManageClans.RemoveClan(message, command.substr("~DELETE CLAN ".length)); } }
        else if(command.startsWith("~TRANSFER ")) { if(!CheckBanned(message)) { DiscordCommands.TransferLeadership(message); } }
        else if(command === "~BROADCASTS HELP") { if(!CheckBanned(message)) { DiscordCommands.BroadcastsHelp(message); } }
        else if(command === "~REMOVE BROADCASTS") { if(!CheckBanned(message)) { Broadcasts.RemoveBroadcasts(message); } }
        else if(command === "~SET BROADCASTS") { if(!CheckBanned(message)) { message.reply("Please set the broadcasts channel by tagging it in the message. E.g: `~Set Broadcasts #general`"); } }
        else if(command === "~TOGGLE WHITELIST") { if(!CheckBanned(message)) { DiscordCommands.ToggleWhitelist(message); } }
        else if(command === "~SET CLAN") { if(!CheckBanned(message)) { ManageClans.RegisterClan(message); } }
        else if(command === "~TRACKED CLANS" || command === "~CLANS TRACKED") { if(!CheckBanned(message)) { DiscordCommands.GetTrackedClans(message); } }
        else if(command === "~REAUTH") { if(!CheckBanned(message)) { DiscordCommands.RenewLeadership(message); } }
        else if(command === "~CLANINFO" || command === "~CLAN INFO") { if(!CheckBanned(message)) { DiscordCommands.ClanInfo(message); } }
        else if(command === "~CONFIG BROADCASTS" || command === "~CONFIGURE BROADCASTS" || command === "~MANAGE BROADCASTS") { if(!CheckBanned(message)) { Broadcasts.ConfigureBroadcasts(message); } }
        else if(command === "~TOGGLE BROADCASTS") { if(!CheckBanned(message)) { DiscordCommands.BroadcastsHelp(message); } }
        else if(command === "~TOGGLE ITEM BROADCASTS" || command === "~TOGGLE ITEMS BROADCASTS" || command === "~TOGGLE ITEM BROADCAST" || command === "~TOGGLE ITEMS BROADCAST") { if(!CheckBanned(message)) { Broadcasts.ToggleBroadcasts(message, "Item"); } }
        else if(command === "~TOGGLE TITLE BROADCASTS" || command === "~TOGGLE TITLES BROADCASTS" || command === "~TOGGLE TITLE BROADCAST" || command === "~TOGGLE TITLES BROADCAST") { if(!CheckBanned(message)) { Broadcasts.ToggleBroadcasts(message, "Title"); } }
        else if(command === "~TOGGLE CLAN BROADCASTS" || command === "~TOGGLE CLANS BROADCASTS" || command === "~TOGGLE CLAN BROADCAST" || command === "~TOGGLE CLANS BROADCAST") { if(!CheckBanned(message)) { Broadcasts.ToggleBroadcasts(message, "Clan"); } }

        //Globals
        else if(command.startsWith("~GLOBAL DRYSTREAK ")) { if(!CheckBanned(message)) { DiscordCommands.GlobalDryStreak(message, Definitions, command.substr("~GLOBAL DRYSTREAK ".length)) } }
        else if(command === "~GLOBAL DRYSTREAK" || command === "~GLOBAL DRYSTREAKS") { if(!CheckBanned(message)) { DiscordCommands.DrystreaksHelp(message); } }
        else if(command === "~GLOBAL IRON BANNER" || command === "~GLOBAL IRONBANNER") { if(!CheckBanned(message)) { DiscordCommands.GlobalRankings("ironBanner", message); } }
        else if(command === "~GLOBAL SEASON RANK" || command === "~GLOBAL SEASON RANKS") { if(!CheckBanned(message)) { DiscordCommands.GlobalRankings("seasonRank", message); } }
        else if(command === "~GLOBAL FRACTALINE") { if(!CheckBanned(message)) { DiscordCommands.GlobalRankings("fractaline", message); } }
        else if(command === "~GLOBAL RESONANCE") { if(!CheckBanned(message)) { DiscordCommands.GlobalRankings("resonance", message); } }
        else if(command === "~GLOBAL CLAN TIME" || command === "~GLOBAL TIME PLAYED" || command === "~GLOBAL TOTAL TIME" || command === "~GLOBAL TOTALTIME") { if(!CheckBanned(message)) { DiscordCommands.GlobalRankings("totalTime", message); } }
        else if(command === "~GLOBAL POWER" || command === "~GLOBAL MAX POWER") { if(!CheckBanned(message)) { DiscordCommands.GlobalRankings("maxPower", message); } }
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
        else if(command === "~THE LIE" || command === "~FELWINTERS" || command === "~FELWINTERS LIE") { if(!CheckBanned(message)) { message.channel.send("This community event has ended, this command will be removed soon. Thanks for participating!") } }

        //Clan Wars Rankings
        else if(command.startsWith("~CLAN WARS")) { if(!CheckBanned(message)) { message.reply("The command is used without a space: `~Clanwars`. It's for stability issues sorry."); } }
        else if(command.startsWith("~CLANWARS ")) {
          if(!CheckBanned(message)) {
            if(command === "~CLANWARS INFAMY") { DiscordCommands.DisplayInhouseClanRankings("infamy", message); }
            else if(command === "~CLANWARS VALOR") { DiscordCommands.DisplayInhouseClanRankings("valor", message); }
            else if(command === "~CLANWARS GLORY") { DiscordCommands.DisplayInhouseClanRankings("glory", message); }
            else if(command === "~CLANWARS LEVIATHAN" || command === "~CLANWARS LEVI") { DiscordCommands.DisplayInhouseClanRankings("levi", message); }
            else if(command === "~CLANWARS PRESTIGE LEVIATHAN" || command === "~CLANWARS PRESTIGE LEVI" || command === "~CLANWARS PLEVI") { DiscordCommands.DisplayInhouseClanRankings("leviPres", message); }
            else if(command === "~CLANWARS EATER OF WORLDS" || command === "~CLANWARS EATER" || command === "~CLANWARS EOW") { DiscordCommands.DisplayInhouseClanRankings("eow", message); }
            else if(command === "~CLANWARS PRESTIGE EATER OF WORLDS" || command === "~CLANWARS PRESTIGE EATER" || command === "~CLANWARS PEOW") { DiscordCommands.DisplayInhouseClanRankings("eowPres", message); }
            else if(command === "~CLANWARS SPIRE OF STARS" || command === "~CLANWARS SPIRE" || command === "~CLANWARS SOS") { DiscordCommands.DisplayInhouseClanRankings("sos", message); }
            else if(command === "~CLANWARS PRESTIGE SPIRE OF STARS" || command === "~CLANWARS PRESTIGE SPIRE" || command === "~CLANWARS PSOS") { DiscordCommands.DisplayInhouseClanRankings("sosPres", message); }
            else if(command === "~CLANWARS LAST WISH") { DiscordCommands.DisplayInhouseClanRankings("lastWish", message); }
            else if(command === "~CLANWARS SCOURGE OF THE PAST" || command === "~CLANWARS SCOURGE") { DiscordCommands.DisplayInhouseClanRankings("scourge", message); }
            else if(command === "~CLANWARS CROWN OF SORROWS" || command === "~CLANWARS CROWN") { DiscordCommands.DisplayInhouseClanRankings("sorrows", message); }
            else if(command === "~CLANWARS GARDEN OF SALVATION" || command === "~CLANWARS GARDEN") { DiscordCommands.DisplayInhouseClanRankings("garden", message); }
            else if(command === "~CLANWARS SEASON RANK") { DiscordCommands.DisplayInhouseClanRankings("seasonRank", message); }
            else if(command === "~CLANWARS SUNDIAL") { DiscordCommands.DisplayInhouseClanRankings("sundial", message); }
            else if(command === "~CLANWARS PIT OF HERESY" || command === "~CLANWARS PIT") { DiscordCommands.DisplayInhouseClanRankings("pit_dungeon", message); }
            else if(command === "~CLANWARS PROPHECY") { DiscordCommands.DisplayInhouseClanRankings("prophecy_dungeon", message); }
            else if(command === "~CLANWARS TRIUMPH SCORE") { DiscordCommands.DisplayInhouseClanRankings("triumphScore", message); }
            else if(command === "~CLANWARS TIME" || command === "~CLANWARS TIME PLAYED" || command === "~CLANWARS TOTAL TIME") { DiscordCommands.DisplayInhouseClanRankings("totalTime", message); }
            else if(command === "~CLANWARS RAIDS" || command === "~CLANWARS TOTAL RAIDS") { DiscordCommands.DisplayInhouseClanRankings("totalRaids", message); }
            else { DiscordCommands.Help(message, "clanwars", Definitions); }
          }
        }

        //Other
        else {
          related = false;
          message.reply('I\'m not sure what that commands is sorry. Use ~help to see commands.').then(msg => { msg.delete(2000) }).catch();
        }

        //Try save log to file
        try { Log.SaveLog("Command", 'User: ' + message.member.user.tag + ', Command: ' + command); CommandsInput++; }
        catch (err) { try { Log.SaveError('Tried to log command in: ' + message.guild.name + ', Command: ' + command); } catch (err) {  } }

        //Try save log to database
        try { Database.AddLog(message, "command", command, 0, related); }
        catch (err) { Log.SaveError("Error when trying to save log to database: " + err); }
      }
      catch (err) {
        console.log(err);
        Log.SaveError("Failed to send message due to missing permissions.");
      }
    }
  }
  else { message.reply("This bots features can only be used in a server. Sorry about that!"); }
});

client.on('error', async error => {
  if(error.message === "Missing Permissions") { console.log(`${ error.message }`); }
  else { console.log(error); }
});

client.login(Config.token);
