//Required Libraraies
const Discord = require('discord.js');
const fs = require('fs');
const Bot = require("../bot.js");
const Misc = require("../js/misc.js");
const Log = require("../js/log.js");
const Config = require('../data/config.json');
const Players = require('../data/players.json');

//Exports
module.exports = {
  Help, AnnouncementsHelp, Status, Request, GetClansTracked, WriteToServer, WriteToAllServers, WriteToSpecificServer, GetClanFromDiscordID,
  ValorRankings, GloryRankings, IronBannerRankings, InfamyRankings,
  LastWishRankings, ScourgeRankings, SorrowsRankings, GardenRankings,
  TriumphRankings, ItemsObtained, TrackedItems, TitlesObtained, TrackedTitles, TotalTime,
  SeasonRankings, SundialRankings
};

function GetArray(type, clan_id, message) {
  const Clans = JSON.parse(fs.readFileSync("./data/clans.json", "utf8"));
  const ClanInfo = Clans.find(clan => clan.clan_id == clan_id);
  try {
    if(type == "Rankings") { return JSON.parse(fs.readFileSync("./data/clans/" + clan_id + "/Rankings.json", "utf8")); }
    if(type == "Raids") { return JSON.parse(fs.readFileSync("./data/clans/" + clan_id + "/Raids.json", "utf8")); }
    if(type == "Items") { return JSON.parse(fs.readFileSync("./data/clans/" + clan_id + "/Items.json", "utf8")); }
    if(type == "Titles") { return JSON.parse(fs.readFileSync("./data/clans/" + clan_id + "/Titles.json", "utf8")); }
    if(type == "Seasonal") { return JSON.parse(fs.readFileSync("./data/clans/" + clan_id + "/Seasonal.json", "utf8")); }
    if(type == "Others") { return JSON.parse(fs.readFileSync("./data/clans/" + clan_id + "/Others.json", "utf8")); }
  }
  catch (err) {
    message.reply("Still scanning your clan for the first time, This should only take 5-10 minutes depending on the API.");
    console.log(`Informed ${ ClanInfo.clan_name } (${ ClanInfo.clan_id }) to wait until i have grabbed their clan data.`);
    Log.SaveLog("Info", `Informed ${ ClanInfo.clan_name } (${ ClanInfo.clan_id }) to wait until i have grabbed their clan data.`);
    return null;
  }
}

//Important
function Help(message) {
  const embed = new Discord.RichEmbed()
  .setColor(0x0099FF)
  .setAuthor("Hey there! I am Marvin. Here is a list of my commands!")
  .addField("Rankings", "`~Valor`, `~Glory`, `~Infamy`, `~Iron Banner`")
  .addField("Raids", "`~LW`, `~SoTP`, `~CoS`, `~GoS`")
  .addField("Items / Titles", "`~Items`, `~Titles`, `~Item Example`, `~Title Example`")
  .addField("Seasonal", "`~SeasonRanks`, `~Sundial`")
  .addField("Announcements", "`~Announcements Help`")
  .addField("Others", "`~Donate`, `~Triumph Score`")
  .addField("Request", "If you see something that isn't there that you'd like me to track request it like this: `~request I would like to see Marvin track season ranks!`")
  .setFooter(Config.defaultFooter, Config.defaultLogoURL)
  .setTimestamp()
  message.channel.send({embed});
}
function AnnouncementsHelp(message) {
  const embed = new Discord.RichEmbed()
  .setColor(0x0099FF)
  .setAuthor("Announcements Help Menu")
  .setDescription("`~Set Announcements #general` \n`~Remove Announcements` \n`~filter item name`")
  .setFooter(Config.defaultFooter, Config.defaultLogoURL)
  .setTimestamp()
  message.channel.send({embed});
}
function Status(Clans, Players, ClanScans, ClanTracked, StartupTime, client, message) {
  var thisTime = new Date().getTime(); var totalTime = thisTime - StartupTime; totalTime = Misc.formatTime(totalTime / 1000);
  const embed = new Discord.RichEmbed()
  .setColor(0x0099FF)
  .setAuthor("Status")
  .setDescription("This is the status report, Hopefully everything is in working order!")
  .addField("Users", `${ client.users.size }`, true)
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
  client.guilds.get('630967941076221954').channels.get('639582004710735883').send({embed});
  message.reply("Your request has been sent, Thank your for your valuable feedback!");
}
function GetClansTracked(Clans, message) {
  var filteredClans = []; for(var i in Clans) { if(!filteredClans.find(e => e.clan_id == Clans[i].clan_id)) { filteredClans.push(Clans[i].clan_name); } }
  let uniqueClans = [...new Set(filteredClans)];
  const embed = new Discord.RichEmbed()
  .setColor(0x0099FF)
  .setAuthor("Clans Tracked")
  .addField("Clans", uniqueClans)
  .setFooter(Config.defaultFooter, Config.defaultLogoURL)
  .setTimestamp()
  message.channel.send({embed});
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
function WriteToAllServers(Clans, message, fullMessage, client) {
  if(message.author.id == "194972321168097280") {
    for(var i in Clans) {
      var announcement = fullMessage.substr("~writeall ".length);
      var guild_id = Clans[i].guild_id;
      var guild = client.guilds.get(guild_id);
      var default_channel = Misc.getDefaultChannel(guild).id;
      if(Clans[i].announcement_channel !== null) { default_channel = Clans[i].announcement_channel; }
      try {
        const embed = new Discord.RichEmbed()
        .setColor(0x0099FF)
        .setAuthor(`${ message.author.username }#${ message.author.discriminator } says:`)
        .setDescription(announcement)
        .setFooter("I can't see replies to this", Config.defaultLogoURL)
        .setTimestamp()
        client.guilds.get(guild_id).channels.get(default_channel).send({embed});
        console.log(`Wrote message to channel: ${ default_channel } in guild: ${ guild_id }`);
      }
      catch (err) { Log.SaveLog("Error", `Error: Failed to send custom written message to channel: ${ default_channel } in guild: ${ guild_id }`); }
    }
  }
  else { message.reply("You are not allowed to use this command. Sorry."); }
}
function WriteToSpecificServer(Clans, message, fullMessage, client) {
  if(message.author.id == "194972321168097280") {
    try {
      var semiMessage = fullMessage.substr("~writeto ".length);
      var clan_details = semiMessage.split(" ", 1);
      var startMsg = fullMessage.indexOf('[');
      var finishMsg = fullMessage.indexOf(']');
      var messageToGuild = fullMessage.substr(startMsg + 1, finishMsg - startMsg - 1);

      for(var i in Clans) {
        if(Clans[i].clan_id === clan_details[0] || Clans[i].clan_name === clan_details[0]) {
          var guild_id = Clans[i].guild_id;
          var guild = client.guilds.get(guild_id);
          var default_channel = Misc.getDefaultChannel(guild).id;
          if(Clans[i].announcement_channel !== null) { default_channel = Clans[i].announcement_channel; }
          const embed = new Discord.RichEmbed()
          .setColor(0x0099FF)
          .setAuthor(`${ message.author.username }#${ message.author.discriminator } says:`)
          .setDescription(messageToGuild)
          .setFooter("I can't see replies to this", Config.defaultLogoURL)
          .setTimestamp()
          client.guilds.get(guild_id).channels.get(default_channel).send({embed});
          message.reply(`Your message has Successfully been sent to: ${ guild.name }`);
        }
      }
    }
    catch (err) { Log.SaveLog("Error", `Error: Failed to send custom written message to ${ clan_id }`); }
  }
  else { message.reply("You are not allowed to use this command. Sorry."); }
}
function GetClanFromDiscordID(Clans, message, id) {
  if(message.author.id == "194972321168097280") {
    for(var i in Clans) {
      try {
        var clanMembers = JSON.parse(fs.readFileSync("./data/clans/" + Clans[i].clan_id + "/ClanMembers.json", "utf8"));
        for(var j in clanMembers) {
          if(clanMembers[j].membership_Id == id) {
            console.log(`${ clanMembers[j].displayName } belongs to the clan: ${ Clans[i].clan_name }`);
            message.channel.send(`${ clanMembers[j].displayName } belongs to the clan: ${ Clans[i].clan_name }`);
          }
        }
      }
      catch(err) { console.log(`Could not find clan: ${ Clans[i].clan_id }`, err); }
    }
  }
  else { message.reply("You are not allowed to use this command. Sorry."); }
}

//Rankings
function ValorRankings(Clans, Players, message) {
  if(Misc.GetClanID(Clans, message.guild.id)) {
    var clan_id = Misc.GetClanID(Clans, message.guild.id);
    var membership_Id = Misc.GetMembershipID(Players, message.author.id);
    var valorRankings = null; try { valorRankings = GetArray("Rankings", clan_id, message).valorRankings; } catch (err) {  }
    if(valorRankings !== null) {
      valorRankings.sort(function(a, b) { return b.valor - a.valor; });
      var valorRanks = valorRankings.slice(0, 10); var names = []; var valor = []; var resets = [];
      for(i in valorRanks) { names.push(valorRanks[i].displayName); valor.push(Misc.AddCommas(valorRanks[i].valor)); resets.push(valorRanks[i].resets); }

      try {
        if(membership_Id) {
          var rank = valorRankings.indexOf(valorRankings.find(e => e.membership_Id === membership_Id));
          var player = valorRankings.find(e => e.membership_Id === membership_Id);
          names.push(""); valor.push(""); resets.push("");
          names.push(`${ rank+1 }: ${ player.displayName }`); valor.push(Misc.AddCommas(player.valor)); resets.push(player.resets);
        }
        else { names.push(""); valor.push(""); resets.push(""); names.push("~Register to see rank!"); }
      } catch (err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Seasonal Valor Rankings")
      .addField("Name", names, true)
      .addField("Valor", valor, true)
      .addField("Resets", resets, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
  }
  else { message.reply("No clan added, to add one use: ~RegisterClan"); }
}
function GloryRankings(Clans, Players, message) {
  if(Misc.GetClanID(Clans, message.guild.id)) {
    var clan_id = Misc.GetClanID(Clans, message.guild.id);
    var membership_Id = Misc.GetMembershipID(Players, message.author.id);
    var gloryRankings = null; try { gloryRankings = GetArray("Rankings", clan_id, message).gloryRankings; } catch (err) { }
    if(gloryRankings !== null) {
      gloryRankings.sort(function(a, b) { return b.glory - a.glory; });
      var gloryRanks = gloryRankings.slice(0, 10); var names = []; var glory = [];
      for(i in gloryRanks) { names.push(gloryRanks[i].displayName); glory.push(Misc.AddCommas(gloryRanks[i].glory)); }

      try {
        if(membership_Id) {
          var rank = gloryRankings.indexOf(gloryRankings.find(e => e.membership_Id === membership_Id));
          var player = gloryRankings.find(e => e.membership_Id === membership_Id);
          names.push(""); glory.push("");
          names.push(`${ rank+1 }: ${ player.displayName }`); glory.push(Misc.AddCommas(player.glory));
        }
        else {
          names.push(""); glory.push("");
          names.push("~Register to see rank!");
        }
      }
      catch (err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Seasonal Glory Rankings")
      .addField("Name", names, true)
      .addField("Glory", glory, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
  }
  else { message.reply("No clan added, to add one use: ~RegisterClan"); }
}
function InfamyRankings(Clans, Players, message) {
  if(Misc.GetClanID(Clans, message.guild.id)) {
    var clan_id = Misc.GetClanID(Clans, message.guild.id);
    var membership_Id = Misc.GetMembershipID(Players, message.author.id);
    var infamyRankings = null; try { infamyRankings = GetArray("Rankings", clan_id, message).infamyRankings; } catch (err) { }
    if(infamyRankings !== null) {
      infamyRankings.sort(function(a, b) { return b.infamy - a.infamy; });
      var infamyRanks = infamyRankings.slice(0, 10); var names = []; var infamy = []; var motes = [];
      for(i in infamyRanks) { names.push(infamyRanks[i].displayName); infamy.push(Misc.AddCommas(infamyRanks[i].infamy)); motes.push(Misc.AddCommas(infamyRanks[i].motesCollected)); }

      try {
        if(membership_Id) {
          var rank = infamyRankings.indexOf(infamyRankings.find(e => e.membership_Id === membership_Id));
          var player = infamyRankings.find(e => e.membership_Id === membership_Id);
          names.push(""); infamy.push(""); motes.push("");
          names.push(`${ rank+1 }: ${ player.displayName }`); infamy.push(Misc.AddCommas(player.infamy)); motes.push(Misc.AddCommas(player.motesCollected));
        }
        else {
          names.push(""); infamy.push(""); motes.push("");
          names.push("~Register to see rank!");
        }
      }
      catch (err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Infamy Ranks")
      .addField("Name", names, true)
      .addField("Infamy", infamy, true)
      .addField("Motes Collected", motes, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
  }
  else { message.reply("No clan added, to add one use: ~RegisterClan"); }
}
function IronBannerRankings(Clans, Players, message) {
  if(Misc.GetClanID(Clans, message.guild.id)) {
    var clan_id = Misc.GetClanID(Clans, message.guild.id);
    var membership_Id = Misc.GetMembershipID(Players, message.author.id);
    var ibRankings = null; try { ibRankings = GetArray("Rankings", clan_id, message).ibRankings; } catch (err) { }
    if(ibRankings !== null) {
      ibRankings.sort(function(a, b) { return b.ibKills - a.ibKills; });
      var ibRanks = ibRankings.slice(0, 10); var names = []; var kills = []; var wins = [];
      for(i in ibRanks) { names.push(ibRanks[i].displayName); kills.push(Misc.AddCommas(ibRanks[i].ibKills)); wins.push(ibRanks[i].ibWins); }

      try {
        if(membership_Id) {
          var rank = ibRankings.indexOf(ibRankings.find(e => e.membership_Id === membership_Id));
          var player = ibRankings.find(e => e.membership_Id === membership_Id);
          names.push(""); kills.push(""); wins.push("");
          names.push(`${ rank+1 }: ${ player.displayName }`); kills.push(Misc.AddCommas(player.ibKills)); wins.push(player.ibWins);
        }
        else {
          names.push(""); kills.push(""); wins.push("");
          names.push("~Register to see rank!");
        }
      }
      catch (err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Iron Banner Rankings")
      .addField("Name", names, true)
      .addField("Kills", kills, true)
      .addField("Wins", wins, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
  }
  else { message.reply("No clan added, to add one use: ~RegisterClan"); }
}

//Raids
function LastWishRankings(Clans, Players, message) {
  if(Misc.GetClanID(Clans, message.guild.id)) {
    var clan_id = Misc.GetClanID(Clans, message.guild.id);
    var membership_Id = Misc.GetMembershipID(Players, message.author.id);
    var lastWishRankings = null; try { lastWishRankings = GetArray("Raids", clan_id, message).lastWish; } catch (err) { }
    if(lastWishRankings !== null) {
      lastWishRankings.sort(function(a, b) { return b.completions - a.completions; });
      var lastWishRanks = lastWishRankings.slice(0, 10); var names = []; var completions = [];
      for(i in lastWishRanks) { names.push(lastWishRanks[i].displayName); completions.push(lastWishRanks[i].completions); }

      try {
        if(membership_Id) {
          var rank = lastWishRankings.indexOf(lastWishRankings.find(e => e.membership_Id === membership_Id));
          var player = lastWishRankings.find(e => e.membership_Id === membership_Id);
          names.push(""); completions.push("");
          names.push(`${ rank+1 }: ${ player.displayName }`); completions.push(player.completions);
        }
        else {
          names.push(""); completions.push("");
          names.push("~Register to see rank!");
        }
      }
      catch (err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Last Wish Completions")
      .addField("Name", names, true)
      .addField("Completions", completions, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
  }
  else { message.reply("No clan added, to add one use: ~RegisterClan"); }
}
function ScourgeRankings(Clans, Players, message) {
  if(Misc.GetClanID(Clans, message.guild.id)) {
    var clan_id = Misc.GetClanID(Clans, message.guild.id);
    var membership_Id = Misc.GetMembershipID(Players, message.author.id);
    var scourgeRankings = null; try { scourgeRankings = GetArray("Raids", clan_id, message).scourge; } catch (err) {  }
    if(scourgeRankings !== null) {
      scourgeRankings.sort(function(a, b) { return b.completions - a.completions; });
      var scourgeRanks = scourgeRankings.slice(0, 10); var names = []; var completions = [];
      for(i in scourgeRanks) { names.push(scourgeRanks[i].displayName); completions.push(scourgeRanks[i].completions); }

      try {
        if(membership_Id) {
          var rank = scourgeRankings.indexOf(scourgeRankings.find(e => e.membership_Id === membership_Id));
          var player = scourgeRankings.find(e => e.membership_Id === membership_Id);
          names.push(""); completions.push("");
          names.push(`${ rank+1 }: ${ player.displayName }`); completions.push(player.completions);
        }
        else {
          names.push(""); completions.push("");
          names.push("~Register to see rank!");
        }
      }
      catch (err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Scourge of the Past Completions")
      .addField("Name", names, true)
      .addField("Completions", completions, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
  }
  else { message.reply("No clan added, to add one use: ~RegisterClan"); }
}
function SorrowsRankings(Clans, Players, message) {
  if(Misc.GetClanID(Clans, message.guild.id)) {
    var clan_id = Misc.GetClanID(Clans, message.guild.id);
    var membership_Id = Misc.GetMembershipID(Players, message.author.id);
    var sorrowsRankings = null; try { sorrowsRankings = GetArray("Raids", clan_id, message).sorrows; } catch (err) { }
    if(sorrowsRankings !== null) {
      sorrowsRankings.sort(function(a, b) { return b.completions - a.completions; });
      var sorrowsRanks = sorrowsRankings.slice(0, 10); var names = []; var completions = [];
      for(i in sorrowsRanks) { names.push(sorrowsRanks[i].displayName); completions.push(sorrowsRanks[i].completions); }

      try {
        if(membership_Id) {
          var rank = sorrowsRankings.indexOf(sorrowsRankings.find(e => e.membership_Id === membership_Id));
          var player = sorrowsRankings.find(e => e.membership_Id === membership_Id);
          names.push(""); completions.push("");
          names.push(`${ rank+1 }: ${ player.displayName }`); completions.push(player.completions);
        }
        else {
          names.push(""); completions.push("");
          names.push("~Register to see rank!");
        }
      }
      catch (err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Crown of Sorrows Completions")
      .addField("Name", names, true)
      .addField("Completions", completions, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
  }
  else { message.reply("No clan added, to add one use: ~RegisterClan"); }
}
function GardenRankings(Clans, Players, message) {
  if(Misc.GetClanID(Clans, message.guild.id)) {
    var clan_id = Misc.GetClanID(Clans, message.guild.id);
    var membership_Id = Misc.GetMembershipID(Players, message.author.id);
    var gardenRankings = null; try { gardenRankings = GetArray("Raids", clan_id, message).garden; } catch (err) { }
    if(gardenRankings !== null) {
      gardenRankings.sort(function(a, b) { return b.completions - a.completions; });
      var gardenRanks = gardenRankings.slice(0, 10); var names = []; var completions = [];
      for(i in gardenRanks) { names.push(gardenRanks[i].displayName); completions.push(gardenRanks[i].completions); }

      try {
        if(membership_Id) {
          var rank = gardenRankings.indexOf(gardenRankings.find(e => e.membership_Id === membership_Id));
          var player = gardenRankings.find(e => e.membership_Id === membership_Id);
          names.push(""); completions.push("");
          names.push(`${ rank+1 }: ${ player.displayName }`); completions.push(player.completions);
        }
        else {
          names.push(""); completions.push("");
          names.push("~Register to see rank!");
        }
      }
      catch (err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Garden of Salvation Completions")
      .addField("Name", names, true)
      .addField("Completions", completions, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
  }
  else { message.reply("No clan added, to add one use: ~RegisterClan"); }
}

//Items
function ItemsObtained(Clans, Players, message, item) {
  if(Misc.GetClanID(Clans, message.guild.id)) {
    var clan_id = Misc.GetClanID(Clans, message.guild.id);
    var Items = null; try { Items = GetArray("Items", clan_id, message).itemsObtained; } catch (err) { }
    if(Items !== null) {
      var ItemsTracked = []; for(i in Items){ if(!ItemsTracked.includes(Items[i].item)) { ItemsTracked.push(Items[i].item); } }
      var ItemsLeft = ItemsTracked.slice(0, Math.floor(ItemsTracked.length / 2));
      var ItemsRight = ItemsTracked.slice(Math.floor(ItemsTracked.length / 2), ItemsTracked.length);
      if(item == "JOTUNN"){ item = "JÖTUNN" }
      var FilteredItems = Items.filter(e => e.item.toUpperCase() === item);
      if(FilteredItems.length == 1) {
        const embed = new Discord.RichEmbed()
        .setColor(0x0099FF)
        .setAuthor("The only person to own " + FilteredItems[0].item + " is: ")
        .setDescription(FilteredItems[0].displayName)
        .setFooter(Config.defaultFooter, Config.defaultLogoURL)
        .setTimestamp()
        message.channel.send({embed});
      }
      else if(FilteredItems.length > 1){
        var lNames = []; var rNames = [];
        var firstHalf = FilteredItems.slice(0, Math.floor(FilteredItems.length / 2)); var secondHalf = FilteredItems.slice(Math.floor(FilteredItems.length / 2), FilteredItems.length);
        for(i in firstHalf) { lNames.push(firstHalf[i].displayName); }
        for(i in secondHalf){ rNames.push(secondHalf[i].displayName); }
        const embed = new Discord.RichEmbed()
        .setColor(0x0099FF)
        .setAuthor("People who own " + firstHalf[0].item)
        .addField('Names', rNames, true)
        .addField('Names', lNames, true)
        .setFooter(Config.defaultFooter, Config.defaultLogoURL)
        .setTimestamp()
        message.channel.send({embed});
      }
      else { TrackedItems(Clans, Players, message); }
    }
  }
  else { message.reply("No clan added, to add one use: ~RegisterClan"); }
}
function TrackedItems(Clans, Players, message) {
  if(Misc.GetClanID(Clans, message.guild.id)) {
    var clan_id = Misc.GetClanID(Clans, message.guild.id);
    var Items = null; try { Items = GetArray("Items", clan_id, message).itemsObtained; } catch (err) { }
    if(Items !== null) {
      var ItemsTracked = []; for(i in Items){ if(!ItemsTracked.includes(Items[i].item)) { ItemsTracked.push(Items[i].item); } }
      var ItemsLeft = ItemsTracked.slice(0, Math.floor(ItemsTracked.length / 2));
      var ItemsRight = ItemsTracked.slice(Math.floor(ItemsTracked.length / 2), ItemsTracked.length);
      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("We either don't track that item or nobody has obtained it yet. Here is a list of items we do track! Use: `~Item ExampleName` to see who has them!")
      .addField("Items", ItemsRight, true)
      .addField("Items", ItemsLeft, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
  }
  else { message.reply("No clan added, to add one use: ~RegisterClan"); }
}

//Titles
function TitlesObtained(Clans, Players, message, title) {
  if(Misc.GetClanID(Clans, message.guild.id)) {
    var clan_id = Misc.GetClanID(Clans, message.guild.id);
    var Titles = null; try { Titles = GetArray("Titles", clan_id, message).titlesObtained; } catch (err) { }
    if(Titles !== null) {
      var TitlesTracked = []; for(i in Titles){ if(!TitlesTracked.includes(Titles[i].title)) { TitlesTracked.push(Titles[i].title); } }
      var TitlesLeft = TitlesTracked.slice(0, Math.floor(TitlesTracked.length / 2));
      var TitlesRight = TitlesTracked.slice(Math.floor(TitlesTracked.length / 2), TitlesTracked.length);
      var FilteredTitles = Titles.filter(e => e.title.toUpperCase() === title);
      if(FilteredTitles.length == 1) {
        const embed = new Discord.RichEmbed()
        .setColor(0x0099FF)
        .setAuthor("The only person to own " + FilteredTitles[0].title + " is: ")
        .setDescription(FilteredTitles[0].displayName)
        .setFooter(Config.defaultFooter, Config.defaultLogoURL)
        .setTimestamp()
        message.channel.send({embed});
      }
      else if(FilteredTitles.length > 1){
        var lNames = []; var rNames = [];
        var firstHalf = FilteredTitles.slice(0, Math.floor(FilteredTitles.length / 2)); var secondHalf = FilteredTitles.slice(Math.floor(FilteredTitles.length / 2), FilteredTitles.length);
        for(i in firstHalf) { lNames.push(firstHalf[i].displayName); }
        for(i in secondHalf){ rNames.push(secondHalf[i].displayName); }
        const embed = new Discord.RichEmbed()
        .setColor(0x0099FF)
        .setAuthor("People who own " + firstHalf[0].title)
        .addField('Names', rNames, true)
        .addField('Names', lNames, true)
        .setFooter(Config.defaultFooter, Config.defaultLogoURL)
        .setTimestamp()
        message.channel.send({embed});
      }
      else { TrackedTitles(Clans, Players, message); }
    }
  }
  else { message.reply("No clan added, to add one use: ~RegisterClan"); }
}
function TrackedTitles(Clans, Players, message) {
  if(Misc.GetClanID(Clans, message.guild.id)) {
    var clan_id = Misc.GetClanID(Clans, message.guild.id);
    var Titles = null; try { Titles = GetArray("Titles", clan_id, message).titlesObtained; } catch (err) { }
    if(Titles !== null) {
      var TitlesTracked = []; for(i in Titles){ if(!TitlesTracked.includes(Titles[i].title)) { TitlesTracked.push(Titles[i].title); } }
      var TitlesLeft = TitlesTracked.slice(0, Math.floor(TitlesTracked.length / 2));
      var TitlesRight = TitlesTracked.slice(Math.floor(TitlesTracked.length / 2), TitlesTracked.length);
      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("We either don't track that title or nobody has obtained it yet. Here is a list of titles we do track! Use: `~Title ExampleName` to see who has them!")
      .addField("Titles", TitlesRight, true)
      .addField("Titles", TitlesLeft, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
  }
  else { message.reply("No clan added, to add one use: ~RegisterClan"); }
}

//Seasonal
function SeasonRankings(Clans, Players, message) {
  if(Misc.GetClanID(Clans, message.guild.id)) {
    var clan_id = Misc.GetClanID(Clans, message.guild.id);
    var membership_Id = Misc.GetMembershipID(Players, message.author.id);
    var seasonRankings = null; try { seasonRankings = GetArray("Seasonal", clan_id, message).seasonRankings; } catch (err) { }
    if(seasonRankings !== null) {
      seasonRankings.sort(function(a, b) { return b.seasonRank - a.seasonRank; });
      var seasonRanks = seasonRankings.slice(0, 10); var names = []; var seasonRank = [];
      for(i in seasonRanks) { names.push(seasonRanks[i].displayName); seasonRank.push(seasonRanks[i].seasonRank); }

      try {
        if(membership_Id) {
          var rank = seasonRankings.indexOf(seasonRankings.find(e => e.membership_Id === membership_Id));
          var player = seasonRankings.find(e => e.membership_Id === membership_Id);
          names.push(""); seasonRank.push("");
          names.push(`${ rank+1 }: ${ player.displayName }`); seasonRank.push(player.seasonRank);
        }
        else {
          names.push(""); seasonRank.push("");
          names.push("~Register to see rank!");
        }
      }
      catch (err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Season Ranks")
      .addField("Name", names, true)
      .addField("Season Rank", seasonRank, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
  }
  else { message.reply("No clan added, to add one use: ~RegisterClan"); }
}
function SundialRankings(Clans, Players, message) {
  if(Misc.GetClanID(Clans, message.guild.id)) {
    var clan_id = Misc.GetClanID(Clans, message.guild.id);
    var membership_Id = Misc.GetMembershipID(Players, message.author.id);
    var sundialRankings = null; try { sundialRankings = GetArray("Seasonal", clan_id, message).sundial; } catch (err) { }
    if(sundialRankings !== null) {
      sundialRankings.sort(function(a, b) { return b.completions - a.completions; });
      var sundialRank = sundialRankings.slice(0, 10); var names = []; var completions = [];
      for(i in sundialRank) { names.push(sundialRank[i].displayName); completions.push(sundialRank[i].completions); }

      try {
        if(membership_Id) {
          var rank = sundialRankings.indexOf(sundialRankings.find(e => e.membership_Id === membership_Id));
          var player = sundialRankings.find(e => e.membership_Id === membership_Id);
          names.push(""); completions.push("");
          names.push(`${ rank+1 }: ${ player.displayName }`); completions.push(player.completions);
        }
        else {
          names.push(""); completions.push("");
          names.push("~Register to see rank!");
        }
      }
      catch (err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Sundial Completion Rankings")
      .addField("Name", names, true)
      .addField("Completions", completions, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
  }
  else { message.reply("No clan added, to add one use: ~RegisterClan"); }
}

//Others
function TriumphRankings(Clans, Players, message) {
  if(Misc.GetClanID(Clans, message.guild.id)) {
    var clan_id = Misc.GetClanID(Clans, message.guild.id);
    var membership_Id = Misc.GetMembershipID(Players, message.author.id);
    var triumphRankings = null; try { triumphRankings = GetArray("Others", clan_id, message).triumphRankings; } catch (err) { }
    if(triumphRankings !== null) {
      triumphRankings.sort(function(a, b) { return b.triumphScore - a.triumphScore; });
      var triumphRanks = triumphRankings.slice(0, 10); var names = []; var score = [];
      for(i in triumphRanks) { names.push(triumphRanks[i].displayName); score.push(Misc.AddCommas(triumphRanks[i].triumphScore)); }

      try {
        if(membership_Id) {
          var rank = triumphRankings.indexOf(triumphRankings.find(e => e.membership_Id === membership_Id));
          var player = triumphRankings.find(e => e.membership_Id === membership_Id);
          names.push(""); score.push("");
          names.push(`${ rank+1 }: ${ player.displayName }`); score.push(Misc.AddCommas(player.triumphScore));
        }
        else {
          names.push(""); score.push("");
          names.push("~Register to see rank!");
        }
      }
      catch (err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Top 10 Triumph Score Rankings")
      .addField("Name", names, true)
      .addField("Score", score, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
  }
  else { message.reply("No clan added, to add one use: ~RegisterClan"); }
}
function TotalTime(Clans, Players, message) {
  if(Misc.GetClanID(Clans, message.guild.id)) {
    var clan_id = Misc.GetClanID(Clans, message.guild.id);
    var membership_Id = Misc.GetMembershipID(Players, message.author.id);
    var totalTimeArray = null; try { totalTimeArray = GetArray("Others", clan_id, message).totalTime; } catch (err) { }
    if(totalTimeArray !== null) {
      totalTimeArray.sort(function(a, b) { return b.totalTime - a.totalTime; });
      var totalMinutesPlayed = 0;
      for(i in totalTimeArray) { totalMinutesPlayed = totalMinutesPlayed + totalTimeArray[i].totalTime; }
      var embedMessage = `This clan has a total play time of ${ Misc.AddCommas(Math.round(totalMinutesPlayed/60)) } hours!`;
      try {
        if(membership_Id) {
          var rank = totalTimeArray.indexOf(totalTimeArray.find(e => e.membership_Id === membership_Id));
          var player = totalTimeArray.find(e => e.membership_Id === membership_Id);
          embedMessage = embedMessage + `\n\nYou personally make up ${ Misc.AddCommas(Math.round(player.totalTime/60)) } of those hours!\nYou are rank ${ rank+1 } in the clan for time played.\nFollowed by: ${ totalTimeArray[rank+1].displayName } who has ${ Misc.AddCommas(Math.round(totalTimeArray[rank+1].totalTime/60)) } hours played!`;
          if(rank > 0) { embedMessage = embedMessage + `\nBut beaten by ${ totalTimeArray[rank-1].displayName } who has ${ Misc.AddCommas(Math.round(totalTimeArray[rank-1].totalTime/60) - Math.round(totalTimeArray[rank].totalTime/60)) } more hours played!` }
        }
      }
      catch (err) { }

      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("Total Clan Play Time!")
      .setDescription(embedMessage)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
  }
  else { message.reply("No clan added, to add one use: ~RegisterClan"); }
}
