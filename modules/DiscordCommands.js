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
  Help, Test, ValorRankings, GloryRankings, SeasonRankings
};

function GetArray(type, clan_id) {
  if(type == "Rankings"){ return JSON.parse(fs.readFileSync("./data/clans/" + clan_id + "/Rankings.json", "utf8")); }
  if(type == "Raids"){ return JSON.parse(fs.readFileSync("./data/clans/" + clan_id + "/Raids.json", "utf8")); }
  if(type == "Items"){ return JSON.parse(fs.readFileSync("./data/clans/" + clan_id + "/Items.json", "utf8")); }
  if(type == "Titles"){ return JSON.parse(fs.readFileSync("./data/clans/" + clan_id + "/Titles.json", "utf8")); }
  if(type == "Others"){ return JSON.parse(fs.readFileSync("./data/clans/" + clan_id + "/Others.json", "utf8")); }
}

function Help(message) {
  const embed = new Discord.RichEmbed()
  .setColor(0x0099FF)
  .setAuthor("Help")
  .setDescription("Hey there!, I am Marvin. Here is a list of my commands!")
  .addField("Rankings", "`Valor`, `Glory`, `Infamy`, `SeasonRanks`")
  .addField("Raids", "`LW`, `SoTP`, `CoS`, `GoS`")
  .addField("Items", "`~Item Example`")
  .addField("Titles", "`~Title Example`")
  .addField("Others", "`Triumph Score`, `Menagerie`, `Butter`, `Total Time`")
  .setFooter(Config.defaultFooter, Config.defaultLogoURL)
  .setTimestamp()
  message.channel.send({embed});
}

//Test
function Test(message) {
  const embed = new Discord.RichEmbed()
  .setColor(0x0099FF)
  .setAuthor("Test")
  .setDescription("Working!")
  .setFooter(Config.defaultFooter, Config.defaultLogoURL)
  .setTimestamp()
  message.channel.send({embed});
}

//Rankings
function ValorRankings(message) {
  if(Misc.GetClanID(message.guild.id)) {
    var clan_id = Misc.GetClanID(message.guild.id);
    var membership_Id = Misc.GetMembershipID(message.author.id);
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
function GloryRankings(message) {
  if(Misc.GetClanID(message.guild.id)) {
    var clan_id = Misc.GetClanID(message.guild.id);
    var membership_Id = Misc.GetMembershipID(message.author.id);
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
function SeasonRankings(message) {
  if(Misc.GetClanID(message.guild.id)) {
    var clan_id = Misc.GetClanID(message.guild.id);
    var membership_Id = Misc.GetMembershipID(message.author.id);
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
