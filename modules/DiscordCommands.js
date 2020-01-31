//Required Libraraies
const Discord = require('discord.js');
const fs = require('fs');
const Bot = require("../bot.js");
const Misc = require("../js/misc.js");
const Log = require("../js/log.js");
const Config = require('../data/config.json');
const fetch = require("node-fetch");
const Database = require("./Database");

//Exports
module.exports = {
  Help, AnnouncementsHelp, BroadcastsHelp, Status, Request,
  GetClansTracked, GetTrackedClans, WriteToServer, WriteToAllServers, WriteToSpecificServer,
  GlobalRankings, Rankings, GlobalDryStreak, GetTrackedItems, DryStreak, Profile,
  GetTrackedTitles, ForceFullScan, ToggleWhitelist, RenewLeadership, TransferLeadership
};

//Important
function Help(message) {
  const embed = new Discord.RichEmbed()
  .setColor(0x0099FF)
  .setAuthor("Hey there! I am Marvin. Here is a list of my commands! The globals are only of tracked clans. Not whole population.")
  .addField("Rankings", "`~Valor`, `~Glory`, `~Infamy`, `~Iron Banner`, `~Triumph Score`, `~Time Played`, `~Drystreak 1000 Voices`, `~Drystreak Anarchy`")
  .addField("Raids", "`~LW`, `~SoTP`, `~CoS`, `~GoS`")
  .addField("Items / Titles", "`~Items`, `~Titles`, `~Item Example`, `~Title Example`")
  .addField("Seasonal", "`~Season Rank`, `~Sundial`")
  .addField("Globals", "`~Global Iron Banner`, `~Global Time Played`, `~Global Season Rank`, `~Global Triumph Score`, `~Global Drystreak 1000 Voices`, `~Global Drystreak Anarchy`")
  .addField("Others", "`~Donate`, `~Broadcasts Help`, `~Announcements Help`, `~Tracked Clans`, `~Set Clan`, `~Add Clan`, `~Remove Clan`, `~Delete Clan`")
  .addField("Request", "If you see something that isn't there that you'd like me to track request it like this: `~request I would like to see Marvin track season ranks!`")
  .setFooter(Config.defaultFooter, Config.defaultLogoURL)
  .setTimestamp()
  message.channel.send({embed});
}
function AnnouncementsHelp(message) {
  const embed = new Discord.RichEmbed()
  .setColor(0x0099FF)
  .setAuthor("Announcements Help Menu")
  .setDescription("By default important messages from the creator of Marvin will be sent to your default channel. This is usually where you see those 'has joined the server' messages. You can change this by setting an announcement channel. Optionally if you never want to see updates from me you can disable announcements.")
  .addField("Announcement Commands", "`~Set Announcements #channelName` \n`~Remove Announcements` \n`~Disable Announcements` \n`~Enable Announcements`")
  .setFooter(Config.defaultFooter, Config.defaultLogoURL)
  .setTimestamp()
  message.channel.send({embed});
}
function BroadcastsHelp(message) {
  const embed = new Discord.RichEmbed()
  .setColor(0x0099FF)
  .setAuthor("Broadcasts Help Menu")
  .setDescription("By default clan broadcasts are disabled, To enable this you can set a broadcasts channel.")
  .addField("Broadcasts Commands", "`~Set Broadcasts #channelName` \n`~Remove Broadcasts` \n`~Filter example` - To add items or titles to blacklist\n `~Toggle Whitelist`\n `~Whitelist example` - To add items or titles to the whitelist.")
  .setFooter(Config.defaultFooter, Config.defaultLogoURL)
  .setTimestamp()
  message.channel.send({embed});
}

function Status(Users, Players, ClanScans, ClanTracked, StartupTime, client, message) {
  var thisTime = new Date().getTime(); var totalTime = thisTime - StartupTime; totalTime = Misc.formatTime(totalTime / 1000);
  const embed = new Discord.RichEmbed()
  .setColor(0x0099FF)
  .setAuthor("Status")
  .setDescription("This is the status report, Hopefully everything is in working order!")
  .addField("Users", `${ Misc.AddCommas(client.users.size) }`, true)
  .addField("Servers", `${ client.guilds.size }`, true)
  .addField("Uptime", `${ totalTime }`, true)
  .addField("Players Tracked", `${ Players.length }`, true)
  .addField("Clans Tracked: ", `${ ClanTracked }`, true)
  .addField("Clan Scans", `${ Misc.AddCommas(ClanScans) }`, true)
  .setFooter(Config.defaultFooter, Config.defaultLogoURL)
  .setTimestamp()
  message.channel.send({embed});
}
function Request(client, message) {
  const request = message.content.substr("~request ".length);
  const embed = new Discord.RichEmbed()
  .setColor(0x0099FF)
  .setAuthor(`New Request by ${ message.author.username }#${ message.author.discriminator }, ID: ${ message.author.id }`)
  .setDescription(request)
  .setFooter(Config.defaultFooter, Config.defaultLogoURL)
  .setTimestamp()
  client.guilds.get('664237007261925404').channels.get('664238376219836416').send({embed});
  message.reply("Your request has been sent, Thank your for your valuable feedback! Feel free to join the discord if you'd like to keep up to date about the status of this request. https://guardianstats.com/JoinMarvin");
}
function GetClansTracked(message) {
  Database.GetRegisteredClansFromDB(function(isError, Data) {
    if(!isError) {
      var filteredClans = []; for(var i in Data) { if(!filteredClans.find(e => e.clan_id == Data[i].clan_id)) { filteredClans.push(Data[i].clan_name); } }
      let uniqueClans = [...new Set(filteredClans)];
      var first = uniqueClans.slice(0, 31);
      var second = uniqueClans.slice(31, 61);
      var third = uniqueClans.slice(61, 91);
      var fourth = uniqueClans.slice(91, 121);
      var fifth = uniqueClans.slice(121, uniqueClans.length);
      if(fifth.length === 0) { fifth = ['.']; }
      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor(`Clans Tracked - ${ uniqueClans.length }`)
      .addField("Clans", first, true)
      .addField("Clans", second, true)
      .addField("Clans", third, true)
      .addField("Clans", fourth, true)
      .addField("Clans", fifth, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
    else { message.reply("Sorry! An error occurred, Please try again..."); }
  });
}
function GetTrackedClans(message) {
  Database.GetClanDetails(message.guild.id, false, async function(isError, isFound, data) {
    var server_clan_ids = data.server_clan_ids.split(",");
    var clans = [];
    var clanData = { "names": [], "ids":[] }
    for(var i in server_clan_ids) {
      try {
        const headers = { headers: { "X-API-Key": Config.apiKey, "Content-Type": "application/json" } };
        const request = await fetch(`https://www.bungie.net/Platform/GroupV2/${ server_clan_ids[i] }/`, headers);
        const response = await request.json();
        if(request.ok && response.ErrorCode && response.ErrorCode !== 1) { console.log(`Error: ${ JSON.stringify(response) }`); }
        else if(request.ok) { clans.push({ "name": response.Response.detail.name, "groupId": response.Response.detail.groupId }); }
        else { console.log(`Error: ${ JSON.stringify(response) }`); }
      }
      catch (err) { }
    }
    for(var i in clans) { clanData.names.push(`${parseInt(i)+1}: ${ clans[i].name }`); clanData.ids.push(clans[i].groupId); }
    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor("Clans Tracked")
    .setDescription("Here is a list of tracked clans for this server!")
    .addField("Name", clanData.names, true)
    .addField("Clan ID", clanData.ids, true)
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  });
}
function WriteToServer(message, fullMessage, client) {
  //Example message: ~write 630967941076221954 631357107651870733 [Message Text]
  if(message.author.id == "194972321168097280") {
    try {
      var semiMessage = fullMessage.substr("~write ".length);
      var guildInfo = semiMessage.split(" ", 2);
      var startMsg = fullMessage.indexOf('[');
      var finishMsg = fullMessage.indexOf(']');
      var messageToGuild = fullMessage.substr(startMsg + 1, finishMsg - startMsg - 1);

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor(`${ message.author.username }#${ message.author.discriminator } says:`)
      .setDescription(messageToGuild)
      .setFooter("I can't see replies to this", Config.defaultLogoURL)
      .setTimestamp()
      client.guilds.get(guildInfo[0]).channels.get(guildInfo[1]).send({embed});
    }
    catch (err) { Log.SaveLog("Error", `Error: Failed to send custom written message to channel: ${ guildInfo[1] } in guild: ${ guildInfo[0] }`); }
  }
  else { message.reply("You are not allowed to use this command. Sorry."); }
}
function WriteToAllServers(message, fullMessage, client) {
  if(message.author.id == "194972321168097280") {
    Database.GetRegisteredClansFromDB(function(isError, Clans) {
      if(!isError) {
        for(var i in Clans) {
          if(Clans[i].enable_announcements === "true") {
            try {
              var announcement = fullMessage.substr("~writeall ".length);
              var guild_id = Clans[i].guild_id;
              var guild = client.guilds.get(guild_id);
              var default_channel = Misc.getDefaultChannel(guild).id;
              if(Clans[i].announcement_channel !== "null") { default_channel = Clans[i].announcement_channel; }
              const embed = new Discord.RichEmbed()
              .setColor(0x0099FF)
              .setAuthor(`${ message.author.username }#${ message.author.discriminator } says:`)
              .setDescription(announcement)
              .setFooter("I can't see replies to this", Config.defaultLogoURL)
              .setTimestamp()
              client.guilds.get(guild_id).channels.get(default_channel).send({embed});
              console.log(`Wrote message to channel: ${ default_channel } in guild: ${ guild_id }`);
            }
            catch (err) { Log.SaveLog("Error", `Error: Failed to send custom written message to guild: ${ Clans[i].guild_id }`); }
          }
          else { console.log(`${ Clans[i].clan_name } has their announcements disabled.`); }
        }
      }
      else { message.reply("Error grabbing all clans info."); }
    });
  }
  else { message.reply("You are not allowed to use this command. Sorry."); }
}
function WriteToSpecificServer(message, fullMessage, client) {
  if(message.author.id == "194972321168097280") {
    try {
      var semiMessage = fullMessage.substr("~writeto ".length);
      var clan_details = semiMessage.split(" ", 1);
      var startMsg = fullMessage.indexOf('[');
      var finishMsg = fullMessage.indexOf(']');
      var messageToGuild = fullMessage.substr(startMsg + 1, finishMsg - startMsg - 1);
      Database.GetRegisteredClansFromDB(function(isError, Clans) {
        if(!isError) {
          for(var i in Clans) {
            try {
              if(Clans[i].clan_id === clan_details[0] || Clans[i].clan_name === clan_details[0]) {
                if(Clans[i].enable_announcements === "true") {
                  var guild = client.guilds.get(Clans[i].guild_id);
                  var default_channel = Misc.getDefaultChannel(guild).id;
                  if(Clans[i].announcement_channel !== "null") { default_channel = Clans[i].announcement_channel; }
                  const embed = new Discord.RichEmbed()
                  .setColor(0x0099FF)
                  .setAuthor(`${ message.author.username }#${ message.author.discriminator } says:`)
                  .setDescription(messageToGuild)
                  .setFooter("I can't see replies to this", Config.defaultLogoURL)
                  .setTimestamp()
                  console.log(default_channel);
                  client.guilds.get(Clans[i].guild_id).channels.get(default_channel).send({embed});
                  message.reply(`Your message has Successfully been sent to: ${ guild.name }`);
                }
                else { message.reply("Message was not sent as they have their announcements channel disabled."); }
              }
            }
            catch (err) { console.log(`Error: Failed to send custom written message to ${ Clans[i].guild_id }`); console.log(err); }
          }
        }
        else { message.reply("Error grabbing all clans info."); }
      });
    }
    catch (err) { Log.SaveLog("Error", `Error: Failed to send custom written message to ${ clan_id }`); }
  }
  else { message.reply("You are not allowed to use this command. Sorry."); }
}

//Rankings
function Rankings(type, message) {
  Database.CheckRegistered(message.author.id, function(isError, isFound, Data) {
    if(!isError) {
      if(isFound) {
        var playerData = Data;
        //Give personalised response if user has registered
        Database.GetClanDetails(message.guild.id, false, function(isError, isFound, Data) {
          if(!isError) {
            if(isFound) {
              //Get all clan data from playerInfo using server_clan_ids
              var allClanIds = Data.server_clan_ids.split(",");
              Database.GetClanLeaderboards(allClanIds, function(isError, isFound, leaderboards) {
                if(!isError) { if(isFound) { DisplayRanking(message, type, leaderboards, playerData); } }
                else { message.reply("Sorry! An error occurred, Please try again..."); }
              });
            } else { message.reply("No clan set, to set one use: `~Set clan`"); }
          } else { message.reply("Sorry! An error occurred, Please try again..."); }
        });
      }
      else {
        //Give results for default server clan as the user has not registered
        Database.GetClanDetails(message.guild.id, false, function(isError, isFound, Data) {
          if(!isError) {
            if(isFound) {
              //Get all clan data from playerInfo using clan_id
              var allClanIds = Data.server_clan_ids.split(",");
              Database.GetClanLeaderboards(allClanIds, function(isError, isFound, leaderboards) {
                if(!isError) { if(isFound) { DisplayRanking(message, type, leaderboards, undefined); } }
                else { message.reply("Sorry! An error occurred, Please try again..."); }
              });
            } else { message.reply("No clan set, to set one use: `~Set clan`"); }
          } else { message.reply("Sorry! An error occurred, Please try again..."); }
        });
      }
    }
    else { message.reply("Sorry! An error occurred, Please try again..."); }
  });
}
function DisplayRanking(message, type, leaderboards, playerData) {
  //PvP
  try {
    if(type === "infamy") {
      var leaderboard = { "names": [], "infamy": [], "resets": [] };
      leaderboards.sort(function(a, b) { return b.infamy - a.infamy; });
      top = leaderboards.slice(0, 10);
      for(var i in top) {
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName }`);
        leaderboard.infamy.push(Misc.AddCommas(top[i].infamy));
        leaderboard.resets.push(top[i].infamyResets);
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
          leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName }`);
          leaderboard.infamy.push("", Misc.AddCommas(playerStats.infamy));
          leaderboard.resets.push("", playerStats.infamyResets);
        }
        else { leaderboard.names.push("", `~Register to see your rank`); }
      }
      catch(err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Overall Infamy Rankings")
      .addField("Name", leaderboard.names, true)
      .addField("Infamy", leaderboard.infamy, true)
      .addField("Resets", leaderboard.resets, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
    else if(type === "valor") {
      var leaderboard = { "names": [], "valor": [], "resets": [] };
      leaderboards.sort(function(a, b) { return b.valor - a.valor; });
      top = leaderboards.slice(0, 10);
      for(var i in top) {
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName }`);
        leaderboard.valor.push(Misc.AddCommas(top[i].valor));
        leaderboard.resets.push(top[i].valorResets);
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
          leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName }`);
          leaderboard.valor.push("", Misc.AddCommas(playerStats.valor));
          leaderboard.resets.push("", playerStats.valorResets);
        }
        else { leaderboard.names.push("", `~Register to see your rank`); }
      }
      catch(err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Seasonal Valor Rankings")
      .addField("Name", leaderboard.names, true)
      .addField("Valor", leaderboard.valor, true)
      .addField("Resets", leaderboard.resets, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
    else if(type === "glory") {
      var leaderboard = { "names": [], "glory": [] };
      leaderboards.sort(function(a, b) { return b.glory - a.glory; });
      top = leaderboards.slice(0, 10);
      for(var i in top) {
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName }`);
        leaderboard.glory.push(Misc.AddCommas(top[i].glory));
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
          leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName }`);
          leaderboard.glory.push("", Misc.AddCommas(playerStats.glory));
        }
        else { leaderboard.names.push("", `~Register to see your rank`); }
      }
      catch(err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Seasonal Glory Rankings")
      .addField("Name", leaderboard.names, true)
      .addField("Glory", leaderboard.glory, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
    else if(type === "ironBanner") {
      var leaderboard = { "names": [], "ibKills": [], "ibWins": [] };
      leaderboards.sort(function(a, b) { return b.ibKills - a.ibKills; });
      top = leaderboards.slice(0, 10);
      for(var i in top) {
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName }`);
        leaderboard.ibKills.push(Misc.AddCommas(top[i].ibKills));
        leaderboard.ibWins.push(Misc.AddCommas(top[i].ibWins));
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
          leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName }`);
          leaderboard.ibKills.push("", Misc.AddCommas(playerStats.ibKills));
          leaderboard.ibWins.push("", Misc.AddCommas(playerStats.ibWins));
        }
        else { leaderboard.names.push("", `~Register to see your rank`); }
      }
      catch(err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Overall Iron Banner")
      .addField("Name", leaderboard.names, true)
      .addField("Kills", leaderboard.ibKills, true)
      .addField("Wins", leaderboard.ibWins, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }

    //Raids
    else if(type === "lastWish") {
      var leaderboard = { "names": [], "completions": [] };
      leaderboards.sort(function(a, b) { return b.lastWishCompletions - a.lastWishCompletions; });
      top = leaderboards.slice(0, 10);
      for(var i in top) {
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName }`);
        leaderboard.completions.push(Misc.AddCommas(top[i].lastWishCompletions));
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
          leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName }`);
          leaderboard.completions.push("", Misc.AddCommas(playerStats.lastWishCompletions));
        }
        else { leaderboard.names.push("", `~Register to see your rank`); }
      }
      catch(err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Last Wish")
      .addField("Name", leaderboard.names, true)
      .addField("Completions", leaderboard.completions, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
    else if(type === "scourge") {
      var leaderboard = { "names": [], "completions": [] };
      leaderboards.sort(function(a, b) { return b.scourgeCompletions - a.scourgeCompletions; });
      top = leaderboards.slice(0, 10);
      for(var i in top) {
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName }`);
        leaderboard.completions.push(Misc.AddCommas(top[i].scourgeCompletions));
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
          leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName }`);
          leaderboard.completions.push("", Misc.AddCommas(playerStats.scourgeCompletions));
        }
        else { leaderboard.names.push("", `~Register to see your rank`); }
      }
      catch(err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Scourge of the Past")
      .addField("Name", leaderboard.names, true)
      .addField("Completions", leaderboard.completions, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
    else if(type === "sorrows") {
      var leaderboard = { "names": [], "completions": [] };
      leaderboards.sort(function(a, b) { return b.sorrowsCompletions - a.sorrowsCompletions; });
      top = leaderboards.slice(0, 10);
      for(var i in top) {
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName }`);
        leaderboard.completions.push(Misc.AddCommas(top[i].sorrowsCompletions));
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
          leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName }`);
          leaderboard.completions.push("", Misc.AddCommas(playerStats.sorrowsCompletions));
        }
        else { leaderboard.names.push("", `~Register to see your rank`); }
      }
      catch(err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Crown of Sorrows")
      .addField("Name", leaderboard.names, true)
      .addField("Completions", leaderboard.completions, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
    else if(type === "garden") {
      var leaderboard = { "names": [], "completions": [] };
      leaderboards.sort(function(a, b) { return b.gardenCompletions - a.gardenCompletions; });
      top = leaderboards.slice(0, 10);
      for(var i in top) {
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName }`);
        leaderboard.completions.push(Misc.AddCommas(top[i].gardenCompletions));
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
          leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName }`);
          leaderboard.completions.push("", Misc.AddCommas(playerStats.gardenCompletions));
        }
        else { leaderboard.names.push("", `~Register to see your rank`); }
      }
      catch(err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Garden of Salvation")
      .addField("Name", leaderboard.names, true)
      .addField("Completions", leaderboard.completions, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }

    //Items and Titles
    else if(type === "item") {
      var leaderboard = { "names": [] };
      for(var i in leaderboards) {
        var items = leaderboards[i].items.split(",");
        for(j in items) {
          var itemToFind = message.content.substr("~ITEM ".length);
          if(message.content.substr("~ITEM ".length).toUpperCase() === "JOTUNN") { itemToFind = "JÖTUNN" }
          if(message.content.substr("~ITEM ".length).toUpperCase() === "ALWAYS ON TIME") { itemToFind = "ALWAYS ON TIME (SPARROW)" }
          if(items[j].toUpperCase() === itemToFind.toUpperCase()) { leaderboard.names.push(leaderboards[i].displayName); }
        }
      }
      if(leaderboard.names.length === 0) {
        var itemToFind = message.content.substr("~ITEM ".length);
        const embed = new Discord.RichEmbed()
        .setColor(0x0099FF)
        .setDescription("Nobody owns the " + itemToFind + " yet, or we don't track it, you can see a list of items here `~items`")
        .setFooter(Config.defaultFooter, Config.defaultLogoURL)
        .setTimestamp()
        message.channel.send({embed});
      }
      else if(leaderboard.names.length === 1) {
        var itemToFind = message.content.substr("~ITEM ".length);
        const embed = new Discord.RichEmbed()
        .setColor(0x0099FF)
        .setAuthor("The only person to own " + itemToFind + " is: ")
        .setDescription(leaderboard.names[0])
        .setFooter(Config.defaultFooter, Config.defaultLogoURL)
        .setTimestamp()
        message.channel.send({embed});
      }
      else {
        var namesRight = leaderboard.names.slice(0, (leaderboard.names.length / 2));
        var namesLeft = leaderboard.names.slice((leaderboard.names.length / 2), leaderboard.names.length);
        const embed = new Discord.RichEmbed()
        .setColor(0x0099FF)
        .setAuthor("People that own " + message.content.substr("~ITEM ".length))
        .addField("Names", namesLeft, true)
        .addField("Names", namesRight, true)
        .setFooter(Config.defaultFooter, Config.defaultLogoURL)
        .setTimestamp()
        message.channel.send({embed});
      }
    }
    else if(type === "title") {
      var leaderboard = { "names": [] };
      for(var i in leaderboards) {
        var titles = leaderboards[i].titles.split(",");
        for(j in titles) {
          var titleToFind = message.content.substr("~TITLE ".length);
          if(titles[j].toUpperCase() === titleToFind.toUpperCase()) { leaderboard.names.push(leaderboards[i].displayName); }
        }
      }
      if(leaderboard.names.length === 0) {
        var titleToFind = message.content.substr("~TITLE ".length);
        const embed = new Discord.RichEmbed()
        .setColor(0x0099FF)
        .setDescription("Nobody owns the " + titleToFind + " yet, or we don't track it, you can see a list of titles here `~titles`")
        .setFooter(Config.defaultFooter, Config.defaultLogoURL)
        .setTimestamp()
        message.channel.send({embed});
      }
      else if(leaderboard.names.length === 1) {
        var titleToFind = message.content.substr("~TITLE ".length);
        const embed = new Discord.RichEmbed()
        .setColor(0x0099FF)
        .setAuthor("The only person to own " + titleToFind + " is: ")
        .setDescription(leaderboard.names[0])
        .setFooter(Config.defaultFooter, Config.defaultLogoURL)
        .setTimestamp()
        message.channel.send({embed});
      }
      else {
        var titleToFind = message.content.substr("~TITLE ".length);
        var namesRight = leaderboard.names.slice(0, (leaderboard.names.length / 2));
        var namesLeft = leaderboard.names.slice((leaderboard.names.length / 2), leaderboard.names.length);
        const embed = new Discord.RichEmbed()
        .setColor(0x0099FF)
        .setAuthor("People that own the " + titleToFind + " title!")
        .addField("Names", namesLeft, true)
        .addField("Names", namesRight, true)
        .setFooter(Config.defaultFooter, Config.defaultLogoURL)
        .setTimestamp()
        message.channel.send({embed});
      }
    }

    //Seasonal
    else if(type === "seasonRank") {
      var leaderboard = { "names": [], "rank": [] };
      leaderboards.sort(function(a, b) { return b.seasonRank - a.seasonRank; });
      top = leaderboards.slice(0, 10);
      for(var i in top) {
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName }`);
        leaderboard.rank.push(Misc.AddCommas(top[i].seasonRank));
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
          leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName }`);
          leaderboard.rank.push("", Misc.AddCommas(playerStats.seasonRank));
        }
        else { leaderboard.names.push("", `~Register to see your rank`); }
      }
      catch(err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Season Ranks")
      .addField("Name", leaderboard.names, true)
      .addField("Rank", leaderboard.rank, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
    else if(type === "sundial") {
      var leaderboard = { "names": [], "completions": [] };
      leaderboards.sort(function(a, b) { return b.sundialCompletions - a.sundialCompletions; });
      top = leaderboards.slice(0, 10);
      for(var i in top) {
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName }`);
        leaderboard.completions.push(Misc.AddCommas(top[i].sundialCompletions));
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
          leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName }`);
          leaderboard.completions.push("", Misc.AddCommas(playerStats.sundialCompletions));
        }
        else { leaderboard.names.push("", `~Register to see your rank`); }
      }
      catch(err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Sundial Completions")
      .addField("Name", leaderboard.names, true)
      .addField("Completions", leaderboard.completions, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }

    //Others
    else if(type === "triumphScore") {
      var leaderboard = { "names": [], "score": [] };
      leaderboards.sort(function(a, b) { return b.triumphScore - a.triumphScore; });
      top = leaderboards.slice(0, 10);
      for(var i in top) {
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName }`);
        leaderboard.score.push(Misc.AddCommas(top[i].triumphScore));
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
          leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName }`);
          leaderboard.score.push("", Misc.AddCommas(playerStats.triumphScore));
        }
        else { leaderboard.names.push("", `~Register to see your rank`); }
      }
      catch(err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Triumph Scores")
      .addField("Name", leaderboard.names, true)
      .addField("Score", leaderboard.score, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
    else if(type === "totalTime") {
      var leaderboard = { "names": [], "time": [] };
      leaderboards.sort(function(a, b) { return b.timePlayed - a.timePlayed; });
      top = leaderboards.slice(0, 10);
      for(var i in top) {
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName }`);
        leaderboard.time.push(`${ Misc.AddCommas(Math.round(top[i].timePlayed/60)) } Hrs`);
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
          leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName }`);
          leaderboard.time.push("", `${ Misc.AddCommas(Math.round(playerStats.timePlayed/60)) } Hrs`);
        }
        else { leaderboard.names.push("", `~Register to see your rank`); }
      }
      catch(err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Most Time Played")
      .addField("Name", leaderboard.names, true)
      .addField("Score", leaderboard.time, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
  }
  catch (err) { message.reply("Sorry we broke... Usually happens when there was no data returned. Possibly someone doesn't have the item or title you are looking for."); }
}
function GlobalRankings(type, message) {
  Database.CheckRegistered(message.author.id, function(isError, isFound, Data) {
    if(!isError) {
      if(isFound) {
        //Give personalised response if user has registered
        var playerData = Data;
        Database.GetGlobalLeaderboards(function(isError, isFound, leaderboards) {
          if(!isError) { if(isFound) { DisplayGlobalRankings(message, type, leaderboards, playerData); } }
          else { message.reply("Sorry! An error occurred, Please try again..."); }
        });
      }
      else {
        //Give results for default server clan as the user has not registered
        Database.GetGlobalLeaderboards(function(isError, isFound, leaderboards) {
          if(!isError) { if(isFound) { DisplayGlobalRankings(message, type, leaderboards, undefined); } }
          else { message.reply("Sorry! An error occurred, Please try again..."); }
        });
      }
    }
    else { message.reply("Sorry! An error occurred, Please try again..."); }
  });
}
function DisplayGlobalRankings(message, type, leaderboards, playerData) {
  if(type === "ironBanner") {
    var leaderboard = { "names": [], "ibKills": [], "ibWins": [] };
    leaderboards.sort(function(a, b) { return b.ibKills - a.ibKills; });
    top = leaderboards.slice(0, 10);
    for(var i in top) {
      leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName }`);
      leaderboard.ibKills.push(Misc.AddCommas(top[i].ibKills));
      leaderboard.ibWins.push(Misc.AddCommas(top[i].ibWins));
    }

    try {
      if(playerData !== null) {
        var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
        var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
        leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName }`);
        leaderboard.ibKills.push("", Misc.AddCommas(playerStats.ibKills));
        leaderboard.ibWins.push("", Misc.AddCommas(playerStats.ibWins));
      }
      else { leaderboard.names.push("", `~Register to see your rank`); }
    }
    catch(err) { }

    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor("Top 10 Global Overall Iron Banner")
    .addField("Name", leaderboard.names, true)
    .addField("Kills", leaderboard.ibKills, true)
    .addField("Wins", leaderboard.ibWins, true)
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  }
  else if(type === "seasonRank") {
    var leaderboard = { "names": [], "rank": [] };
    leaderboards.sort(function(a, b) { return b.seasonRank - a.seasonRank; });
    top = leaderboards.slice(0, 10);
    for(var i in top) {
      leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName }`);
      leaderboard.rank.push(Misc.AddCommas(top[i].seasonRank));
    }

    try {
      if(playerData !== null) {
        var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
        var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
        leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName }`);
        leaderboard.rank.push("", Misc.AddCommas(playerStats.seasonRank));
      }
      else { leaderboard.names.push("", `~Register to see your rank`); }
    }
    catch(err) { }

    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor("Top 10 Global Season Rank")
    .addField("Name", leaderboard.names, true)
    .addField("Rank", leaderboard.rank, true)
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  }
  else if(type === "triumphScore") {
    var leaderboard = { "names": [], "score": [] };
    leaderboards.sort(function(a, b) { return b.triumphScore - a.triumphScore; });
    top = leaderboards.slice(0, 10);
    for(var i in top) {
      leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName }`);
      leaderboard.score.push(Misc.AddCommas(top[i].triumphScore));
    }

    try {
      if(playerData !== null) {
        var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
        var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
        leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName }`);
        leaderboard.score.push("", Misc.AddCommas(playerStats.triumphScore));
      }
      else { leaderboard.names.push("", `~Register to see your rank`); }
    }
    catch(err) { }

    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor("Top 10 Global Season Rank")
    .addField("Name", leaderboard.names, true)
    .addField("Score", leaderboard.score, true)
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  }
  else if(type === "totalTime") {
    var leaderboard = { "names": [], "time": [] };
    leaderboards.sort(function(a, b) { return b.timePlayed - a.timePlayed; });
    top = leaderboards.slice(0, 10);
    for(var i in top) {
      leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName }`);
      leaderboard.time.push(`${ Misc.AddCommas(Math.round(top[i].timePlayed/60)) } Hrs`);
    }

    try {
      if(playerData !== null) {
        var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
        var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
        leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName }`);
        leaderboard.time.push("", `${ Misc.AddCommas(Math.round(playerStats.timePlayed/60)) } Hrs`);
      }
      else { leaderboard.names.push("", `~Register to see your rank`); }
    }
    catch(err) { }

    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor("Top 10 Most Time Played")
    .addField("Name", leaderboard.names, true)
    .addField("Score", leaderboard.time, true)
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  }
}
function GlobalDryStreak(message, item) {
  if(item === "1000 VOICES") {
    Database.GetGlobalDryStreak(item, function(isError, isFound, leaderboards) {
      if(!isError) {
        Database.GetFromBroadcasts(item, function(isError, isFound, data) {
          var globalLeaderboard = [];
          for(var i in leaderboards) { globalLeaderboard.push({ "displayName": `${ leaderboards[i].displayName } ✗`, "completions": Misc.AddCommas(leaderboards[i].lastWishCompletions) }); }
          for(var i in data) { globalLeaderboard.push({ "displayName": `${ data[i].displayName } 🗸`, "completions": Misc.AddCommas(data[i].count) }); }
          globalLeaderboard.sort(function(a, b) { return b.completions - a.completions; });
          globalLeaderboard = globalLeaderboard.slice(0, 10);

          var leaderboard = { "names": [], "completions": [] };
          for(var i in globalLeaderboard) {
            leaderboard.names.push(globalLeaderboard[i].displayName);
            leaderboard.completions.push(Misc.AddCommas(globalLeaderboard[i].completions));
          }

          const embed = new Discord.RichEmbed()
          .setColor(0x0099FF)
          .setAuthor("Top 10 Unluckiest People - 1000 Voices")
          .setDescription("This does not count looted clears, just clears total. It's more of an estimate.")
          .addField("Name", leaderboard.names, true)
          .addField("Completions", leaderboard.completions, true)
          .setFooter(Config.defaultFooter, Config.defaultLogoURL)
          .setTimestamp()
          message.channel.send({embed});
        });
      }
      else { message.reply("Sorry! An error occurred, Please try again..."); }
    });
  }
  else if(item === "ANARCHY") {
    Database.GetGlobalDryStreak(item, function(isError, isFound, leaderboards) {
      if(!isError) {
        Database.GetFromBroadcasts(item, function(isError, isFound, data) {
          var globalLeaderboard = [];
          for(var i in leaderboards) { globalLeaderboard.push({ "displayName": `${ leaderboards[i].displayName } ✗`, "completions": Misc.AddCommas(leaderboards[i].scourgeCompletions) }); }
          for(var i in data) { globalLeaderboard.push({ "displayName": `${ data[i].displayName } 🗸`, "completions": Misc.AddCommas(data[i].count) }); }
          globalLeaderboard.sort(function(a, b) { return b.completions - a.completions; });
          globalLeaderboard = globalLeaderboard.slice(0, 10);

          var leaderboard = { "names": [], "completions": [] };
          for(var i in globalLeaderboard) {
            leaderboard.names.push(globalLeaderboard[i].displayName);
            leaderboard.completions.push(Misc.AddCommas(globalLeaderboard[i].completions));
          }

          const embed = new Discord.RichEmbed()
          .setColor(0x0099FF)
          .setAuthor("Top 10 Unluckiest People - Anarchy")
          .setDescription("This does not count looted clears, just clears total. It's more of an estimate.")
          .addField("Name", leaderboard.names, true)
          .addField("Completions", leaderboard.completions, true)
          .setFooter(Config.defaultFooter, Config.defaultLogoURL)
          .setTimestamp()
          message.channel.send({embed});
        });
      }
      else { message.reply("Sorry! An error occurred, Please try again..."); }
    });
  }
  else if(item === "ALWAYS ON TIME") {
    Database.GetGlobalDryStreak(item, function(isError, isFound, leaderboards) {
      if(!isError) {
        Database.GetFromBroadcasts(item, function(isError, isFound, data) {
          var globalLeaderboard = [];
          for(var i in leaderboards) { globalLeaderboard.push({ "displayName": `${ leaderboards[i].displayName } ✗`, "completions": Misc.AddCommas(leaderboards[i].scourgeCompletions) }); }
          for(var i in data) { globalLeaderboard.push({ "displayName": `${ data[i].displayName } 🗸`, "completions": Misc.AddCommas(data[i].count) }); }
          globalLeaderboard.sort(function(a, b) { return b.completions - a.completions; });
          globalLeaderboard = globalLeaderboard.slice(0, 10);

          var leaderboard = { "names": [], "completions": [] };
          for(var i in globalLeaderboard) {
            leaderboard.names.push(globalLeaderboard[i].displayName);
            leaderboard.completions.push(Misc.AddCommas(globalLeaderboard[i].completions));
          }

          const embed = new Discord.RichEmbed()
          .setColor(0x0099FF)
          .setAuthor("Top 10 Unluckiest People - Always on Time")
          .setDescription("This does not count switches, so the people here might have just never got the chest. It also does not looted clears, just clears total. It's more of an estimate.")
          .addField("Name", leaderboard.names, true)
          .addField("Completions", leaderboard.completions, true)
          .setFooter(Config.defaultFooter, Config.defaultLogoURL)
          .setTimestamp()
          message.channel.send({embed});
        });
      }
      else { message.reply("Sorry! An error occurred, Please try again..."); }
    });
  }
  else if(item === "TARRABAH") {
    Database.GetGlobalDryStreak(item, function(isError, isFound, leaderboards) {
      if(!isError) {
        Database.GetFromBroadcasts(item, function(isError, isFound, data) {
          var globalLeaderboard = [];
          for(var i in leaderboards) { globalLeaderboard.push({ "displayName": `${ leaderboards[i].displayName } ✗`, "completions": Misc.AddCommas(leaderboards[i].sorrowsCompletions) }); }
          for(var i in data) { globalLeaderboard.push({ "displayName": `${ data[i].displayName } 🗸`, "completions": Misc.AddCommas(data[i].count) }); }
          globalLeaderboard.sort(function(a, b) { return b.completions - a.completions; });
          globalLeaderboard = globalLeaderboard.slice(0, 10);

          var leaderboard = { "names": [], "completions": [] };
          for(var i in globalLeaderboard) {
            leaderboard.names.push(globalLeaderboard[i].displayName);
            leaderboard.completions.push(Misc.AddCommas(globalLeaderboard[i].completions));
          }

          const embed = new Discord.RichEmbed()
          .setColor(0x0099FF)
          .setAuthor("Top 10 Unluckiest People - Tarrabah")
          .setDescription("This does not count looted clears, just clears total. It's more of an estimate.")
          .addField("Name", leaderboard.names, true)
          .addField("Completions", leaderboard.completions, true)
          .setFooter(Config.defaultFooter, Config.defaultLogoURL)
          .setTimestamp()
          message.channel.send({embed});
        });
      }
      else { message.reply("Sorry! An error occurred, Please try again..."); }
    });
  }
  else { message.reply("The only global drystreak leaderboards are: `1000 Voices`, `Anarchy`, `Always on Time`, `Tarrabah`, If you have any others you'd like to see, request them using `~request`"); }
}
function DryStreak(message, item) {
  Database.CheckRegistered(message.author.id, function(isError, isFound, Data) {
    if(!isError) {
      var playerData = null; if(isFound) { playerData = Data; }
      Database.GetClanDetails(message.guild.id, false, function(isError, isFound, Data) {
        if(!isError) {
          if(isFound) {
            //Get all clan data from playerInfo using server_clan_ids
            var allClanIds = Data.server_clan_ids.split(",");
            if(item.toUpperCase() == "1000 VOICES") {
              Database.GetClanDryStreaks(allClanIds, "1000 Voices", function(isError, isFound, leaderboards) {
                if(!isError) { if(isFound) { DisplayDryStreak(message, "1000 Voices", leaderboards, playerData, allClanIds); } }
                else { message.reply("Sorry! An error occurred, Please try again..."); }
              });
            }
            else if(item.toUpperCase() == "ANARCHY") {
              Database.GetClanDryStreaks(allClanIds, "Anarchy", function(isError, isFound, leaderboards) {
                if(!isError) { if(isFound) { DisplayDryStreak(message, "Anarchy", leaderboards, playerData, allClanIds); } }
                else { message.reply("Sorry! An error occurred, Please try again..."); }
              });
            }
            else if(item.toUpperCase() == "ALWAYS ON TIME") {
              Database.GetClanDryStreaks(allClanIds, "Always on Time", function(isError, isFound, leaderboards) {
                if(!isError) { if(isFound) { DisplayDryStreak(message, "Always on Time", leaderboards, playerData, allClanIds); } }
                else { message.reply("Sorry! An error occurred, Please try again..."); }
              });
            }
            else if(item.toUpperCase() == "TARRABAH") {
              Database.GetClanDryStreaks(allClanIds, "Tarrabah", function(isError, isFound, leaderboards) {
                if(!isError) { if(isFound) { DisplayDryStreak(message, "Tarrabah", leaderboards, playerData, allClanIds); } }
                else { message.reply("Sorry! An error occurred, Please try again..."); }
              });
            }
            else { message.reply("The only drystreak leaderboards are: `1000 Voices`, `Anarchy`, `Tarrabah`, If you have any others you'd like to see, request them using `~request`"); }
          }
          else { message.reply("No clan set, to set one use: `~Set clan`"); }
        }
        else { message.reply("Sorry! An error occurred, Please try again..."); }
      });
    }
    else { message.reply("Sorry! An error occurred, Please try again..."); }
  });
}
function DisplayDryStreak(message, item, leaderboards, playerData, allClanIds) {
  Database.GetFromClanBroadcasts(allClanIds, item, function(isError, isFound, data) {
    var globalLeaderboard = [];
    for(var i in leaderboards) {
      if(item.toUpperCase() === "1000 VOICES") { globalLeaderboard.push({ "displayName": `${ leaderboards[i].displayName } ✗`, "membershipId": leaderboards[i].membershipId, "completions": Misc.AddCommas(leaderboards[i].lastWishCompletions) }); }
      else if(item.toUpperCase() === "ANARCHY") { globalLeaderboard.push({ "displayName": `${ leaderboards[i].displayName } ✗`, "membershipId": leaderboards[i].membershipId, "completions": Misc.AddCommas(leaderboards[i].scourgeCompletions) }); }
      else if(item.toUpperCase() === "ALWAYS ON TIME") { globalLeaderboard.push({ "displayName": `${ leaderboards[i].displayName } ✗`, "membershipId": leaderboards[i].membershipId, "completions": Misc.AddCommas(leaderboards[i].scourgeCompletions) }); }
      else if(item.toUpperCase() === "TARRABAH") { globalLeaderboard.push({ "displayName": `${ leaderboards[i].displayName } ✗`, "membershipId": leaderboards[i].membershipId, "completions": Misc.AddCommas(leaderboards[i].sorrowsCompletions) }); }
    }
    for(var i in data) { globalLeaderboard.push({ "displayName": `${ data[i].displayName } 🗸`, "completions": Misc.AddCommas(data[i].count) }); }
    globalLeaderboard.sort(function(a, b) { return b.completions - a.completions; });
    globalTopLeaderboard = globalLeaderboard.slice(0, 10);

    var leaderboard = { "names": [], "completions": [] };
    for(var i in globalTopLeaderboard) {
      leaderboard.names.push(globalTopLeaderboard[i].displayName);
      leaderboard.completions.push(Misc.AddCommas(globalTopLeaderboard[i].completions));
    }

    if(playerData !== null) {
      if(globalLeaderboard.find(e => e.membershipId === playerData.membershipId)) {
        var lPlayerData = globalLeaderboard.find(e => e.membershipId === playerData.membershipId);
        leaderboard.names.push("", lPlayerData.displayName);
        leaderboard.completions.push("", lPlayerData.completions);
      }
    }

    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor(`Top 10 Unluckiest People - ${ item }`)
    .addField("Name", leaderboard.names, true)
    .addField("Completions", leaderboard.completions, true)
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  });
}
function Profile(message) {
  Database.CheckRegistered(message.author.id, function(isError, isFound, Data) {
    if(!isError) {
      if(isFound) {
        var playerData = Data;
        //Give personalised response if user has registered
        Database.GetClanDetails(message.guild.id, false, function(isError, isFound, Data) {
          if(!isError) {
            if(isFound) {
              //Get all clan data from playerInfo using server_clan_ids
              var allClanIds = Data.server_clan_ids.split(",");
              Database.GetClanLeaderboards(allClanIds, function(isError, isFound, leaderboards) {
                if(!isError) { if(isFound) { DisplayProfile(message, leaderboards, playerData); } }
                else { message.reply("Sorry! An error occurred, Please try again..."); }
              });
            }
            else {
              Database.GetGlobalLeaderboards(function(isError, isFound, leaderboards) {
                if(!isError) { if(isFound) { DisplayProfile(message, leaderboards, playerData); } }
                else { message.reply("Sorry! An error occurred, Please try again..."); }
              });
            }
          }
          else { message.reply("Sorry! An error occurred, Please try again..."); }
        });
      }
      else { message.reply("Please register first to use this command."); }
    }
    else { message.reply("Sorry! An error occurred, Please try again..."); }
  });
}
function DisplayProfile(message, leaderboards, playerData) {
  try {
    var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
    var name = playerStats.displayName;
    var timePlayed = playerStats.timePlayed;
    var infamy = playerStats.infamy;
    var valor = playerStats.valor;
    var glory = playerStats.glory;
    var triumphScore = playerStats.triumphScore;
    var infamyResets = playerStats.infamyResets;
    var valorResets = playerStats.valorResets;
    var seasonRank = playerStats.seasonRank;
    var titles = playerStats.titles.split(",");
    var lastWishCompletions = playerStats.lastWishCompletions;
    var scourgeCompletions = playerStats.scourgeCompletions;
    var sorrowsCompletions = playerStats.sorrowsCompletions;
    var gardenCompletions = playerStats.gardenCompletions;
    var lastPlayed = playerStats.lastPlayed;

    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor(`Viewing Profile for ${ name }`)
    .addField("Name (SR)", `${ name } (${ seasonRank })`, true)
    .addField("Time Played", `${ Misc.AddCommas(Math.round(timePlayed/60)) } Hrs`, true)
    .addField("Last Played", `${ Misc.GetReadableDate(lastPlayed) }`, true)
    .addField("Valor", `${ Misc.AddCommas(valor) }`, true)
    .addField("Glory", `${ Misc.AddCommas(glory) }`, true)
    .addField("Infamy", `${ Misc.AddCommas(infamy) }`, true)
    .addField("Triumph Score", `${ Misc.AddCommas(triumphScore) }`, true)
    .addField("Raids", `${ Misc.AddCommas(lastWishCompletions + scourgeCompletions + sorrowsCompletions + gardenCompletions) }`, true)
    .addField("Titles", `${ titles.length }`, true)
    .addField("See more at", `https://guardianstats.com`)
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  }
  catch(err) { message.reply("Sorry! An error occurred, Please try again..."); console.log(err); }
}

//Others
function GetTrackedItems(message) {
  const pveItems = "1000 Voices, Anarchy, Tarrabah, Le Monarque, Jotunn, Thorn, Last Word, Izanagis Burden, Arbalest, Wendigo GL3, Lumina, Bad Juju, Xenophage, Divinity, Buzzard, Loaded Question, Whisper of the Worm, Outbreak Perfected, Legend of Acrius, Oxygen SR3, Edgewise, Wish-Ender, Leviathans Breath, Devils Ruin, Bastion";
  const pvpItems = "Luna Howl, Not Forgotten, Redrix Broadsword, Redrix Claymore, Mountain Top, Recluse, Revoker, Randys Throwing Knife, Komodo-4FR";
  const gambitItems = "Breakneck, 21% Delirium, Hush, Exit Strategy, Python";
  const others = "Always On Time";
  const embed = new Discord.RichEmbed()
  .setColor(0x0099FF)
  .setAuthor("Here is a list of tracked items!")
  .setDescription("**PvE** \n" + pveItems + "\n\n**PvP**\n" + pvpItems + "\n\n**Gambit**\n" + gambitItems + "\n\n**Others**\n" + others)
  .setFooter(Config.defaultFooter, Config.defaultLogoURL)
  .setTimestamp()
  message.channel.send({embed});
}
function GetTrackedTitles(message) {
  const titles = "Wayfarer, Dredgen, Unbroken, Chronicler, Cursebreaker, Rivensbane, Blacksmith, Reckoner, MMXIX, Shadow, Undying, Enlightened, Harbinger, Savior";
  const embed = new Discord.RichEmbed()
  .setColor(0x0099FF)
  .setAuthor("Here is a list of tracked titles!")
  .setDescription("**Titles** \n" + titles)
  .setFooter(Config.defaultFooter, Config.defaultLogoURL)
  .setTimestamp()
  message.channel.send({embed});
}
function ForceFullScan(message) {
  if(message.author.id == "194972321168097280") {
    Database.ForceFullScan(function(isError) {
      if(!isError) { message.reply("Manually forced a full rescan!"); }
      else { message.reply("Failed to force a full rescan."); }
    });
  }
  else { message.reply("You are not allowed to use this command. Sorry."); }
}
function ToggleWhitelist(message) {
  Database.CheckRegistered(message.author.id, function(isError, isFound, Data) {
    if(!isError) {
      if(isFound) {
        Database.GetClanDetails(message.guild.id, false, function(isError, isFound, Data) {
          if(!isError) {
            if(isFound) {
              if(Data.creator_id === message.author.id || message.member.hasPermission("ADMINISTRATOR")) {
                if(Data.enable_whitelist === "true") {
                  Database.DisableWhitelist(message.guild.id, function(isError) {
                    if(!isError) { message.reply("You have disabled whitelist only mode."); }
                  });
                }
                else {
                  Database.EnableWhitelist(message.guild.id, function(isError) {
                    if(!isError) {
                      message.reply("You have enabled whitelist only mode. To add items to the whitelist use `~whitelist item_name`");
                    }
                  });
                }
              } else { message.reply("Only discord administrators or the one who linked this server to the clan edit the clan."); }
            } else { message.reply("No clan set, to set one use: `~Set clan`"); }
          } else { message.reply("Sorry! An error occurred, Please try again..."); }
        });
      } else { message.reply("Please register first to use this command."); }
    } else { message.reply("Sorry! An error occurred, Please try again..."); }
  });
}
function RenewLeadership(message) {
  Database.CheckRegistered(message.author.id, function(isError, isFound, Data) {
    if(!isError) {
      if(isFound) {
        Database.GetClanDetails(message.guild.id, false, function(isError, isFound, Data) {
          if(!isError) {
            if(isFound) {
              if(Data.creator_id === message.author.id || message.member.hasPermission("ADMINISTRATOR")) {
                Database.ReAuthClan(message, function(isError) { if(!isError) { message.reply("I have re-authorized you. You should be clear to access the dashboard now!"); } });
              } else { message.reply("Only discord administrators or the one who linked this server to the clan edit the clan."); }
            } else { message.reply("No clan set, to set one use: `~Set clan`"); }
          } else { message.reply("Sorry! An error occurred, Please try again..."); }
        });
      } else { message.reply("Please register first to use this command."); }
    } else { message.reply("Sorry! An error occurred, Please try again..."); }
  });
}
function TransferLeadership(message) {
  Database.CheckRegistered(message.author.id, function(isError, isFound, Data) {
    if(!isError) {
      if(isFound) {
        Database.GetClanDetails(message.guild.id, false, function(isError, isFound, Data) {
          if(!isError) {
            if(isFound) {
              if(Data.creator_id === message.author.id || message.member.hasPermission("ADMINISTRATOR")) {
                if(message.mentions.users.first()) {
                  Database.TransferClan(message, message.guild.id, function(isError) {
                    if(!isError) { message.reply("Ownership has been transfered to: " + message.mentions.users.first().username); }
                  });
                }
                else { message.reply("You need to tag someone to transfer ownership to."); }
              } else { message.reply("Only discord administrators or the one who linked this server to the clan edit the clan."); }
            } else { message.reply("No clan set, to set one use: `~Set clan`"); }
          } else { message.reply("Sorry! An error occurred, Please try again..."); }
        });
      } else { message.reply("Please register first to use this command."); }
    } else { message.reply("Sorry! An error occurred, Please try again..."); }
  });
}
