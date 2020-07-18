//Required Libraraies
const Discord = require('discord.js');
const fs = require('fs');
const Bot = require("../bot.js");
const Misc = require("../js/misc.js");
const Log = require("../js/log.js");
const Config = require('../../Combined/configs/config.json');
const fetch = require("node-fetch");
const Database = require("./Database");

//Exports
module.exports = {
  Help, BroadcastsHelp, DrystreaksHelp, Request,
  GlobalRankings, Rankings, TrialsRankings, GlobalDryStreak, GetTrackedItems, DryStreak, GetTrackedClans,
  Profile, GetTrackedTitles, ForceFullScan, ForceGuildCheck, ToggleWhitelist, RenewLeadership, TransferLeadership,
  DisplayClanRankings, Trials, ClanInfo
};

//Important
function Help(message, type) {
  if(type === "rankings") {
    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor("Rankings Help Menu")
    .setDescription("Here is a list of ranking commands! Example: `~Iron Banner`")
    .addField("Commands", "`~Valor`, `~Glory`, `~Infamy`, `~Iron Banner`, `~Max Power`, `~Triumph Score`, `~Time Played`, `~Season Rank`, `~Clanrank Fractaline`, `~Clanrank Resonance`")
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  }
  else if(type === "dungeons") {
    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor("Dungeons Help Menu")
    .setDescription("Here is a list of dungeon commands! Example: `~Pit of Heresy`")
    .addField("Commands", "`~Shattered Throne`, `~Shattered Throne Flawless`, `~Pit of Heresy`, `~Pit of Heresy Flawless`, `~Prophecy`, `~Prophecy Flawless`")
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  }
  else if(type === "raids") {
    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor("Raids Help Menu")
    .setDescription("Here is a list of raid commands! Example: `~LW`")
    .addField("Commands", "`~LEVI`, `~pLEVI`, `~EOW`, `~pEOW`, `~SOS`, `~pSOS`, `~LW`, `~SoTP`, `~CoS`, `~GoS`")
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  }
  else if(type === "items") { GetTrackedItems(message) }
  else if(type === "titles") { GetTrackedTitles(message) }
  else if(type === "seasonal") {
    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor("Seasonal Help Menu")
    .setDescription("Here is a list of seasonal commands! Example: `~Season Rank`")
    .addField("Commands", "`~Season Rank`, `~Max Power`")
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  }
  else if(type === "preseasonal") {
    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor("Pre-seasonal Help Menu")
    .setDescription("Here is a list of pre-seasonal commands! Example: `~Fractaline`")
    .addField("Commands", "`~Sundial`, `~Fractaline`, `~Guardian Games`, `~GG`, `~Resonance`")
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  }
  else if(type === "clan") {
    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor("Clans Help Menu")
    .setDescription("Here is a list of clan commands! Example: `~Set Clan`")
    .addField("Commands", "`~Broadcasts Help`, `~Tracked Clans`, `~Set Clan`, `~Add Clan`, `~Remove Clan`")
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  }
  else if(type === "globals") {
    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor("Globals Help Menu")
    .setDescription("Here is a list of global commands! Example: `~Global Time Played`")
    .addField("Commands", "`~Global Iron Banner`, `~Global Time Played`, `~Global Season Rank`, `~Global Triumph Score`, `~Global Drystreaks`, `~Global Trials`, `~Global Laruels`, `~Global Medals`, `~Global Classes`")
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  }
  else if(type === "drystreaks") { DrystreaksHelp(message) }
  else if(type === "trials") {
    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor("Trials Help Menu")
    .setDescription("Here is a list of trials commands! Profile commands can be altered by @ing the person you wish to view: `~Trials Profile @Someone`")
    .addField("Profile Commands", "`~Trials Profile`, `~Trials Profile Weekly`, `~Trials Profile Seasonal`, `~Trials Profile Overall`")
    .addField("Weekly Rankings", "`~Trials Wins`, `~Trials Flawless`, `~Trials Final Blows`, `~Trials Post Wins`, `~Trials Carries`")
    .addField("Seasonal Rankings", "`~Trials Wins Seasonal`, `~Trials Flawless Seasonal`, `~Trials Final Blows Seasonal`, `~Trials Post Wins Seasonal`, `~Trials Carries Seasonal`")
    .addField("Overall Rankings", "`~Trials Wins Overall`, `~Trials Flawless Overall`, `~Trials Final Blows Overall`, `~Trials Post Wins Overall`, `~Trials Carries Overall`")
    .addField("Global Wins Rankings", "`~Global Trials Wins`, `~Global Trials Overall Wins`, `~Global Trials Seasonal Wins`, `~Global Trials Weekly Wins`")
    .addField("Global Flawless Rankings", "`~Global Trials Flawless`, `~Global Trials Overall Flawless`, `~Global Trials Seasonal Flawless`, `~Global Trials Weekly Flawless`")
    .addField("Global Carries Rankings", "`~Global Trials Carries`, `~Global Trials Overall Carries`, `~Global Trials Seasonal Carries`, `~Global Trials Weekly Carries`")
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  }
  else if(type === "others") {
    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor("Others Help Menu")
    .setDescription("Here is a list of other commands! Example: `~Donate`")
    .addField("Commands", "`~Donate`")
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  }
  else if(type === "guardianGames") {
    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor("Guardian Games Help Menu")
    .setDescription("Here is a list of Guardian Games commands! Example: `~GG Laurels`")
    .addField("Commands", "`~GG Laurels`, `~GG Medals`, `~GG Triumphs`, `~GG Rumble`, `~GG Supers`, `~GG Classes`, `~Global Classes`")
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  }
  else {
    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor("Hey there! I am Marvin.")
    .setDescription("I have so many commands now i've had to split them up here is a list of my help commands! Example: `~Help Rankings`")
    .addField("Categories", "`Rankings`, `Dungeons`, `Raids`, `Items`, `Titles`, `Seasonal`, `Preseasonal`, `Clan`, `Globals`, `Drystreaks`, `Trials`, `Others`")
    .addField("Request", "If you wish to request something or would like to give feedback use the request command like this: `~request I would like to see Marvin track season ranks!`")
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  }
}
function BroadcastsHelp(message) {
  const embed = new Discord.RichEmbed()
  .setColor(0x0099FF)
  .setAuthor("Broadcasts Help Menu")
  .setDescription("By default clan broadcasts are disabled, To enable this you can set a broadcasts channel.")
  .addField("Broadcasts Commands", `
  \`~Set broadcasts #channelName\`
  \`~Manage broadcasts\` or \`~Configure broadcasts\`
  \`~Remove broadcasts\`
  \`~Filter example\` - To add items or titles to blacklist
  \`~Whitelist example\` - To add items or titles to the whitelist.
  \`~Toggle whitelist\`
  \`~Toggle item broadcasts\`
  \`~Toggle title broadcasts\`
  \`~Toggle clan broadcasts\`
  `)
  .setFooter(Config.defaultFooter, Config.defaultLogoURL)
  .setTimestamp()
  message.channel.send({embed});
}
function DrystreaksHelp(message) {
  const embed = new Discord.RichEmbed()
  .setColor(0x0099FF)
  .setAuthor("Drystreaks Help Menu")
  .setDescription("Currently these are the only drystreak leaderboards.\nTo use: `~Drystreak Anarchy` or `~Global Drystreak Anarchy`")
  .addField("Drystreak Commands", "`~1000 Voices` \n`~Anarchy` \n`~Always on Time` \n`~Tarrabah` \n`~Luxurious Toast`")
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
function GetTrackedClans(message) {
  Database.GetGuild(message.guild.id, async function(isError, isFound, data) {
    if(!isError) {
      if(isFound) {
        var clans = data.clans.split(",");
        var clanData = { "names": [], "ids":[] }
        for(var i in clans) {
          await new Promise(resolve =>
            Database.GetClan(clans[i], function(isError, isFound, data) {
              if(!isError) {
                if(isFound) {
                  clanData.names.push(data.clan_name);
                  clanData.ids.push(data.clan_id);
                }
                else {
                  clanData.names.push("Clan not found");
                  clanData.ids.push("Clan was not found in database, still loading possibly? Or no longer exists.");
                }
              }
              else {
                clanData.names.push("Failed");
                clanData.ids.push("Please try again...");
              }
              resolve(true);
            })
          );
        }
        const embed = new Discord.RichEmbed()
        .setColor(0x0099FF)
        .setAuthor("Clans Tracked")
        .setDescription("Here is a list of tracked clans for this server!")
        .addField("Name", clanData.names, true)
        .addField("Clan ID", clanData.ids, true)
        .setFooter(Config.defaultFooter, Config.defaultLogoURL)
        .setTimestamp()
        message.channel.send({embed});
      }
      else { console.log("Guild not found"); message.channel.send("Server error, server data could not be found. Please try again?"); }
    }
    else { console.log("Server error"); message.channel.send("Server error. Please try again?"); }
  });
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
async function ForceGuildCheck(client, message) {
  if(message.author.id == "194972321168097280") {
    await new Promise(resolve => Database.GetAllGuilds((isError, Data) => {
      for(let g of client.guilds.array()) {
        if(Data.find(guild => guild.guild_id === g.id)) {
          Database.EnableTracking(g.id, function(isError, isFound) {
            if(!isError) { if(isFound) { Log.SaveLog("Clans", "Clan Tracking Re-Enabled: " + g.id); } }
          });
        }
      }
    }));
  }
  else { message.reply("You are not allowed to use this command. Sorry."); }
}

//Rankings
function Rankings(type, message, definitions) {
  Database.CheckRegistered(message.author.id, function(isError, isFound, Data) {
    if(!isError) {
      if(isFound) {
        var playerData = Data;
        //Give personalised response if user has registered
        Database.GetPlayer(playerData.membershipId, function(isError, isFound, Data) {
          if(!isError) {
            var playerInfo = Data;
            Database.GetGuild(message.guild.id, function(isError, isFound, Data) {
              if(!isError) {
                if(isFound) {
                  //Get all clan data from playerInfo using clans
                  var allClanIds = Data.clans.split(",");
                  Database.GetClanLeaderboards(allClanIds, function(isError, isFound, leaderboards) {
                    if(!isError) { if(isFound) { DisplayRankings(message, type, leaderboards, playerData, playerInfo, definitions); } }
                    else { message.channel.send("Currently your clan is undergoing it's first scan, this can take upto 3-5 minutes. Please wait for a message which will let you know when it's finished and ready to go!"); }
                  });
                } else { message.reply("No clan set, to set one use: `~Set clan`"); }
              } else { message.reply("Sorry! An error occurred, Please try again..."); }
            });
          }
          else { message.reply("Sorry! An error occurred, Please try again..."); }
        });
      }
      else {
        //Give results for default server clan as the user has not registered
        Database.GetGuild(message.guild.id, function(isError, isFound, Data) {
          if(!isError) {
            if(isFound) {
              //Get all clan data from playerInfo using clan_id
              var allClanIds = Data.clans.split(",");
              Database.GetClanLeaderboards(allClanIds, function(isError, isFound, leaderboards) {
                if(!isError) { if(isFound) { DisplayRankings(message, type, leaderboards, undefined, undefined, definitions); } }
                else { message.channel.send("Currently your clan is undergoing it's first scan, this can take upto 3-5 minutes. Please wait for a message which will let you know when it's finished and ready to go!"); }
              });
            } else { message.reply("No clan set, to set one use: `~Set clan`"); }
          } else { message.reply("Sorry! An error occurred, Please try again..."); }
        });
      }
    }
    else { message.reply("Sorry! An error occurred, Please try again..."); }
  });
}
function DisplayRankings(message, type, leaderboards, playerData, playerInfo, definitions) {
  //PvP
  leaderboards = leaderboards.filter(leader => leader.isPrivate === "false");
  try {
    if(type === "infamy") {
      var leaderboard = { "names": [], "infamy": [], "resets": [] };
      leaderboards.sort(function(a, b) { return b.infamy - a.infamy; });
      top = leaderboards.slice(0, 10);
      for(var i in top) {
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.infamy.push(Misc.AddCommas(top[i].infamy));
        leaderboard.resets.push(top[i].infamyResets);
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          if(playerStats) {
            var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
            leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.infamy.push("", Misc.AddCommas(playerStats.infamy));
            leaderboard.resets.push("", playerStats.infamyResets);
          }
          else {
            leaderboard.names.push("", `${ playerInfo.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.infamy.push("", Misc.AddCommas(playerInfo.infamy));
            leaderboard.resets.push("", playerInfo.infamyResets);
          }
        }
        else { leaderboard.names.push("", `~Register to see your rank`); }
      }
      catch(err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Seasonal Infamy Rankings")
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
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.valor.push(Misc.AddCommas(top[i].valor));
        leaderboard.resets.push(top[i].valorResets);
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          if(playerStats) {
            var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
            leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.valor.push("", Misc.AddCommas(playerStats.valor));
            leaderboard.resets.push("", playerStats.valorResets);
          }
          else {
            leaderboard.names.push("", `${ playerInfo.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.valor.push("", Misc.AddCommas(playerInfo.valor));
            leaderboard.resets.push("", playerInfo.valorResets);
          }
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
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.glory.push(Misc.AddCommas(top[i].glory));
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          if(playerStats) {
            var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
            leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.glory.push("", Misc.AddCommas(playerStats.glory));
          }
          else {
            leaderboard.names.push("", `${ playerInfo.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.glory.push("", Misc.AddCommas(playerInfo.glory));
          }
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
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.ibKills.push(Misc.AddCommas(top[i].ibKills));
        leaderboard.ibWins.push(Misc.AddCommas(top[i].ibWins));
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          if(playerStats) {
            var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
            leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.ibKills.push("", Misc.AddCommas(playerStats.ibKills));
            leaderboard.ibWins.push("", playerStats.ibWins);
          }
          else {
            leaderboard.names.push("", `${ playerInfo.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.ibKills.push("", Misc.AddCommas(playerInfo.ibKills));
            leaderboard.ibWins.push("", playerInfo.ibWins);
          }
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
    else if(type === "levi") {
      var leaderboard = { "names": [], "completions": [] };
      leaderboards.sort(function(a, b) { return b.leviCompletions - a.leviCompletions; });
      top = leaderboards.slice(0, 10);
      for(var i in top) {
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.completions.push(Misc.AddCommas(top[i].leviCompletions));
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          if(playerStats) {
            var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
            leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.completions.push("", Misc.AddCommas(playerStats.leviCompletions));
          }
          else {
            leaderboard.names.push("", `${ playerInfo.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.completions.push("", Misc.AddCommas(playerInfo.leviCompletions));
          }
        }
        else { leaderboard.names.push("", `~Register to see your rank`); }
      }
      catch(err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Normal: Leviathan")
      .setDescription("These results are different from Raid Report as these are from a different endpoint that tracks things differently. Only applies for the this raid.")
      .addField("Name", leaderboard.names, true)
      .addField("Completions", leaderboard.completions, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
    else if(type === "leviPres") {
      var leaderboard = { "names": [], "completions": [] };
      leaderboards.sort(function(a, b) { return b.leviPresCompletions - a.leviPresCompletions; });
      top = leaderboards.slice(0, 10);
      for(var i in top) {
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.completions.push(Misc.AddCommas(top[i].leviPresCompletions));
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          if(playerStats) {
            var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
            leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.completions.push("", Misc.AddCommas(playerStats.leviPresCompletions));
          }
          else {
            leaderboard.names.push("", `${ playerInfo.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.completions.push("", Misc.AddCommas(playerInfo.leviPresCompletions));
          }
        }
        else { leaderboard.names.push("", `~Register to see your rank`); }
      }
      catch(err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Prestige: Leviathan")
      .setDescription("These results are different from Raid Report as these are from a different endpoint that tracks things differently. Only applies for the this raid.")
      .addField("Name", leaderboard.names, true)
      .addField("Completions", leaderboard.completions, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
    else if(type === "eow") {
      var leaderboard = { "names": [], "completions": [] };
      leaderboards.sort(function(a, b) { return b.eowCompletions - a.eowCompletions; });
      top = leaderboards.slice(0, 10);
      for(var i in top) {
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.completions.push(Misc.AddCommas(top[i].eowCompletions));
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          if(playerStats) {
            var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
            leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.completions.push("", Misc.AddCommas(playerStats.eowCompletions));
          }
          else {
            leaderboard.names.push("", `${ playerInfo.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.completions.push("", Misc.AddCommas(playerInfo.eowCompletions));
          }
        }
        else { leaderboard.names.push("", `~Register to see your rank`); }
      }
      catch(err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Normal: Eater of Worlds")
      .addField("Name", leaderboard.names, true)
      .addField("Completions", leaderboard.completions, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
    else if(type === "eowPres") {
      var leaderboard = { "names": [], "completions": [] };
      leaderboards.sort(function(a, b) { return b.eowPresCompletions - a.eowPresCompletions; });
      top = leaderboards.slice(0, 10);
      for(var i in top) {
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.completions.push(Misc.AddCommas(top[i].eowPresCompletions));
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          if(playerStats) {
            var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
            leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.completions.push("", Misc.AddCommas(playerStats.eowPresCompletions));
          }
          else {
            leaderboard.names.push("", `${ playerInfo.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.completions.push("", Misc.AddCommas(playerInfo.eowPresCompletions));
          }
        }
        else { leaderboard.names.push("", `~Register to see your rank`); }
      }
      catch(err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Prestige: Eater of Worlds")
      .addField("Name", leaderboard.names, true)
      .addField("Completions", leaderboard.completions, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
    else if(type === "sos") {
      var leaderboard = { "names": [], "completions": [] };
      leaderboards.sort(function(a, b) { return b.sosCompletions - a.sosCompletions; });
      top = leaderboards.slice(0, 10);
      for(var i in top) {
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.completions.push(Misc.AddCommas(top[i].sosCompletions));
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          if(playerStats) {
            var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
            leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.completions.push("", Misc.AddCommas(playerStats.sosCompletions));
          }
          else {
            leaderboard.names.push("", `${ playerInfo.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.completions.push("", Misc.AddCommas(playerInfo.sosCompletions));
          }
        }
        else { leaderboard.names.push("", `~Register to see your rank`); }
      }
      catch(err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Normal: Spire of Stars")
      .addField("Name", leaderboard.names, true)
      .addField("Completions", leaderboard.completions, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
    else if(type === "sosPres") {
      var leaderboard = { "names": [], "completions": [] };
      leaderboards.sort(function(a, b) { return b.sosPresCompletions - a.sosPresCompletions; });
      top = leaderboards.slice(0, 10);
      for(var i in top) {
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.completions.push(Misc.AddCommas(top[i].sosPresCompletions));
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          if(playerStats) {
            var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
            leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.completions.push("", Misc.AddCommas(playerStats.sosPresCompletions));
          }
          else {
            leaderboard.names.push("", `${ playerInfo.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.completions.push("", Misc.AddCommas(playerInfo.sosPresCompletions));
          }
        }
        else { leaderboard.names.push("", `~Register to see your rank`); }
      }
      catch(err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Prestige: Spire of Stars")
      .addField("Name", leaderboard.names, true)
      .addField("Completions", leaderboard.completions, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
    else if(type === "lastWish") {
      var leaderboard = { "names": [], "completions": [] };
      leaderboards.sort(function(a, b) { return b.lastWishCompletions - a.lastWishCompletions; });
      top = leaderboards.slice(0, 10);
      for(var i in top) {
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.completions.push(Misc.AddCommas(top[i].lastWishCompletions));
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          if(playerStats) {
            var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
            leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.completions.push("", Misc.AddCommas(playerStats.lastWishCompletions));
          }
          else {
            leaderboard.names.push("", `${ playerInfo.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.completions.push("", Misc.AddCommas(playerInfo.lastWishCompletions));
          }
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
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.completions.push(Misc.AddCommas(top[i].scourgeCompletions));
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          if(playerStats) {
            var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
            leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.completions.push("", Misc.AddCommas(playerStats.scourgeCompletions));
          }
          else {
            leaderboard.names.push("", `${ playerInfo.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.completions.push("", Misc.AddCommas(playerInfo.scourgeCompletions));
          }
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
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.completions.push(Misc.AddCommas(top[i].sorrowsCompletions));
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          if(playerStats) {
            var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
            leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.completions.push("", Misc.AddCommas(playerStats.sorrowsCompletions));
          }
          else {
            leaderboard.names.push("", `${ playerInfo.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.completions.push("", Misc.AddCommas(playerInfo.sorrowsCompletions));
          }
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
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.completions.push(Misc.AddCommas(top[i].gardenCompletions));
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          if(playerStats) {
            var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
            leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.completions.push("", Misc.AddCommas(playerStats.gardenCompletions));
          }
          else {
            leaderboard.names.push("", `${ playerInfo.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.completions.push("", Misc.AddCommas(playerInfo.gardenCompletions));
          }
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
      var leaderboard = [];
      var itemInput = message.content.substr("~ITEM ".length).toUpperCase();
      
      //Rename items
      if(itemInput === "JOTUNN") { itemInput = "JÖTUNN" }
      if(itemInput === "FOURTH HORSEMAN") { itemInput = "THE FOURTH HORSEMAN" }
      if(itemInput === "THE 4TH HORSEMAN") { itemInput = "THE FOURTH HORSEMAN" }
      if(itemInput === "4TH HORSEMAN") { itemInput = "THE FOURTH HORSEMAN" }
      if(itemInput === "1K VOICES") { itemInput = "1000 VOICES" }

      //Find Items
      var itemToFind = definitions.find(e => e.name.toUpperCase() === itemInput);

      //Item exists in tracking now generate leaderboards
      if(itemToFind) {
        Database.GetFromBroadcasts(itemToFind, function(isError, isFound, Data) {
          //Store broadcasts
          var broadcasts = [];
          if(!isError) { broadcasts = Data; }

          for(var i in leaderboards) {
            var items = leaderboards[i].items.split(",");
            var broadcast = broadcasts.find(e => e.membershipId == leaderboards[i].membershipId);
            for(j in items) {
              if(items[j] === itemToFind.hash) {
                leaderboard.push(`${ leaderboards[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) } ${ broadcast ? (broadcast.count != "-1" ? `(${ broadcast.count } Raids, ` : "(") : "" }${ broadcast ? `${ new Date(broadcast.date).toLocaleDateString('en-GB') })` : "" }`)
              }
            }
          }
          if(leaderboard.length === 0) {
            const embed = new Discord.RichEmbed()
            .setColor(0x0099FF)
            .setDescription("Nobody owns the " + itemToFind.name + " yet! Go be the first!")
            .setFooter(Config.defaultFooter, Config.defaultLogoURL)
            .setTimestamp()
            message.channel.send({embed});
          }
          else if(leaderboard.length === 1) {
            const embed = new Discord.RichEmbed()
            .setColor(0x0099FF)
            .setAuthor("The only person to own " + itemToFind.name + " is: ")
            .setDescription(leaderboard[0])
            .setFooter(Config.defaultFooter, Config.defaultLogoURL)
            .setTimestamp()
            message.channel.send({embed});
          }
          else {
            var namesRight = leaderboard.slice(0, (leaderboard.length / 2));
            var namesLeft = leaderboard.slice((leaderboard.length / 2), leaderboard.length);
            let embed = new Discord.RichEmbed();
            embed.setColor(0x0099FF)
            embed.setAuthor("People that own " + itemToFind.name);
            embed.addField("Names", namesLeft, true);
            embed.addField("Names", namesRight, true);
            embed.setFooter(Config.defaultFooter, Config.defaultLogoURL);
            embed.setTimestamp();
            message.channel.send({embed});
          }
        });
      }
      else { message.channel.send("We do not track the item: " + itemInput + " yet, you can see a list of tracked items here `~items` or feel free to request tracking for this item by using `~request Please track x item.`"); }
    }
    else if(type === "title") {
      var leaderboard = [];
      var titleInput = message.content.substr("~TITLE ".length).toUpperCase();

      //Find Items
      var titleToFind = definitions.find(e => e.name.toUpperCase() === titleInput);

      //Title exists in tracking now generate leaderboards
      if(titleToFind) {
        Database.GetFromBroadcasts(titleToFind, function(isError, isFound, Data) {
          //Store broadcasts
          var broadcasts = [];
          if(!isError) { broadcasts = Data; }

          for(var i in leaderboards) {
            var titles = leaderboards[i].titles.split(",");
            var broadcast = broadcasts.find(e => e.membershipId == leaderboards[i].membershipId);
            for(j in titles) {
              if(titles[j] === titleToFind.hash) {
                leaderboard.push(`${ leaderboards[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) } ${ broadcast ? `(${ new Date(broadcast.date).toLocaleDateString('en-GB') })` : "" }`)
              }
            }
          }
          if(leaderboard.length === 0) {
            const embed = new Discord.RichEmbed()
            .setColor(0x0099FF)
            .setDescription("Nobody owns the " + titleToFind.name + " yet, Quick be the first!")
            .setFooter(Config.defaultFooter, Config.defaultLogoURL)
            .setTimestamp()
            message.channel.send({embed});
          }
          else if(leaderboard.length === 1) {
            const embed = new Discord.RichEmbed()
            .setColor(0x0099FF)
            .setAuthor("The only person to own " + titleToFind.name + " is: ")
            .setDescription(leaderboard[0])
            .setFooter(Config.defaultFooter, Config.defaultLogoURL)
            .setTimestamp()
            message.channel.send({embed});
          }
          else {
            var namesRight = leaderboard.slice(0, (leaderboard.length / 2));
            var namesLeft = leaderboard.slice((leaderboard.length / 2), leaderboard.length);
            const embed = new Discord.RichEmbed()
            .setColor(0x0099FF)
            .setAuthor("People that own the " + titleToFind.name + " title!")
            .addField("Names", namesLeft, true)
            .addField("Names", namesRight, true)
            .setFooter(Config.defaultFooter, Config.defaultLogoURL)
            .setTimestamp()
            message.channel.send({embed});
          }
        });
      }
      else { message.channel.send("Nobody owns the " + titleInput + " yet, you can see a list of tracked titles here `~titles` or feel free to request tracking for this title by using `~request Please track the x title.`"); }
    }

    //Seasonal
    else if(type === "seasonRank") {
      var leaderboard = { "names": [], "rank": [] };
      leaderboards.sort(function(a, b) { return b.seasonRank - a.seasonRank; });
      top = leaderboards.slice(0, 10);
      for(var i in top) {
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.rank.push(Misc.AddCommas(top[i].seasonRank));
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          if(playerStats) {
            var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
            leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.rank.push("", Misc.AddCommas(playerStats.seasonRank));
          }
          else {
            leaderboard.names.push("", `${ playerInfo.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.rank.push("", Misc.AddCommas(playerInfo.seasonRank));
          }
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
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.completions.push(Misc.AddCommas(top[i].sundialCompletions));
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          if(playerStats) {
            var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
            leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.completions.push("", Misc.AddCommas(playerStats.sundialCompletions));
          }
          else {
            leaderboard.names.push("", `${ playerInfo.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.completions.push("", Misc.AddCommas(playerInfo.sundialCompletions));
          }
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
    else if(type === "maxPower") {
      var leaderboard = { "names": [], "power": [] };
      leaderboards.sort(function(a, b) { return b.highestPower - a.highestPower; });
      top = leaderboards.slice(0, 10);
      for(var i in top) {
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.power.push(Misc.AddCommas(top[i].highestPower));
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          if(playerStats) {
            var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
            leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.power.push("", Misc.AddCommas(playerStats.highestPower));
          }
          else {
            leaderboard.names.push("", `${ playerInfo.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.power.push("", Misc.AddCommas(playerInfo.highestPower));
          }
        }
        else { leaderboard.names.push("", `~Register to see your rank`); }
      }
      catch(err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Highest Power")
      .setDescription("In order for this to be as accurate as possible, accounts are scanned every 3-5 minutes. If you have your highest light gear equipped for that long of a period, it should update on the leaderboards.")
      .addField("Name", leaderboard.names, true)
      .addField("Power", leaderboard.power, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }

    //Guardian Games
    else if(type === "gg_laurels") {
      var leaderboard = { "names": [], "laurels": [] };
      leaderboards = leaderboards.filter(e => JSON.parse(e.guardianGames) !== null);
      leaderboards.sort(function(a, b) { return JSON.parse(b.guardianGames)["laurels"] - JSON.parse(a.guardianGames)["laurels"]; });
      top = leaderboards.slice(0, 10);
      for(var i in top) {
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.laurels.push(Misc.AddCommas(JSON.parse(top[i].guardianGames)["laurels"]));
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
          leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
          leaderboard.laurels.push("", Misc.AddCommas(JSON.parse(playerStats.guardianGames)["laurels"]));
        }
        else { leaderboard.names.push("", `~Register to see your rank`); }
      }
      catch(err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Laurels Collected")
      .addField("Name", leaderboard.names, true)
      .addField("Laurels", leaderboard.laurels, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
    else if(type === "gg_medals") {
      var leaderboard = { "names": [], "medals": [] };
      leaderboards = leaderboards.filter(e => JSON.parse(e.guardianGames) !== null);
      leaderboards.sort(function(a, b) { return JSON.parse(b.guardianGames)["medals"] - JSON.parse(a.guardianGames)["medals"]; });
      top = leaderboards.slice(0, 10);
      for(var i in top) {
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.medals.push(Misc.AddCommas(JSON.parse(top[i].guardianGames)["medals"]));
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
          leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
          leaderboard.medals.push("", Misc.AddCommas(JSON.parse(playerStats.guardianGames)["medals"]));
        }
        else { leaderboard.names.push("", `~Register to see your rank`); }
      }
      catch(err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Medals Donated")
      .addField("Name", leaderboard.names, true)
      .addField("Medals", leaderboard.medals, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
    else if(type === "gg_rumble_super_kills") {
      var leaderboard = { "names": [], "rumble_super_kills": [] };
      leaderboards = leaderboards.filter(e => JSON.parse(e.guardianGames) !== null);
      leaderboards.sort(function(a, b) { return JSON.parse(b.guardianGames)["rumble_super_kills"] - JSON.parse(a.guardianGames)["rumble_super_kills"]; });
      top = leaderboards.slice(0, 10);
      for(var i in top) {
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.rumble_super_kills.push(Misc.AddCommas(JSON.parse(top[i].guardianGames)["rumble_super_kills"]));
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
          leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
          leaderboard.rumble_super_kills.push("", Misc.AddCommas(JSON.parse(playerStats.guardianGames)["rumble_super_kills"]));
        }
        else { leaderboard.names.push("", `~Register to see your rank`); }
      }
      catch(err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Rumble Super Kills throughout Guardian Games")
      .addField("Name", leaderboard.names, true)
      .addField("Super Kills", leaderboard.rumble_super_kills, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
    else if(type === "gg_triumphs") {
      var leaderboard = { "names": [], "triumphs": [] };
      leaderboards = leaderboards.filter(e => JSON.parse(e.guardianGames) !== null);
      leaderboards.sort(function(a, b) { return JSON.parse(b.guardianGames)["triumphs"] - JSON.parse(a.guardianGames)["triumphs"]; });
      top = leaderboards.slice(0, 10);
      for(var i in top) {
        var amount = Misc.AddCommas(JSON.parse(top[i].guardianGames)["triumphs"]);
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.triumphs.push(`${ amount } / 11`);
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
          var amount = Misc.AddCommas(JSON.parse(playerStats.guardianGames)["triumphs"]);
          leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
          leaderboard.triumphs.push("", `${ amount } / 11`);
        }
        else { leaderboard.names.push("", `~Register to see your rank`); }
      }
      catch(err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Guardian Games Triumphs Completed")
      .addField("Name", leaderboard.names, true)
      .addField("Triumphs Completed", leaderboard.triumphs, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
    else if(type === "gg_classes") {
      leaderboards = leaderboards.filter(e => JSON.parse(e.guardianGames) !== null);
      var classes = { Warlock: 0, Hunter: 0, Titan: 0 };
      var active_classes = { Warlock: 0, Hunter: 0, Titan: 0 };
      var medals = { Warlock: 0, Hunter: 0, Titan: 0 };
      var laurels = { Warlock: 0, Hunter: 0, Titan: 0 };
      for(var i in leaderboards) {
        let lastPlayed = parseInt(leaderboards[i].lastPlayed);
        if((new Date().getTime() - new Date(lastPlayed).getTime()) < (1000 * 60 * 15)) { active_classes[leaderboards[i].currentClass]++; }
        classes[leaderboards[i].currentClass]++;
        medals[leaderboards[i].currentClass] = parseInt(medals[leaderboards[i].currentClass]) + parseInt(JSON.parse(leaderboards[i].guardianGames).medals);
        laurels[leaderboards[i].currentClass] = parseInt(laurels[leaderboards[i].currentClass]) + parseInt(JSON.parse(leaderboards[i].guardianGames).laurels);
      }
      
      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Guardian Games - Classes")
      .setDescription(`
      **Total**: 
        Titans: ${ Misc.AddCommas(classes.Titan) }
        Hunters: ${ Misc.AddCommas(classes.Hunter) }
        Warlocks: ${ Misc.AddCommas(classes.Warlock) }
  
      **Online**: 
        Titans: ${ Misc.AddCommas(active_classes.Titan) }
        Hunters: ${ Misc.AddCommas(active_classes.Hunter) }
        Warlocks: ${ Misc.AddCommas(active_classes.Warlock) }
  
      **Overall Medals**: 
        Titans: ${ Misc.AddCommas(medals.Titan) }
        Hunters: ${ Misc.AddCommas(medals.Hunter) }
        Warlocks: ${ Misc.AddCommas(medals.Warlock) }
  
      **Overall Laurels**: 
        Titans: ${ Misc.AddCommas(laurels.Titan) }
        Hunters: ${ Misc.AddCommas(laurels.Hunter) }
        Warlocks: ${ Misc.AddCommas(laurels.Warlock) }
      `)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }

    //Dungeons
    else if(type === "st_dungeon") {
      var leaderboard = { "names": [], "completions": [] };
      leaderboards = leaderboards.filter(e => JSON.parse(e.shatteredThrone) !== null);
      leaderboards.sort(function(a, b) { return JSON.parse(b.shatteredThrone)["completions"] - JSON.parse(a.shatteredThrone)["completions"]; });
      top = leaderboards.slice(0, 10);
      for(var i in top) {
        var amount = Misc.AddCommas(JSON.parse(top[i].shatteredThrone)["completions"]);
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.completions.push(Misc.AddCommas(amount));
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          if(playerStats) {
            var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
            var amount = Misc.AddCommas(JSON.parse(playerStats.shatteredThrone)["completions"]);
            leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.completions.push("", Misc.AddCommas(amount));
          }
          else {
            var amount = Misc.AddCommas(JSON.parse(playerStats.shatteredThrone)["completions"]);
            leaderboard.names.push("", `${ playerInfo.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.completions.push("", Misc.AddCommas(amount));
          }
        }
        else { leaderboard.names.push("", `~Register to see your rank`); }
      }
      catch(err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Shattered Throne Completions")
      .setDescription("Due to the way this metric is tracked it is character based. This leaderboard reflects just 1 character. I've put in a ticket to get this fixed, until then the other dungeon leaderboards work fine.")
      .addField("Name", leaderboard.names, true)
      .addField("Completions", leaderboard.completions, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
    else if(type === "st_flawless_dungeon") {
      var leaderboard = { "names": [], "completions": [] };
      leaderboards = leaderboards.filter(e => JSON.parse(e.shatteredThrone) !== null);
      leaderboards.sort(function(a, b) { return JSON.parse(b.shatteredThrone)["flawless"] - JSON.parse(a.shatteredThrone)["flawless"]; });
      top = leaderboards.slice(0, 10);
      for(var i in top) {
        var amount = Misc.AddCommas(JSON.parse(top[i].shatteredThrone)["flawless"]);
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.completions.push(Misc.AddCommas(amount));
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          if(playerStats) {
            var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
            var amount = Misc.AddCommas(JSON.parse(playerStats.shatteredThrone)["flawless"]);
            leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.completions.push("", Misc.AddCommas(amount));
          }
          else {
            var amount = Misc.AddCommas(JSON.parse(playerStats.shatteredThrone)["flawless"]);
            leaderboard.names.push("", `${ playerInfo.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.completions.push("", Misc.AddCommas(amount));
          }
        }
        else { leaderboard.names.push("", `~Register to see your rank`); }
      }
      catch(err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Shattered Throne Flawless Completions")
      .addField("Name", leaderboard.names, true)
      .addField("Completions", leaderboard.completions, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
    else if(type === "pit_dungeon") {
      var leaderboard = { "names": [], "completions": [] };
      leaderboards = leaderboards.filter(e => JSON.parse(e.pitOfHeresy) !== null);
      leaderboards.sort(function(a, b) { return JSON.parse(b.pitOfHeresy)["completions"] - JSON.parse(a.pitOfHeresy)["completions"]; });
      top = leaderboards.slice(0, 10);
      for(var i in top) {
        var amount = Misc.AddCommas(JSON.parse(top[i].pitOfHeresy)["completions"]);
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.completions.push(Misc.AddCommas(amount));
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          if(playerStats) {
            var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
            var amount = Misc.AddCommas(JSON.parse(playerStats.pitOfHeresy)["completions"]);
            leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.completions.push("", Misc.AddCommas(amount));
          }
          else {
            var amount = Misc.AddCommas(JSON.parse(playerStats.pitOfHeresy)["completions"]);
            leaderboard.names.push("", `${ playerInfo.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.completions.push("", Misc.AddCommas(amount));
          }
        }
        else { leaderboard.names.push("", `~Register to see your rank`); }
      }
      catch(err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Pit Of Heresy Completions")
      .addField("Name", leaderboard.names, true)
      .addField("Completions", leaderboard.completions, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
    else if(type === "pit_flawless_dungeon") {
      var leaderboard = { "names": [], "completions": [] };
      leaderboards = leaderboards.filter(e => JSON.parse(e.pitOfHeresy) !== null);
      leaderboards.sort(function(a, b) { return JSON.parse(b.pitOfHeresy)["flawless"] - JSON.parse(a.pitOfHeresy)["flawless"]; });
      top = leaderboards.slice(0, 10);
      for(var i in top) {
        var amount = Misc.AddCommas(JSON.parse(top[i].pitOfHeresy)["flawless"]);
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.completions.push(Misc.AddCommas(amount));
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          if(playerStats) {
            var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
            var amount = Misc.AddCommas(JSON.parse(playerStats.pitOfHeresy)["flawless"]);
            leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.completions.push("", Misc.AddCommas(amount));
          }
          else {
            var amount = Misc.AddCommas(JSON.parse(playerStats.pitOfHeresy)["flawless"]);
            leaderboard.names.push("", `${ playerInfo.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.completions.push("", Misc.AddCommas(amount));
          }
        }
        else { leaderboard.names.push("", `~Register to see your rank`); }
      }
      catch(err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Pit Of Heresy Flawless Completions")
      .addField("Name", leaderboard.names, true)
      .addField("Completions", leaderboard.completions, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
    else if(type === "prophecy_dungeon") {
      var leaderboard = { "names": [], "completions": [] };
      leaderboards = leaderboards.filter(e => JSON.parse(e.prophecy) !== null);
      leaderboards.sort(function(a, b) { return JSON.parse(b.prophecy)["completions"] - JSON.parse(a.prophecy)["completions"]; });
      top = leaderboards.slice(0, 10);
      for(var i in top) {
        var amount = Misc.AddCommas(JSON.parse(top[i].prophecy)["completions"]);
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.completions.push(Misc.AddCommas(amount));
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          if(playerStats) {
            var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
            var amount = Misc.AddCommas(JSON.parse(playerStats.prophecy)["completions"]);
            leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.completions.push("", Misc.AddCommas(amount));
          }
          else {
            var amount = Misc.AddCommas(JSON.parse(playerStats.prophecy)["completions"]);
            leaderboard.names.push("", `${ playerInfo.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.completions.push("", Misc.AddCommas(amount));
          }
        }
        else { leaderboard.names.push("", `~Register to see your rank`); }
      }
      catch(err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Prophecy Completions")
      .addField("Name", leaderboard.names, true)
      .addField("Completions", leaderboard.completions, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
    else if(type === "prophecy_flawless_dungeon") {
      var leaderboard = { "names": [], "completions": [] };
      leaderboards = leaderboards.filter(e => JSON.parse(e.prophecy) !== null);
      leaderboards.sort(function(a, b) { return JSON.parse(b.prophecy)["flawless"] - JSON.parse(a.prophecy)["flawless"]; });
      top = leaderboards.slice(0, 10);
      for(var i in top) {
        var amount = Misc.AddCommas(JSON.parse(top[i].prophecy)["flawless"]);
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.completions.push(Misc.AddCommas(amount));
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          if(playerStats) {
            var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
            var amount = Misc.AddCommas(JSON.parse(playerStats.prophecy)["flawless"]);
            leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.completions.push("", Misc.AddCommas(amount));
          }
          else {
            var amount = Misc.AddCommas(JSON.parse(playerStats.prophecy)["flawless"]);
            leaderboard.names.push("", `${ playerInfo.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.completions.push("", Misc.AddCommas(amount));
          }
        }
        else { leaderboard.names.push("", `~Register to see your rank`); }
      }
      catch(err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Prophecy Flawless Completions")
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
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.score.push(Misc.AddCommas(top[i].triumphScore));
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          if(playerStats) {
            var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
            leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.score.push("", Misc.AddCommas(playerStats.triumphScore));
          }
          else {
            leaderboard.names.push("", `${ playerInfo.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.score.push("", Misc.AddCommas(playerInfo.triumphScore));
          }
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
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.time.push(`${ Misc.AddCommas(Math.round(top[i].timePlayed/60)) } Hrs`);
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          if(playerStats) {
            var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
            leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.time.push("", `${ Misc.AddCommas(Math.round(playerStats.timePlayed/60)) } Hrs`);
          }
          else {
            leaderboard.names.push("", `${ playerInfo.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.time.push("", `${ Misc.AddCommas(Math.round(playerInfo.timePlayed/60)) } Hrs`);
          }
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
    else if(type === "totalTitles") {
      var leaderboard = { "names": [], "titles": [] };
      leaderboards.sort(function(a, b) { return b.titles.split(",").length - a.titles.split(",").length; });
      top = leaderboards.slice(0, 10);
      for(var i in top) {
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.titles.push(`${ top[i].titles.split(",").length }`);
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          if(playerStats) {
            var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
            leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.titles.push("", `${ playerStats.titles.split(",").length }`);
          }
          else {
            leaderboard.names.push("", `${ playerInfo.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.titles.push("", `${ playerInfo.titles.split(",").length }`);
          }
        }
        else { leaderboard.names.push("", `~Register to see your rank`); }
      }
      catch(err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Title Collectors")
      .addField("Name", leaderboard.names, true)
      .addField("Score", leaderboard.titles, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
    else if(type === "totalRaids") {
      var leaderboard = { "names": [], "raids": [] };
      leaderboards.sort(function(a, b) { return b.totalRaids - a.totalRaids; });
      top = leaderboards.slice(0, 10);
      for(var i in top) {
        leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.raids.push(`${ Misc.AddCommas(top[i].totalRaids) }`);
      }

      try {
        if(playerData !== null) {
          var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
          if(playerstats) {
            var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
            leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.raids.push("", `${ playerStats.totalRaids }`);
          }
          else {
            leaderboard.names.push("", `${ playerInfo.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
            leaderboard.raids.push("", `${ playerInfo.totalRaids }`);
          }
        }
        else { leaderboard.names.push("", `~Register to see your rank`); }
      }
      catch(err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Total Raid Completions")
      .addField("Name", leaderboard.names, true)
      .addField("Raids", leaderboard.raids, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
  }
  catch (err) { console.log(err); message.channel.send("Sorry we broke... This usually happens if you have just added a clan to Marvin and he has not scanned it yet. But If this keeps happening please join the discord and check if it's a known bug. https://guardianstats.com/joinmarvin"); }
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
      leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
      leaderboard.ibKills.push(Misc.AddCommas(top[i].ibKills));
      leaderboard.ibWins.push(Misc.AddCommas(top[i].ibWins));
    }

    try {
      if(playerData !== null) {
        var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
        var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
        leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
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
      leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
      leaderboard.rank.push(Misc.AddCommas(top[i].seasonRank));
    }

    try {
      if(playerData !== null) {
        var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
        var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
        leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
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
  else if(type === "fractaline") {
    var leaderboard = { "names": [], "rank": [] };
    leaderboards.sort(function(a, b) { return b.fractalineDonated - a.fractalineDonated; });
    top = leaderboards.slice(0, 10);
    for(var i in top) {
      leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
      leaderboard.rank.push(Misc.AddCommas(top[i].fractalineDonated));
    }

    try {
      if(playerData !== null) {
        var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
        var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
        leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.rank.push("", Misc.AddCommas(playerStats.fractalineDonated));
      }
      else { leaderboard.names.push("", `~Register to see your rank`); }
    }
    catch(err) { }

    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor("Top 10 Most Fractaline Donated")
    .addField("Name", leaderboard.names, true)
    .addField("Rank", leaderboard.rank, true)
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  }
  else if(type === "resonance") {
    var leaderboard = { "names": [], "rank": [] };
    leaderboards.sort(function(a, b) { return b.resonance - a.resonance; });
    top = leaderboards.slice(0, 10);
    for(var i in top) {
      leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
      leaderboard.rank.push(Misc.AddCommas(top[i].resonance * 100 + 200));
    }

    try {
      if(playerData !== null) {
        var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
        var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
        leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.rank.push("", Misc.AddCommas(playerStats.resonance * 100 + 200));
      }
      else { leaderboard.names.push("", `~Register to see your rank`); }
    }
    catch(err) { }

    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor("Top 10 Most Resonant Players")
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
      leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
      leaderboard.score.push(Misc.AddCommas(top[i].triumphScore));
    }

    try {
      if(playerData !== null) {
        var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
        var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
        leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.score.push("", Misc.AddCommas(playerStats.triumphScore));
      }
      else { leaderboard.names.push("", `~Register to see your rank`); }
    }
    catch(err) { }

    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor("Top 10 Global Triumph Score")
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
      leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
      leaderboard.time.push(`${ Misc.AddCommas(Math.round(top[i].timePlayed/60)) } Hrs`);
    }

    try {
      if(playerData !== null) {
        var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
        var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
        leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
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
  else if(type === "maxPower") {
    var leaderboard = { "names": [], "power": [] };
    leaderboards.sort(function(a, b) { return b.highestPower - a.highestPower; });
    top = leaderboards.slice(0, 10);
    for(var i in top) {
      leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
      leaderboard.power.push(`${ Misc.AddCommas(top[i].highestPower) }`);
    }

    try {
      if(playerData !== null) {
        var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
        var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
        leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.power.push("", `${ Misc.AddCommas(playerStats.highestPower) }`);
      }
      else { leaderboard.names.push("", `~Register to see your rank`); }
    }
    catch(err) { }

    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor("Top 10 Highest Power Level")
    .addField("Name", leaderboard.names, true)
    .addField("Power", leaderboard.power, true)
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  }
  else if(type === "seasonal_trials_wins") {
    var leaderboard = { "names": [], "wins": [] };
    leaderboards = leaderboards.filter(e => e.trials !== null);
    leaderboards.sort(function(a, b) { return JSON.parse(b.trials).seasonal.wins - JSON.parse(a.trials).seasonal.wins; });
    top = leaderboards.slice(0, 10);
    for(var i in top) {
      leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
      leaderboard.wins.push(Misc.AddCommas(JSON.parse(top[i].trials).seasonal.wins));
    }

    try {
      if(playerData !== null) {
        var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
        var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
        leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.wins.push("", Misc.AddCommas(JSON.parse(playerStats.trials).seasonal.wins));
      }
      else { leaderboard.names.push("", `~Register to see your rank`); }
    }
    catch(err) { }

    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor("Top 10 Seasonal Trials Wins")
    .addField("Name", leaderboard.names, true)
    .addField("Wins", leaderboard.wins, true)
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  }
  else if(type === "seasonal_trials_flawless") {
    var leaderboard = { "names": [], "flawless": [] };
    leaderboards = leaderboards.filter(e => e.trials !== null);
    leaderboards.sort(function(a, b) { return JSON.parse(b.trials).seasonal.flawlessTickets - JSON.parse(a.trials).seasonal.flawlessTickets; });
    top = leaderboards.slice(0, 10);
    for(var i in top) {
      leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
      leaderboard.flawless.push(Misc.AddCommas(JSON.parse(top[i].trials).seasonal.flawlessTickets));
    }

    try {
      if(playerData !== null) {
        var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
        var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
        leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.flawless.push("", Misc.AddCommas(JSON.parse(playerStats.trials).seasonal.flawlessTickets));
      }
      else { leaderboard.names.push("", `~Register to see your rank`); }
    }
    catch(err) { }

    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor("Top 10 Seasonal Trials Flawless Tickets")
    .addField("Name", leaderboard.names, true)
    .addField("Flawless Tickets", leaderboard.flawless, true)
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  }
  else if(type === "seasonal_trials_carries") {
    var leaderboard = { "names": [], "carries": [] };
    leaderboards = leaderboards.filter(e => e.trials !== null);
    leaderboards.sort(function(a, b) { return JSON.parse(b.trials).seasonal.carries - JSON.parse(a.trials).seasonal.carries; });
    top = leaderboards.slice(0, 10);
    for(var i in top) {
      leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
      leaderboard.carries.push(Misc.AddCommas(JSON.parse(top[i].trials).seasonal.carries));
    }

    try {
      if(playerData !== null) {
        var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
        var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
        leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.carries.push("", Misc.AddCommas(JSON.parse(playerStats.trials).seasonal.carries));
      }
      else { leaderboard.names.push("", `~Register to see your rank`); }
    }
    catch(err) { }

    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor("Top 10 Seasonal Trials Carries")
    .addField("Name", leaderboard.names, true)
    .addField("Carries", leaderboard.carries, true)
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  }
  else if(type === "weekly_trials_wins") {
    var leaderboard = { "names": [], "wins": [] };
    leaderboards = leaderboards.filter(e => e.trials !== null);
    leaderboards.sort(function(a, b) { return JSON.parse(b.trials).weekly.wins - JSON.parse(a.trials).weekly.wins; });
    top = leaderboards.slice(0, 10);
    for(var i in top) {
      leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
      leaderboard.wins.push(Misc.AddCommas(JSON.parse(top[i].trials).weekly.wins));
    }

    try {
      if(playerData !== null) {
        var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
        var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
        leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.wins.push("", Misc.AddCommas(JSON.parse(playerStats.trials).weekly.wins));
      }
      else { leaderboard.names.push("", `~Register to see your rank`); }
    }
    catch(err) { }

    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor("Top 10 Weekly Trials Wins")
    .addField("Name", leaderboard.names, true)
    .addField("Wins", leaderboard.wins, true)
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  }
  else if(type === "weekly_trials_flawless") {
    var leaderboard = { "names": [], "flawless": [] };
    leaderboards = leaderboards.filter(e => e.trials !== null);
    leaderboards.sort(function(a, b) { return JSON.parse(b.trials).weekly.flawlessTickets - JSON.parse(a.trials).weekly.flawlessTickets; });
    top = leaderboards.slice(0, 10);
    for(var i in top) {
      leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
      leaderboard.flawless.push(Misc.AddCommas(JSON.parse(top[i].trials).weekly.flawlessTickets));
    }

    try {
      if(playerData !== null) {
        var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
        var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
        leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.flawless.push("", Misc.AddCommas(JSON.parse(playerStats.trials).weekly.flawlessTickets));
      }
      else { leaderboard.names.push("", `~Register to see your rank`); }
    }
    catch(err) { }

    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor("Top 10 Weekly Trials Flawless Tickets")
    .addField("Name", leaderboard.names, true)
    .addField("Flawless Tickets", leaderboard.flawless, true)
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  }
  else if(type === "weekly_trials_carries") {
    var leaderboard = { "names": [], "carries": [] };
    leaderboards = leaderboards.filter(e => e.trials !== null);
    leaderboards.sort(function(a, b) { return JSON.parse(b.trials).weekly.carries - JSON.parse(a.trials).weekly.carries; });
    top = leaderboards.slice(0, 10);
    for(var i in top) {
      leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
      leaderboard.carries.push(Misc.AddCommas(JSON.parse(top[i].trials).weekly.carries));
    }

    try {
      if(playerData !== null) {
        var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
        var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
        leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.carries.push("", Misc.AddCommas(JSON.parse(playerStats.trials).weekly.carries));
      }
      else { leaderboard.names.push("", `~Register to see your rank`); }
    }
    catch(err) { }

    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor("Top 10 Weekly Trials Carries")
    .addField("Name", leaderboard.names, true)
    .addField("Carries", leaderboard.carries, true)
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  }
  else if(type === "overall_trials_wins") {
    var leaderboard = { "names": [], "wins": [] };
    leaderboards = leaderboards.filter(e => e.trials !== null);
    leaderboards.sort(function(a, b) { return JSON.parse(b.trials).overall.wins - JSON.parse(a.trials).overall.wins; });
    top = leaderboards.slice(0, 10);
    for(var i in top) {
      leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
      leaderboard.wins.push(Misc.AddCommas(JSON.parse(top[i].trials).overall.wins));
    }

    try {
      if(playerData !== null) {
        var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
        var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
        leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.wins.push("", Misc.AddCommas(JSON.parse(playerStats.trials).overall.wins));
      }
      else { leaderboard.names.push("", `~Register to see your rank`); }
    }
    catch(err) { }

    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor("Top 10 Overall Trials Wins")
    .addField("Name", leaderboard.names, true)
    .addField("Wins", leaderboard.wins, true)
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  }
  else if(type === "overall_trials_flawless") {
    var leaderboard = { "names": [], "flawless": [] };
    leaderboards = leaderboards.filter(e => e.trials !== null);
    leaderboards.sort(function(a, b) { return JSON.parse(b.trials).overall.flawlessTickets - JSON.parse(a.trials).overall.flawlessTickets; });
    top = leaderboards.slice(0, 10);
    for(var i in top) {
      leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
      leaderboard.flawless.push(Misc.AddCommas(JSON.parse(top[i].trials).overall.flawlessTickets));
    }

    try {
      if(playerData !== null) {
        var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
        var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
        leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.flawless.push("", Misc.AddCommas(JSON.parse(playerStats.trials).overall.flawlessTickets));
      }
      else { leaderboard.names.push("", `~Register to see your rank`); }
    }
    catch(err) { }

    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor("Top 10 Overall Trials Flawless Tickets")
    .addField("Name", leaderboard.names, true)
    .addField("Flawless Tickets", leaderboard.flawless, true)
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  }
  else if(type === "overall_trials_carries") {
    var leaderboard = { "names": [], "carries": [] };
    leaderboards = leaderboards.filter(e => e.trials !== null);
    leaderboards.sort(function(a, b) { return JSON.parse(b.trials).overall.carries - JSON.parse(a.trials).overall.carries; });
    top = leaderboards.slice(0, 10);
    for(var i in top) {
      leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
      leaderboard.carries.push(Misc.AddCommas(JSON.parse(top[i].trials).overall.carries));
    }

    try {
      if(playerData !== null) {
        var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
        var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
        leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.carries.push("", Misc.AddCommas(JSON.parse(playerStats.trials).overall.carries));
      }
      else { leaderboard.names.push("", `~Register to see your rank`); }
    }
    catch(err) { }

    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor("Top 10 Overall Trials Carries")
    .addField("Name", leaderboard.names, true)
    .addField("Carries", leaderboard.carries, true)
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  }
  else if(type === "gg_classes") {
    leaderboards = leaderboards.filter(e => JSON.parse(e.guardianGames) !== null);
    var classes = { Warlock: 0, Hunter: 0, Titan: 0 };
    var active_classes = { Warlock: 0, Hunter: 0, Titan: 0 };
    var medals = { Warlock: 0, Hunter: 0, Titan: 0 };
    var laurels = { Warlock: 0, Hunter: 0, Titan: 0 };
    for(var i in leaderboards) {
      let lastPlayed = parseInt(leaderboards[i].lastPlayed);
      if((new Date().getTime() - new Date(lastPlayed).getTime()) < (1000 * 60 * 15)) { active_classes[leaderboards[i].currentClass]++; }
      classes[leaderboards[i].currentClass]++;
      medals[leaderboards[i].currentClass] = parseInt(medals[leaderboards[i].currentClass]) + parseInt(JSON.parse(leaderboards[i].guardianGames).medals);
      laurels[leaderboards[i].currentClass] = parseInt(laurels[leaderboards[i].currentClass]) + parseInt(JSON.parse(leaderboards[i].guardianGames).laurels);
    }
    
    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor("Guardian Games - Classes")
    .setDescription(`
    **Total**: 
      Titans: ${ Misc.AddCommas(classes.Titan) }
      Hunters: ${ Misc.AddCommas(classes.Hunter) }
      Warlocks: ${ Misc.AddCommas(classes.Warlock) }

    **Online**: 
      Titans: ${ Misc.AddCommas(active_classes.Titan) }
      Hunters: ${ Misc.AddCommas(active_classes.Hunter) }
      Warlocks: ${ Misc.AddCommas(active_classes.Warlock) }

    **Overall Medals**: 
      Titans: ${ Misc.AddCommas(medals.Titan) }
      Hunters: ${ Misc.AddCommas(medals.Hunter) }
      Warlocks: ${ Misc.AddCommas(medals.Warlock) }

    **Overall Laurels**: 
      Titans: ${ Misc.AddCommas(laurels.Titan) }
      Hunters: ${ Misc.AddCommas(laurels.Hunter) }
      Warlocks: ${ Misc.AddCommas(laurels.Warlock) }
    `)
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  }
  else if(type === "gg_laurels") {
    var leaderboard = { "names": [], "laurels": [] };
    leaderboards = leaderboards.filter(e => JSON.parse(e.guardianGames) !== null);
    leaderboards.sort(function(a, b) { return JSON.parse(b.guardianGames)["laurels"] - JSON.parse(a.guardianGames)["laurels"]; });
    top = leaderboards.slice(0, 10);
    for(var i in top) {
      leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
      leaderboard.laurels.push(Misc.AddCommas(JSON.parse(top[i].guardianGames)["laurels"]));
    }

    try {
      if(playerData !== null) {
        var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
        var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
        leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.laurels.push("", Misc.AddCommas(JSON.parse(playerStats.guardianGames)["laurels"]));
      }
      else { leaderboard.names.push("", `~Register to see your rank`); }
    }
    catch(err) { }

    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor("Top 10 Global Laurels Collected")
    .addField("Name", leaderboard.names, true)
    .addField("Laurels", leaderboard.laurels, true)
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  }
  else if(type === "gg_medals") {
    var leaderboard = { "names": [], "medals": [] };
    leaderboards = leaderboards.filter(e => JSON.parse(e.guardianGames) !== null);
    leaderboards.sort(function(a, b) { return JSON.parse(b.guardianGames)["medals"] - JSON.parse(a.guardianGames)["medals"]; });
    top = leaderboards.slice(0, 10);
    for(var i in top) {
      leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
      leaderboard.medals.push(Misc.AddCommas(JSON.parse(top[i].guardianGames)["medals"]));
    }

    try {
      if(playerData !== null) {
        var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
        var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
        leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.medals.push("", Misc.AddCommas(JSON.parse(playerStats.guardianGames)["medals"]));
      }
      else { leaderboard.names.push("", `~Register to see your rank`); }
    }
    catch(err) { }

    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor("Top 10 Global Medals Donated")
    .addField("Name", leaderboard.names, true)
    .addField("Medals", leaderboard.medals, true)
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  }
  else if(type === "lie_quest") {
    leaderboards = leaderboards.filter(e => JSON.parse(e.lieCommQuest) !== null);
    var planets = { EDZ: 0, MOON: 0, IO: 0 };
    for(var i in leaderboards) {
      var lieCommQuest = JSON.parse(leaderboards[i].lieCommQuest);
      if(planets.EDZ < lieCommQuest.EDZ) { planets.EDZ = lieCommQuest.EDZ }
      if(planets.MOON < lieCommQuest.MOON) { planets.MOON = lieCommQuest.MOON }
      if(planets.IO < lieCommQuest.IO) { planets.IO = lieCommQuest.IO }
    }
    
    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor("Felwinter's Lie Global Progress")
    .setDescription(`
    EDZ: ${ Misc.AddCommas(planets.EDZ) } / 3,000,000 (${ Math.floor((planets.EDZ / 3000000) * 100) }%)
    MOON: ${ Misc.AddCommas(planets.MOON) } / 3,000,000 (${ Math.floor((planets.MOON / 3000000) * 100) }%)
    IO: ${ Misc.AddCommas(planets.IO) } / 3,000,000 (${ Math.floor((planets.IO / 3000000) * 100) }%)
    `)
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  }
}
function DisplayClanRankings(type, message) {
  Database.GetClans(async function(isError, clans) {
    if(!isError) {
      Database.GetGlobalLeaderboards(async function(isError, isFound, leaderboards) {
        if(!isError) {
          var clanLeaderboards = [];
          for(var i in clans) {
            if(!clanLeaderboards.find(e => e.clan_id === clans[i].clan_id)) {
            var totalFractaline = 0;
            var totalResonance = 0;
              for(var j in leaderboards) {
                if(leaderboards[j].clanId === clans[i].clan_id) {
                  totalFractaline = totalFractaline + leaderboards[j].fractalineDonated;
                  totalResonance = totalResonance + (leaderboards[j].resonance+2);
                }
              }
              clanLeaderboards.push({ "clan_id": clans[i].clan_id, "clan_name": clans[i].clan_name, "fractalineDonated": totalFractaline, "resonance": totalResonance });
            }
          }
          //Data is collected, now send to clan rankings.
          ClanRankings(message, type, clanLeaderboards, clans)
        }
        else { message.reply("Sorry! An error occurred, Please try again..."); }
      });
    }
  });
}
async function ClanRankings(message, type, leaderboards, clans) {
  if(type === "fractaline") {
    var leaderboard = { "names": [], "data": [] };
    leaderboards.sort(function(a, b) { return b.fractalineDonated - a.fractalineDonated; });
    top = leaderboards.slice(0, 10);
    for(var i in top) {
      leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].clan_name.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x })  }`);
      leaderboard.data.push(Misc.AddCommas(top[i].fractalineDonated));
    }

    //Get guild clan rankings
    await new Promise(resolve =>
      Database.GetGuild(message.guild.id, async function(isError, isFound, guild) {
        if(!isError) {
          if(isFound) {
            var clans = guild.clans.split(","); leaderboard.names.push(""); leaderboard.data.push(""); var tempData = [];
            for(var i in clans) {
              await new Promise(resolve =>
                Database.GetClan(clans[i], function(isError, isFound, clan) {
                  if(!isError) {
                    if(isFound) {
                      var clanStats = leaderboards.find(e => e.clan_id === clan.clan_id);
                      var rank = leaderboards.indexOf(leaderboards.find(e => e.clan_id === clan.clan_id));
                      tempData.push({ "name": `${ rank+1 }: ${ clanStats.clan_name.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x })  }`, "data": clanStats.fractalineDonated });
                    }
                  }
                  resolve(true);
                })
              );
            }
            tempData.sort(function(a, b) { return b.data - a.data; });
            for(var i in tempData) {
              leaderboard.names.push(tempData[i].name);
              leaderboard.data.push(Misc.AddCommas(tempData[i].data));
            }
          }
          else { leaderboard.names.push("", `~Addclan to see your clans rank`); }
        }
        else { message.channel.send("An error occurred... Please try again?"); }
        resolve(true);
      })
    );

    //Get a global amount of fractaline donated.
    var totalFractalineDonated = 0;
    for(var i in leaderboards) { totalFractalineDonated = totalFractalineDonated + leaderboards[i].fractalineDonated; }

    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor("Top 10 Clans for Fractaline Donations")
    .setDescription(`Total fractaline donated from the Marvin community: ${ Misc.AddCommas(totalFractalineDonated) }`)
    .addField("Name", leaderboard.names, true)
    .addField("Fractaline Donated", leaderboard.data, true)
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  }
  else if(type === "resonance") {
    var leaderboard = { "names": [], "data": [] };
    leaderboards.sort(function(a, b) { return b.resonance - a.resonance; });
    top = leaderboards.slice(0, 10);
    for(var i in top) {
      leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].clan_name.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x })  }`);
      leaderboard.data.push(Misc.AddCommas(top[i].resonance * 100));
    }

    //Get guild clan rankings
    await new Promise(resolve =>
      Database.GetGuild(message.guild.id, async function(isError, isFound, guild) {
        if(!isError) {
          if(isFound) {
            var clans = guild.clans.split(","); leaderboard.names.push(""); leaderboard.data.push(""); var tempData = [];
            for(var i in clans) {
              await new Promise(resolve =>
                Database.GetClan(clans[i], function(isError, isFound, clan) {
                  if(!isError) {
                    if(isFound) {
                      var clanStats = leaderboards.find(e => e.clan_id === clan.clan_id);
                      var rank = leaderboards.indexOf(leaderboards.find(e => e.clan_id === clan.clan_id));
                      tempData.push({ "name": `${ rank+1 }: ${ clanStats.clan_name.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x })  }`, "data": clanStats.resonance });
                    }
                  }
                  resolve(true);
                })
              );
            }
            tempData.sort(function(a, b) { return b.data - a.data; });
            for(var i in tempData) {
              leaderboard.names.push(tempData[i].name);
              leaderboard.data.push(Misc.AddCommas(tempData[i].data * 100));
            }
          }
          else { leaderboard.names.push("", `~Addclan to see your clans rank`); }
        }
        else { message.channel.send("An error occurred... Please try again?"); }
        resolve(true);
      })
    );

    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor("Top 10 Most Resonant Clans")
    .addField("Name", leaderboard.names, true)
    .addField("Resonance", leaderboard.data, true)
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  }
}
function GlobalDryStreak(message, definitions, item) {
  var itemDef = definitions.find(e => e.name.toUpperCase() === item);
  if(itemDef) {
    if(item === "1000 VOICES") {
      Database.GetGlobalDryStreak(itemDef, function(isError, isFound, leaderboards) {
        if(!isError) {
          Database.GetFromBroadcasts(itemDef, function(isError, isFound, data) {
            var globalLeaderboard = [];
            for(var i in leaderboards) { globalLeaderboard.push({ "displayName": `${ leaderboards[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) } ✗`, "completions": Misc.AddCommas(leaderboards[i].lastWishCompletions) }); }
            for(var i in data) { globalLeaderboard.push({ "displayName": `${ data[i].displayName } 🗸`, "completions": Misc.AddCommas(data[i].count) }); }
            globalLeaderboard.sort(function(a, b) { return b.completions - a.completions; });
            globalLeaderboard = globalLeaderboard.slice(0, 10);

            var leaderboard = { "names": [], "completions": [] };
            for(var i in globalLeaderboard) {
              leaderboard.names.push(globalLeaderboard[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }));
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
      Database.GetGlobalDryStreak(itemDef, function(isError, isFound, leaderboards) {
        if(!isError) {
          Database.GetFromBroadcasts(itemDef, function(isError, isFound, data) {
            var globalLeaderboard = [];
            for(var i in leaderboards) { globalLeaderboard.push({ "displayName": `${ leaderboards[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) } ✗`, "completions": Misc.AddCommas(leaderboards[i].scourgeCompletions) }); }
            for(var i in data) { globalLeaderboard.push({ "displayName": `${ data[i].displayName } 🗸`, "completions": Misc.AddCommas(data[i].count) }); }
            globalLeaderboard.sort(function(a, b) { return b.completions - a.completions; });
            globalLeaderboard = globalLeaderboard.slice(0, 10);

            var leaderboard = { "names": [], "completions": [] };
            for(var i in globalLeaderboard) {
              leaderboard.names.push(globalLeaderboard[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }));
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
      Database.GetGlobalDryStreak(itemDef, function(isError, isFound, leaderboards) {
        if(!isError) {
          Database.GetFromBroadcasts(itemDef, function(isError, isFound, data) {
            var globalLeaderboard = [];
            for(var i in leaderboards) { globalLeaderboard.push({ "displayName": `${ leaderboards[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) } ✗`, "completions": Misc.AddCommas(leaderboards[i].scourgeCompletions) }); }
            for(var i in data) { globalLeaderboard.push({ "displayName": `${ data[i].displayName } 🗸`, "completions": Misc.AddCommas(data[i].count) }); }
            globalLeaderboard.sort(function(a, b) { return b.completions - a.completions; });
            globalLeaderboard = globalLeaderboard.slice(0, 10);

            var leaderboard = { "names": [], "completions": [] };
            for(var i in globalLeaderboard) {
              leaderboard.names.push(globalLeaderboard[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }));
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
      Database.GetGlobalDryStreak(itemDef, function(isError, isFound, leaderboards) {
        if(!isError) {
          Database.GetFromBroadcasts(itemDef, function(isError, isFound, data) {
            var globalLeaderboard = [];
            for(var i in leaderboards) { globalLeaderboard.push({ "displayName": `${ leaderboards[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) } ✗`, "completions": Misc.AddCommas(leaderboards[i].sorrowsCompletions) }); }
            for(var i in data) { globalLeaderboard.push({ "displayName": `${ data[i].displayName } 🗸`, "completions": Misc.AddCommas(data[i].count) }); }
            globalLeaderboard.sort(function(a, b) { return b.completions - a.completions; });
            globalLeaderboard = globalLeaderboard.slice(0, 10);

            var leaderboard = { "names": [], "completions": [] };
            for(var i in globalLeaderboard) {
              leaderboard.names.push(globalLeaderboard[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }));
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
    else if(item === "LUXURIOUS TOAST") {
      Database.GetGlobalDryStreak(itemDef, function(isError, isFound, leaderboards) {
        if(!isError) {
          Database.GetFromBroadcasts(itemDef, function(isError, isFound, data) {
            var globalLeaderboard = [];
            for(var i in leaderboards) { globalLeaderboard.push({ "displayName": `${ leaderboards[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) } ✗`, "completions": Misc.AddCommas(leaderboards[i].sosCompletions + leaderboards[i].sosPresCompletions) }); }
            for(var i in data) { globalLeaderboard.push({ "displayName": `${ data[i].displayName } 🗸`, "completions": Misc.AddCommas(data[i].count) }); }
            globalLeaderboard.sort(function(a, b) { return b.completions - a.completions; });
            globalLeaderboard = globalLeaderboard.slice(0, 10);

            var leaderboard = { "names": [], "completions": [] };
            for(var i in globalLeaderboard) {
              leaderboard.names.push(globalLeaderboard[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }));
              leaderboard.completions.push(Misc.AddCommas(globalLeaderboard[i].completions));
            }

            const embed = new Discord.RichEmbed()
            .setColor(0x0099FF)
            .setAuthor("Top 10 Unluckiest People - Luxurious Toast")
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
    else { DrystreaksHelp(message) }
  }
  else { DrystreaksHelp(message) }
}
function DryStreak(message, item) {
  Database.CheckRegistered(message.author.id, function(isError, isFound, Data) {
    if(!isError) {
      var playerData = null; if(isFound) { playerData = Data; }
      Database.GetGuild(message.guild.id, function(isError, isFound, Data) {
        if(!isError) {
          if(isFound) {
            //Get all clan data from playerInfo using clans
            var allClanIds = Data.clans.split(",");
            if(item.toUpperCase() == "1000 VOICES") {
              Database.GetClanDryStreaks(allClanIds, 199171385, function(isError, isFound, leaderboards) {
                if(!isError) { if(isFound) { DisplayDryStreak(message, "1000 Voices", leaderboards, playerData, allClanIds); } }
                else { message.reply("Sorry! An error occurred, Please try again..."); }
              });
            }
            else if(item.toUpperCase() == "ANARCHY") {
              Database.GetClanDryStreaks(allClanIds, 2220014607, function(isError, isFound, leaderboards) {
                if(!isError) { if(isFound) { DisplayDryStreak(message, "Anarchy", leaderboards, playerData, allClanIds); } }
                else { message.reply("Sorry! An error occurred, Please try again..."); }
              });
            }
            else if(item.toUpperCase() == "ALWAYS ON TIME") {
              Database.GetClanDryStreaks(allClanIds, 1903459810, function(isError, isFound, leaderboards) {
                if(!isError) { if(isFound) { DisplayDryStreak(message, "Always on Time", leaderboards, playerData, allClanIds); } }
                else { message.reply("Sorry! An error occurred, Please try again..."); }
              });
            }
            else if(item.toUpperCase() == "TARRABAH") {
              Database.GetClanDryStreaks(allClanIds, 2329697053, function(isError, isFound, leaderboards) {
                if(!isError) { if(isFound) { DisplayDryStreak(message, "Tarrabah", leaderboards, playerData, allClanIds); } }
                else { message.reply("Sorry! An error occurred, Please try again..."); }
              });
            }
            else if(item.toUpperCase() == "LUXURIOUS TOAST") {
              Database.GetClanDryStreaks(allClanIds, 1866399776, function(isError, isFound, leaderboards) {
                if(!isError) { if(isFound) { DisplayDryStreak(message, "Luxurious Toast", leaderboards, playerData, allClanIds); } }
                else { message.reply("Sorry! An error occurred, Please try again..."); }
              });
            }
            else { DrystreaksHelp(message) }
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
      if(item.toUpperCase() === "1000 VOICES") { globalLeaderboard.push({ "displayName": `${ leaderboards[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) } ✗`, "membershipId": leaderboards[i].membershipId, "completions": Misc.AddCommas(leaderboards[i].lastWishCompletions) }); }
      else if(item.toUpperCase() === "ANARCHY") { globalLeaderboard.push({ "displayName": `${ leaderboards[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) } ✗`, "membershipId": leaderboards[i].membershipId, "completions": Misc.AddCommas(leaderboards[i].scourgeCompletions) }); }
      else if(item.toUpperCase() === "ALWAYS ON TIME") { globalLeaderboard.push({ "displayName": `${ leaderboards[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) } ✗`, "membershipId": leaderboards[i].membershipId, "completions": Misc.AddCommas(leaderboards[i].scourgeCompletions) }); }
      else if(item.toUpperCase() === "TARRABAH") { globalLeaderboard.push({ "displayName": `${ leaderboards[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) } ✗`, "membershipId": leaderboards[i].membershipId, "completions": Misc.AddCommas(leaderboards[i].sorrowsCompletions) }); }
      else if(item.toUpperCase() === "LUXURIOUS TOAST") { globalLeaderboard.push({ "displayName": `${ leaderboards[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) } ✗`, "membershipId": leaderboards[i].membershipId, "completions": Misc.AddCommas(leaderboards[i].sosCompletions + leaderboards[i].sosPresCompletions) }); }
    }
    for(var i in data) { globalLeaderboard.push({ "displayName": `${ data[i].displayName } 🗸`, "completions": Misc.AddCommas(data[i].count) }); }
    globalLeaderboard.sort(function(a, b) { return b.completions - a.completions; });
    globalTopLeaderboard = globalLeaderboard.slice(0, 10);

    var leaderboard = { "names": [], "completions": [] };
    for(var i in globalTopLeaderboard) {
      leaderboard.names.push(globalTopLeaderboard[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }));
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
  var userId = null;
  if(message.mentions.users.first()) { userId = message.mentions.users.first().id }
  else { userId = message.author.id }
  Database.CheckRegistered(userId, function(isError, isFound, Data) {
    if(!isError) {
      if(isFound) {
        var playerData = Data;
        //Give personalised response if user has registered
        Database.GetGlobalLeaderboards(function(isError, isFound, leaderboards) {
          if(!isError) { if(isFound) { DisplayProfile(message, leaderboards, playerData); } }
          else { message.reply("Sorry! An error occurred, Please try again..."); }
        });
      }
      else { if(message.mentions.users.first()) { message.reply("The user mentioned has not registered. So we don't know their destiny account."); } else { message.reply("Please register first to use this command."); } }
    }
    else { message.reply("Sorry! An error occurred, Please try again..."); }
  });
}
function DisplayProfile(message, leaderboards, playerData) {
  try {
    var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
    var name = playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x });
    var timePlayed = playerStats.timePlayed;
    var infamy = playerStats.infamy;
    var valor = playerStats.valor;
    var glory = playerStats.glory;
    var triumphScore = playerStats.triumphScore;
    var infamyResets = playerStats.infamyResets;
    var valorResets = playerStats.valorResets;
    var seasonRank = playerStats.seasonRank;
    var titles = playerStats.titles.split(",");
    var lastPlayed = playerStats.lastPlayed;
    var highestPower = playerStats.highestPower;

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
    .addField("Raids", `${ Misc.AddCommas(playerStats.leviCompletions + playerStats.leviPresCompletions + playerStats.eowCompletions + playerStats.eowPresCompletions + playerStats.sosCompletions + playerStats.sosPresCompletions + playerStats.lastWishCompletions + playerStats.scourgeCompletions + playerStats.sorrowsCompletions + playerStats.gardenCompletions) }`, true)
    .addField("Titles", `${ titles.length }`, true)
    .addField("Highest Power", `${ Misc.AddCommas(highestPower) }`, true)
    .addField("See more at", `https://guardianstats.com/profile/${ playerData.membershipId }`)
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  }
  catch(err) { message.reply("Sorry! An error occurred, Please try again..."); console.log(err); }
}

//Trials
function TrialsRankings(message, type, stat) {
  Database.CheckRegistered(message.author.id, function(isError, isFound, Data) {
    if(!isError) {
      if(isFound) {
        var playerData = Data;
        //Give personalised response if user has registered
        Database.GetGuild(message.guild.id, function(isError, isFound, Data) {
          if(!isError) {
            if(isFound) {
              //Get all clan data from playerInfo using clans
              var allClanIds = Data.clans.split(",");
              Database.GetClanLeaderboards(allClanIds, function(isError, isFound, leaderboards) {
                if(!isError) { if(isFound) { DisplayTrialsRankings(message, leaderboards, playerData, type, stat); } }
                else { message.reply("Sorry! An error occurred, Please try again..."); }
              });
            } else { message.reply("No clan set, to set one use: `~Set clan`"); }
          } else { message.reply("Sorry! An error occurred, Please try again..."); }
        });
      }
      else {
        //Give results for default server clan as the user has not registered
        Database.GetGuild(message.guild.id, function(isError, isFound, Data) {
          if(!isError) {
            if(isFound) {
              //Get all clan data from playerInfo using clan_id
              var allClanIds = Data.clans.split(",");
              Database.GetClanLeaderboards(allClanIds, function(isError, isFound, leaderboards) {
                if(!isError) { if(isFound) { DisplayTrialsRankings(message, leaderboards, undefined, type, stat); } }
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
function DisplayTrialsRankings(message, leaderboards, playerData, type, stat) {
  try {
    var leaderboard = { "names": [], "stat": [] };
    leaderboards.sort(function(a, b) { return JSON.parse(b.trials)[type][stat] - JSON.parse(a.trials)[type][stat]; });
    top = leaderboards.slice(0, 10);
    for(var i in top) {
      leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
      leaderboard.stat.push(Misc.AddCommas(JSON.parse(top[i].trials)[type][stat]));
    }

    try {
      if(playerData !== null) {
        var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
        var rank = leaderboards.indexOf(leaderboards.find(e => e.membershipId === playerData.membershipId));
        leaderboard.names.push("", `${ rank+1 }: ${ playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.stat.push("", Misc.AddCommas(JSON.parse(playerStats.trials)[type][stat]));
      }
      else { leaderboard.names.push("", `~Register to see your rank`); }
    }
    catch(err) { }

    if(stat === "wins"){ stat = "Wins" }
    else if(stat === "winStreak"){ stat = "Win Streak" }
    else if(stat === "flawlessTickets"){ stat = "Flawless Tickets" }
    else if(stat === "finalBlows"){ stat = "Final Blows" }
    else if(stat === "postFlawlessWins"){ stat = "Post Flawless Wins" }
    else if(stat === "carries"){ stat = "Carries (With Emblem)" }

    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor(`Top 10 ${ Misc.capitalize(type) } Trials ${ stat }`)
    .addField("Name", leaderboard.names, true)
    .addField(`${ stat }`, leaderboard.stat, true)
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  }
  catch (err) { console.log(err); message.reply("Sorry we broke... Usually happens when there was no data returned. Possibly someone doesn't have the item or title you are looking for."); }
}
function Trials(message, type) {
  var userId = null;
  if(message.mentions.users.first()) { userId = message.mentions.users.first().id }
  else { userId = message.author.id }
  Database.CheckRegistered(userId, function(isError, isFound, Data) {
    if(!isError) {
      if(isFound) {
        var playerData = Data;
        //Give personalised response if user has registered
        Database.GetGuild(message.guild.id, function(isError, isFound, Data) {
          if(!isError) {
            if(isFound) {
              //Get all clan data from playerInfo using clans
              var allClanIds = Data.clans.split(",");
              Database.GetClanLeaderboards(allClanIds, function(isError, isFound, leaderboards) {
                if(!isError) { if(isFound) { DisplayTrials(message, leaderboards, playerData, type); } }
                else { message.reply("Sorry! An error occurred, Please try again..."); }
              });
            }
            else {
              Database.GetGlobalLeaderboards(function(isError, isFound, leaderboards) {
                if(!isError) { if(isFound) { DisplayTrials(message, leaderboards, playerData, type); } }
                else { message.reply("Sorry! An error occurred, Please try again..."); }
              });
            }
          }
          else { message.reply("Sorry! An error occurred, Please try again..."); }
        });
      }
      else { if(message.mentions.users.first()) { message.reply("The user mentioned has not registered. So we don't know their destiny account. Get them to `~Register example`."); } else { message.reply("Please register first to use this command. Use `~Register example` to register."); } }
    }
    else { message.reply("Sorry! An error occurred, Please try again..."); }
  });
}
function DisplayTrials(message, leaderboards, playerData, type) {
  try {
    var playerStats = leaderboards.find(e => e.membershipId === playerData.membershipId);
    if(playerStats !== undefined) {
      var name = playerStats.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x });
      var trials = JSON.parse(playerStats.trials)[type];
  
      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor(`Viewing ${ Misc.capitalize(type) } Trials Statistics for ${ name }`)
      .addField("Name", `${ name }`, true)
      .addField("Wins", `${ Misc.AddCommas(Math.round(trials.wins)) }`, true)
      .addField("Flawless", `${ Misc.AddCommas(Math.round(trials.flawlessTickets)) }`, true)
      .addField("Final Blows", `${ Misc.AddCommas(Math.round(trials.finalBlows)) }`, true)
      .addField("Post Flawless Wins", `${ Misc.AddCommas(Math.round(trials.postFlawlessWins)) }`, true)
      .addField("Carries", `${ Misc.AddCommas(Math.round(trials.carries)) }`, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
    else { message.reply("Could not find you in our database, Your clan might not be tracked by Marvin. To do so use: `~set clan` or `~add clan` to add another clan."); }
  }
  catch(err) { message.reply("Sorry! An error occurred, Please try again..."); console.log(err); }
}

//Others
function GetTrackedItems(message) {
  const pveItems = "1000 Voices, Anarchy, Tarrabah, Le Monarque, Jotunn, Thorn, Last Word, Izanagis Burden, Arbalest, Wendigo GL3, Lumina, Bad Juju, Xenophage, Divinity, Buzzard, Loaded Question, Whisper of the Worm, Outbreak Perfected, Legend of Acrius, Oxygen SR3, Edgewise, Wish-Ender, Leviathans Breath, Devils Ruin, Fourth Horseman, Heir Apparent, Khvostov 7G-02";
  const pvpItems = "Luna Howl, Not Forgotten, Redrix Broadsword, Redrix Claymore, Mountain Top, Recluse, Revoker, Randys Throwing Knife, Komodo-4FR, Point of the Stag, Bastion, Felwinter's Lie";
  const gambitItems = "Breakneck, 21% Delirium, Hush, Exit Strategy, Python";
  const others = "Always On Time, A Thousand Wings, SCRAP CF-717-91, Silver Tercel, The Platinum Starling, Harbinger's Echo, Luxurious Toast, Armory Forged Shell, Prophetic Visionary";
  const embed = new Discord.RichEmbed()
  .setColor(0x0099FF)
  .setAuthor("Here is a list of tracked items!")
  .setDescription("To view who owns a specific item use the command like this: `~Item 1000 Voices`\n\n**PvE** \n" + pveItems + "\n\n**PvP**\n" + pvpItems + "\n\n**Gambit**\n" + gambitItems + "\n\n**Others**\n" + others)
  .setFooter(Config.defaultFooter, Config.defaultLogoURL)
  .setTimestamp()
  message.channel.send({embed});
}
function GetTrackedTitles(message) {
  const titles = "Wayfarer, Dredgen, Unbroken, Chronicler, Cursebreaker, Rivensbane, Blacksmith, Reckoner, MMXIX, Shadow, Undying, Enlightened, Harbinger, Savior, Almighty, Flawless S10, Flawless S11, Conqueror S10, Conqueror S11";
  const embed = new Discord.RichEmbed()
  .setColor(0x0099FF)
  .setAuthor("Here is a list of tracked titles!")
  .setDescription("To view who owns a specific title use the command like this: `~Title Flawless S10`\n\n**Titles** \n" + titles + "\n\n" + "**Extra** \n If you want to see who has the most titles within the tracked clans of this discord use: `~titles total`")
  .setFooter(Config.defaultFooter, Config.defaultLogoURL)
  .setTimestamp()
  message.channel.send({embed});
}
function ToggleWhitelist(message) {
  Database.CheckRegistered(message.author.id, function(isError, isFound, Data) {
    if(!isError) {
      if(isFound) {
        Database.GetGuild(message.guild.id, function(isError, isFound, Data) {
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
        Database.GetGuild(message.guild.id, function(isError, isFound, Data) {
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
        Database.GetGuild(message.guild.id, function(isError, isFound, Data) {
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
function ClanInfo(message) {
  //Get guild info
  Database.GetGuild(message.guild.id, async function(isError, isFound, data) {
    if(!isError) {
      if(isFound) {
        var clans = data.clans.split(",");
        var clanData = [];
        for(var i in clans) {
          await new Promise(resolve =>
            Database.GetClan(clans[i], function(isError, isFound, data) {
              if(!isError) {
                if(isFound) { clanData.push({ clanId: clans[i], isError: false, isFound: true, data: data }); }
                else { clanData.push({ clanId: clans[i], isError: false, isFound: false, data: null }); }
              }
              else { clanData.push({ clanId: clans[i], isError: true, isFound: false, data: null }); }
              resolve(true);
            })
          );
        }
        for(var i in clanData) {
          if(!clanData[i].isError) {
            if(clanData[i].isFound) {
              const timeOptions = { weekday: "long", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" };
              const embed = new Discord.RichEmbed()
              .setColor(0x0099FF)
              .setAuthor(`${ clanData[i].data.clan_name } (${ clanData[i].data.clan_id })`)
              .setDescription(
                `We have been tracking this clan for: ${ Misc.formatTime((new Date() - clanData[i].data.joinedOn) / 1000) }.
                The last time we scanned this clan was: ${ Misc.formatTime((new Date() - clanData[i].data.lastScan) / 1000) } ago.`
              )
              .addField("Clan Level", clanData[i].data.clan_level, true)
              .addField("Members", `${ clanData[i].data.member_count } / 100`, true)
              .addField("Online", `${ clanData[i].data.online_players }`, true)
              .setFooter(Config.defaultFooter, Config.defaultLogoURL)
              .setTimestamp()
              message.channel.send({embed});
            }
            else { message.channel.send(`Failed to find clan information possibly due to clan no longer existing or have not finished scanning it yet. Clan ID: (${ clanData[i].clanId })`); }
          }
          else { message.channel.send(`Failed to find information on clan due to an error, please try again. Clan ID: (${ clanData[i].clanId })`); }
        }
      }
      else { console.log("Guild not found"); message.channel.send("No data for this server was found. My guess is you have not added a clan yet. Use: `~set clan` to add your clan!"); }
    }
    else { console.log("Server error"); message.channel.send("Server error. Please try again?"); }
  });
}
