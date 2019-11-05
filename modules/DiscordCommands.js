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
  Help, Status, Request, ValorRankings, GloryRankings, IronBannerRankings, SeasonRankings, InfamyRankings, SorrowsRankings, GardenRankings, TriumphRankings, ItemsObtained, TrackedItems, TotalTime
};

function GetArray(type, clan_id) {
  if(type == "Rankings"){ return JSON.parse(fs.readFileSync("./data/clans/" + clan_id + "/Rankings.json", "utf8")); }
  if(type == "Raids"){ return JSON.parse(fs.readFileSync("./data/clans/" + clan_id + "/Raids.json", "utf8")); }
  if(type == "Items"){ return JSON.parse(fs.readFileSync("./data/clans/" + clan_id + "/Items.json", "utf8")); }
  if(type == "Titles"){ return JSON.parse(fs.readFileSync("./data/clans/" + clan_id + "/Titles.json", "utf8")); }
  if(type == "Others"){ return JSON.parse(fs.readFileSync("./data/clans/" + clan_id + "/Others.json", "utf8")); }
}

//Important
function Help(message) {
  const embed = new Discord.RichEmbed()
  .setColor(0x0099FF)
  .setAuthor("Help")
  .setDescription("Hey there!, I am Marvin. Here is a list of my commands!")
  .addField("Rankings", "`Valor`, `Glory`, `Infamy`, `~Iron Banner`, `SeasonRanks`")
  .addField("Raids", "`LW`, `SoTP`, `CoS`, `GoS`")
  .addField("Items", "`~Items`, `~Item Example`")
  .addField("Titles", "`~Title Example`")
  .addField("Others", "`~Donate`, `Triumph Score`")
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
  .addField("Clan Scans", `${ ClanScans }`, true)
  .setFooter(Config.defaultFooter, Config.defaultLogoURL)
  .setTimestamp()
  message.channel.send({embed});
}
function Request(client, message) {
  const request = message.content.substr("~request ".length);
  const embed = new Discord.RichEmbed()
  .setColor(0x0099FF)
  .setAuthor(`New Request by ${ message.author.username }#${ message.author.discriminator }`)
  .setDescription(request)
  .setFooter(Config.defaultFooter, Config.defaultLogoURL)
  .setTimestamp()
  client.guilds.get('630967941076221954').channels.get('639582004710735883').send({embed})
}

//Rankings
function ValorRankings(Clans, Players, message) {
  if(Misc.GetClanID(Clans, message.guild.id)) {
    var clan_id = Misc.GetClanID(Clans, message.guild.id);
    var membership_Id = Misc.GetMembershipID(Players, message.author.id);
    var valorRankings = GetArray("Rankings", clan_id).valorRankings;
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
      else {
        names.push(""); valor.push(""); resets.push("");
        names.push("~Register to see rank!");
      }
    }
    catch (err) { }

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
  else { message.reply("No clan added, to add one use: ~RegisterClan"); }
}
function GloryRankings(Clans, Players, message) {
  if(Misc.GetClanID(Clans, message.guild.id)) {
    var clan_id = Misc.GetClanID(Clans, message.guild.id);
    var membership_Id = Misc.GetMembershipID(Players, message.author.id);
    var gloryRankings = GetArray("Rankings", clan_id).gloryRankings;
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
  else { message.reply("No clan added, to add one use: ~RegisterClan"); }
}
function InfamyRankings(Clans, Players, message) {
  if(Misc.GetClanID(Clans, message.guild.id)) {
    var clan_id = Misc.GetClanID(Clans, message.guild.id);
    var membership_Id = Misc.GetMembershipID(Players, message.author.id);
    var infamyRankings = GetArray("Rankings", clan_id).infamyRankings;
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
  else { message.reply("No clan added, to add one use: ~RegisterClan"); }
}
function IronBannerRankings(Clans, Players, message) {
  if(Misc.GetClanID(Clans, message.guild.id)) {
    var clan_id = Misc.GetClanID(Clans, message.guild.id);
    var membership_Id = Misc.GetMembershipID(Players, message.author.id);
    var ibRankings = GetArray("Rankings", clan_id).ibRankings;
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
  else { message.reply("No clan added, to add one use: ~RegisterClan"); }
}
function SeasonRankings(Clans, Players, message) {
  if(Misc.GetClanID(Clans, message.guild.id)) {
    var clan_id = Misc.GetClanID(Clans, message.guild.id);
    var membership_Id = Misc.GetMembershipID(Players, message.author.id);
    var seasonRankings = GetArray("Others", clan_id).seasonRankings;
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
  else { message.reply("No clan added, to add one use: ~RegisterClan"); }
}

//Raids
function SorrowsRankings(Clans, Players, message) {
  if(Misc.GetClanID(Clans, message.guild.id)) {
    var clan_id = Misc.GetClanID(Clans, message.guild.id);
    var membership_Id = Misc.GetMembershipID(Players, message.author.id);
    var sorrowsRankings = GetArray("Raids", clan_id).sorrows;
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
  else { message.reply("No clan added, to add one use: ~RegisterClan"); }
}
function GardenRankings(Clans, Players, message) {
  if(Misc.GetClanID(Clans, message.guild.id)) {
    var clan_id = Misc.GetClanID(Clans, message.guild.id);
    var membership_Id = Misc.GetMembershipID(Players, message.author.id);
    var gardenRankings = GetArray("Raids", clan_id).garden;
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
  else { message.reply("No clan added, to add one use: ~RegisterClan"); }
}

//Items
function ItemsObtained(Clans, Players, message, item) {
  if(Misc.GetClanID(Clans, message.guild.id)) {
    var clan_id = Misc.GetClanID(Clans, message.guild.id);
    var Items = GetArray("Items", clan_id).itemsObtained;
    var ItemsTracked = []; for(i in Items){ if(!ItemsTracked.includes(Items[i].item)) { ItemsTracked.push(Items[i].item); } }
    var ItemsLeft = ItemsTracked.slice(0, Math.floor(ItemsTracked.length / 2));
    var ItemsRight = ItemsTracked.slice(Math.floor(ItemsTracked.length / 2), ItemsTracked.length);
    var FilteredItems = Items.filter(e => e.item.toUpperCase() === item);
    if(FilteredItems.length == 1) {
      const embed = new Discord.RichEmbed()
      .setColor(0x0099FF)
      .setAuthor("The only person to own the " + FilteredItems[0].item + " is: ")
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
      .setAuthor("People who own the " + firstHalf[0].item)
      .addField('Names', rNames, true)
      .addField('Names', lNames, true)
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp()
      message.channel.send({embed});
    }
    else { TrackedItems(Clans, Players, message); }
  }
  else { message.reply("No clan added, to add one use: ~RegisterClan"); }
}
function TrackedItems(Clans, Players, message) {
  if(Misc.GetClanID(Clans, message.guild.id)) {
    var clan_id = Misc.GetClanID(Clans, message.guild.id);
    var Items = GetArray("Items", clan_id).itemsObtained;
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
  else { message.reply("No clan added, to add one use: ~RegisterClan"); }
}

//Others
function TriumphRankings(Clans, Players, message) {
  if(Misc.GetClanID(Clans, message.guild.id)) {
    var clan_id = Misc.GetClanID(Clans, message.guild.id);
    var membership_Id = Misc.GetMembershipID(Players, message.author.id);
    var triumphRankings = GetArray("Others", clan_id).triumphScore;
    triumphRankings.sort(function(a, b) { return b.triumphScore - a.triumphScore; });
    var triumphRanks = triumphRankings.slice(0, 10); var names = []; var score = [];
    for(i in triumphRanks) { names.push(triumphRanks[i].displayName); score.push(triumphRanks[i].triumphScore); }

    try {
      if(membership_Id) {
        var rank = triumphRankings.indexOf(triumphRankings.find(e => e.membership_Id === membership_Id));
        var player = triumphRankings.find(e => e.membership_Id === membership_Id);
        names.push(""); score.push("");
        names.push(`${ rank+1 }: ${ player.displayName }`); score.push(player.triumphScore);
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
  else { message.reply("No clan added, to add one use: ~RegisterClan"); }
}
function TotalTime(Clans, Players, message) {
  if(Misc.GetClanID(Clans, message.guild.id)) {
    var clan_id = Misc.GetClanID(Clans, message.guild.id);
    var membership_Id = Misc.GetMembershipID(Players, message.author.id);
    var totalTimeArray = GetArray("Others", clan_id).totalTime;
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
  else { message.reply("No clan added, to add one use: ~RegisterClan"); }
}
