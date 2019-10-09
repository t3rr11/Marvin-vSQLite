//Required Libraraies
const Discord = require('discord.js');
const fs = require('fs');
const Bot = require("../bot.js");
const Misc = require("../js/misc.js");
const Log = require("../js/log.js");
const Config = require("../data/config.json");
const fetch = require("node-fetch");

//Exports
module.exports = { GetClanMembers, CheckClanMembers };

//Functions
async function GetClanMembers(clan_id) {
  const headers = { headers: { "X-API-Key": Config.apiKey, "Content-Type": "application/json" } };
  const request = await fetch(`https://www.bungie.net/Platform/GroupV2/${ clan_id }/Members/?currentPage=1`, headers);
  const response = await request.json();
  if(request.ok && response.ErrorCode && response.ErrorCode !== 1) {
    //Error with bungie, might have sent bad headers.
    console.log(`Error: ${ JSON.stringify(response) }`);
    return JSON.stringify(response);
  }
  else if(request.ok) {
    //Everything is ok, request was returned to sender.
    return response.Response.results;
  }
  else {
    //Error in request ahhhhh!
    console.log(`Error: ${ JSON.stringify(response) }`);
    return JSON.stringify(response);
  }
}
async function CheckClanMembers(clan_id) {
  var PreviousClanMembers = []; if(!fs.existsSync(`./data/clans/${ clan_id }/ClanMembers.json`)) { PreviousClanMembers = fs.readFileSync(`./data/clans/${ clan_id }/ClanMembers.json`, "utf8"); }
  var CurrentClanMembers = await GetClanMembers(clan_id);
  var ClanMembers = [];

  if(PreviousClanMembers.length == 0) {
    for(i in CurrentClanMembers) {
      PreviousClanMembers.push({ "displayName": CurrentClanMembers[i].destinyUserInfo.displayName, "membershipId": CurrentClanMembers[i].destinyUserInfo.membershipId });
      ClanMembers.push({ "displayName": CurrentClanMembers[i].destinyUserInfo.displayName, "membershipId": CurrentClanMembers[i].destinyUserInfo.membershipId });
    }
  }
  else {
    for(i in CurrentClanMembers){
      ClanMembers.push({ "displayName": CurrentClanMembers[i].destinyUserInfo.displayName, "membershipId": CurrentClanMembers[i].destinyUserInfo.membershipId });
    }
  }

  var MembersJoined = ClanMembers.filter(function(player) { return !PreviousClanMembers.find(member => member.membershipId === player.membershipId); });
  var MembersLeft = PreviousClanMembers.filter(function(player) { return !ClanMembers.find(member => member.membershipId === player.membershipId); });

  if(MembersLeft.length > 0){ for(i in MembersLeft){ SendJoinLeaveMessage(MembersLeft[i], 'Left'); } } else { }
  if(MembersJoined.length > 0){ for(i in MembersJoined){ SendJoinLeaveMessage(MembersJoined[i], 'Joined'); } } else { }

  fs.writeFile(`./data/clans/${ clan_id }/ClanMembers.json`, JSON.stringify(ClanMembers), (err) => { if (err) console.error(err) });
}

function SendJoinLeaveMessage(player, input) {
  if(input == 'Joined') {
    const embed = new Discord.RichEmbed().setColor(0x006400).setAuthor(player.displayName + " has joined the clan!");
    Bot.client.channels.get('631357107651870733').send({embed});
    Log.SaveLog('Annoucement', player.displayName + ' has joined the clan!');
  }
  if(input == 'Left') {
    const embed = new Discord.RichEmbed().setColor(0xFF4100).setAuthor(player.displayName + " has left the clan!");
    Bot.client.channels.get('631357107651870733').send({embed});
    Log.SaveLog('Annoucement', player.displayName + ' has left the clan!');
  }
}
