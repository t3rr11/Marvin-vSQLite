//Required Libraraies
const Discord = require('discord.js');
const Request = require('request');
const fs = require('fs');
const Bot = require("../bot.js");
const Misc = require("../js/misc.js");
const Log = require("../js/log.js");
const Config = require('../data/config.json');
const fetch = require("node-fetch");

function isRegistered(Players, discord_id) { if(Players.find(player => player.discord_id === discord_id)) { return true } else { return false } }
async function SetupAnnoucements(Players, Clans, message) {
  if(isRegistered(Players, message.author.id)) {
    if(Clans.find(clan => clan.guild_id === message.guild.id)) {
      try {
        const channelId = message.mentions.channels.first().id;
        for(var i in Clans) {
          if(Clans[i].guild_id === message.guild.id) {
            if(Clans[i].creator_id === message.author.id) {
              Clans[i].annoucement_channel = channelId;
              fs.writeFile("./data/clans.json", JSON.stringify(Clans), (err) => { if (err) console.error(err) });
              Log.SaveLog("Clans", Misc.GetReadableDateTime() + ' - ' + Clans[i].clan_name + " has added an annoucements channel: " + channelId);
              message.channel.send(`Successfully set <#${ channelId }> as the annoucements channel!`);
            }
            else { message.reply("Only the one who linked this server to the clan edit the clan. Message Terrii#5799 if things have changed and this is not possible."); }
          }
        }
      }
      catch (err) {
        if(err.name === "TypeError") { message.reply("Please set the annoucements channel by tagging it in the message. E.g: `~Annoucements #general`"); }
        else { console.log(err); Log.SaveLog("Error", Misc.GetReadableDateTime() + ' - ' + 'User: ' + message.member.user.tag + ', Command: ' + command + ', Error: ' + err); }
      }
    }
    else { message.reply("Please register a clan to track first. Use: `~RegisterClan`"); }
  }
  else { message.reply("Please register first. Use: `~Register example`"); }
}
async function RemoveAnnoucements(Clans, message) {
  if(Clans.find(clan => clan.creator_id === message.author.id)) {
    for(var i in Clans) {
      if(Clans[i].guild_id === message.guild.id) {
        console.log("Annoucements Removed: " + Clans[i].clan_name + " (" + Clans[i].clan_id + ")");
        Log.SaveLog("Clans", Misc.GetReadableDateTime() + " - " + "Annoucements Removed: " + Clans[i].clan_name + " (" + Clans[i].clan_id + ")");
        Clans[i].annoucement_channel = null;
        fs.writeFile("./data/clans.json", JSON.stringify(Clans), (err) => { if (err) console.error(err) });
        message.channel.send("Your clan will no longer get clan annoucements!");
      }
    }
  }
  else { message.reply("Only the one who linked this server to the clan edit clan. Message Terrii#5799 if things have changed and this is not possible."); }
}
async function CheckForAnnoucements(clan_id, ClanData, client) {
  //Try to check
  try {
    //Import old data
    const OldRankings = JSON.parse(fs.readFileSync("./data/clans/" + clan_id + "/Rankings.json", "utf8"));
    const OldRaids = JSON.parse(fs.readFileSync("./data/clans/" + clan_id + "/Raids.json", "utf8"));
    const OldItems = JSON.parse(fs.readFileSync("./data/clans/" + clan_id + "/Items.json", "utf8"));
    const OldTitles = JSON.parse(fs.readFileSync("./data/clans/" + clan_id + "/Titles.json", "utf8"));
    const OldOthers = JSON.parse(fs.readFileSync("./data/clans/" + clan_id + "/Others.json", "utf8"));

    //Sort the new data to make it easier to work with
    const NewRankings = ClanData.Rankings;
    const NewRaids = ClanData.Raids;
    const NewItems = ClanData.Items;
    const NewTitles = ClanData.Titles;
    const NewOthers = ClanData.Others;

    //Compare Arrays
    CompareItems(OldItems.itemsObtained, NewItems.itemsObtained, NewRaids, clan_id, client);
  }
  catch (err) {
    console.log(Misc.GetReadableDateTime() + " - " + "Error Comparing Clan Data: " + err);
    //Log.SaveLog("Error", Misc.GetReadableDateTime() + " - " + "Error Comparing Clan Data: " + err);
  }

  //Save new data overwriting the old data
  fs.writeFile("./data/clans/" + clan_id + "/Rankings.json", JSON.stringify(ClanData.Rankings), (err) => { if (err) console.error(err) });
  fs.writeFile("./data/clans/" + clan_id + "/Raids.json", JSON.stringify(ClanData.Raids), (err) => { if (err) console.error(err) });
  fs.writeFile("./data/clans/" + clan_id + "/Items.json", JSON.stringify(ClanData.Items), (err) => { if (err) console.error(err) });
  fs.writeFile("./data/clans/" + clan_id + "/Titles.json", JSON.stringify(ClanData.Titles), (err) => { if (err) console.error(err) });
  fs.writeFile("./data/clans/" + clan_id + "/Others.json", JSON.stringify(ClanData.Others), (err) => { if (err) console.error(err) });
}
function CompareItems(OldItems, NewItems, NewRaids, clan_id, client) {
  if(NewItems.length !== OldItems.length) {
    var NewItemsArray = NewItems.filter(({ displayName:a, item:x }) => !OldItems.some(({ displayName:b, item:y }) => a === b && x === y));
    if(NewItemsArray.length < 4) {
      for(i in NewItemsArray) {
        //Default Message
        var message = `${ NewItemsArray[i].displayName } has obtained the ${ NewItemsArray[i].item }`;

        //If raid say these:
        if(NewItemsArray[i].item === "1000 Voices") { const raidData = NewRaids.lastWish.find(user => user.membership_Id == NewItemsArray[i].membership_Id); message = message + " in " + raidData.completions + " raids!"; }
        else if(NewItemsArray[i].item === "Anarchy") { const raidData = NewRaids.scourge.find(user => user.membership_Id == NewItemsArray[i].membership_Id); message = message + " in " + raidData.completions + " raids!"; }
        else if(NewItemsArray[i].item === "Tarrabah") { const raidData = NewRaids.sorrows.find(user => user.membership_Id == NewItemsArray[i].membership_Id); message = message + " in " + raidData.completions + " raids!"; }

        //Write Annoucement
        WriteAnnoucement(message, clan_id, client);
      }
    }
    else { Log.SaveLog("Warning", "Max Limit Reached - Items"); }
  }
}
function WriteAnnoucement(message, clan_id, client) {
  const Clans = JSON.parse(fs.readFileSync("./data/clans.json", "utf8"));
  const ClanData = Clans.find(clan => clan.clan_id == clan_id);
  const Annoucement_Channel = ClanData.annoucement_channel;

  if(ClanData.annoucement_channel !== null) {
    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor("Annoucement")
    .setDescription(message)
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp()
    client.guilds.get(ClanData.guild_id).channels.get(ClanData.annoucement_channel).send({embed});
    Log.SaveLog("Server", 'Annoucement: ' + message);
  }
}

module.exports = { SetupAnnoucements, RemoveAnnoucements, CheckForAnnoucements, WriteAnnoucement };
