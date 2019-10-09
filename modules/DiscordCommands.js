//Required Libraraies
const Discord = require('discord.js');
const fs = require('fs');
const Bot = require("../bot.js");
const Misc = require("../js/misc.js");
const Log = require("../js/log.js");
const Config = require('../data/config.json');

//Exports
module.exports = {
  Test, ServerID
};

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

//Test
function ServerID(message) {
  console.log(message.guild.id);
}

async function AddClan(message) {

  const clanData = fetch();

  const embed = new Discord.RichEmbed()
  .setColor(0x0099FF)
  .setAuthor("Welcome!")
  .setDescription(clanName)
  .setFooter(Config.defaultFooter, Config.defaultLogoURL)
  .setTimestamp()
  message.channel.send({embed});
}
