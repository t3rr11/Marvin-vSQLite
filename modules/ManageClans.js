//Required Libraraies
const Request = require('request');
const fs = require('fs');
const Bot = require("../bot.js");
const Misc = require("../js/misc.js");
const Log = require("../js/log.js");
const Config = require('../data/config.json');
const fetch = require("node-fetch");

async function RegisterClan(Players, Clans, message, discord_id) {
  if(isRegistered(Players, discord_id)) {
    if(Clans.find(clan => clan.guild_id === message.guild.id)) { message.reply("This server already supports a clan. Please use ~RemoveClan. In order to delete the clan from this server."); }
    else {
      const Player = Players.find(player => player.discord_id === discord_id);
      const Clan = await GetClanIDFromMbmID(Player.platform, Player.membershipId);
      if(Clan !== "Error") {
        console.log("Clan Added: " + Clan.name + " (" + Clan.id + ")");
        Log.SaveLog("Clans", Misc.GetReadableDateTime() + " - " + "Clan Added: " + Clan.name + " (" + Clan.id + ")");
        Clans.push({ 'guild_id': message.guild.id, 'creator_id': Player.discord_id, 'creator_name': Player.name, 'clan_id': Clan.id, 'clan_name': Clan.name });
        fs.writeFile("./data/clans.json", JSON.stringify(Clans), (err) => { if (err) console.error(err) });
        if(!fs.existsSync(`./data/clans/${ Clan.id }`)){ fs.mkdirSync(`./data/clans/${ Clan.id }`); }
        message.reply('Your clan has been set to: ' + Clan.name);
      }
      else {
        message.reply("Failed to add clan.");
      }
    }
  }
  else {
    message.reply("Please register yourself first before trying to register your clan. Use: `~Register example`");
  }
}

async function GetClanIDFromMbmID(mbmType, mbmId) {
  const headers = { headers: { "X-API-Key": Config.apiKey, "Content-Type": "application/json" } };
  const request = await fetch(`https://www.bungie.net/Platform/GroupV2/User/${ mbmType }/${ mbmId }/0/1`, headers);
  const response = await request.json();
  if(request.ok && response.ErrorCode && response.ErrorCode !== 1) {
    //Error with bungie, might have sent bad headers.
    console.log(`Error: ${ JSON.stringify(response) }`);
    return JSON.stringify(response);
  }
  else if(request.ok) {
    //Everything is ok, request was returned to sender.
    return { 'id': response.Response.results[0].group.groupId, 'name': response.Response.results[0].group.name };
  }
  else {
    //Error in request ahhhhh!
    console.log(`Error: ${ JSON.stringify(response) }`);
    return JSON.stringify(response);
  }
}
function isRegistered(Players, discord_id) { if(Players.find(player => player.discord_id === discord_id)) { return true } else { return false } }
function RemoveClan(Clans, message, discord_id) {
  if(Clans.find(clan => clan.creator_id === discord_id)) {
    for(var i in Clans) {
      if(Clans[i].guild_id === message.guild.id) {
        console.log("Clan Deleted: " + Clans[i].clan_name + " (" + Clans[i].clan_id + ")");
        Log.SaveLog("Clans", Misc.GetReadableDateTime() + " - " + "Clan Deleted: " + Clans[i].clan_name + " (" + Clans[i].clan_id + ")");
        Clans.splice(i, 1);
        fs.writeFile("./data/clans.json", JSON.stringify(Clans), (err) => { if (err) console.error(err) });
        message.reply("Clan deleted, you are free!");
      }
    }
  }
  else {
    message.reply("Only the one who linked this server to the clan can remove the clan from the server. Message Terrii#5799 if things have changed and this is not possible.");
  }
}
function DeleteClan(Clans, guild_id) {
  for(var i in Clans) {
    if(Clans[i].guild_id === guild_id) {
      console.log("Clan Deleted: " + Clans[i].clan_name + " (" + Clans[i].clan_id + ")");
      Log.SaveLog("Clans", Misc.GetReadableDateTime() + " - " + "Clan Deleted: " + Clans[i].clan_name + " (" + Clans[i].clan_id + ")");
      Clans.splice(i, 1);
      fs.writeFile("./data/clans.json", JSON.stringify(Clans), (err) => { if (err) console.error(err) });
    }
  }
}

module.exports = { RegisterClan, RemoveClan, DeleteClan };
