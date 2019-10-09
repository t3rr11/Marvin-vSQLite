//Required Libraraies
const Discord = require('discord.js');
const fs = require('fs');
const Bot = require("../bot.js");
const Misc = require("../js/misc.js");
const Log = require("../js/log.js");

//Exports
module.exports = { GetClanData, CheckClanMembers };

//Variables
var PreviousClanMembers = [];
var ClanMembers = [];
var ClanMemberIDs = [];
var dir = './data/clans/' + Bot.ClanID;

//Functions
function GetClanData(apiKey) {
  Log.SaveLog('Notice', 'Grabbing Clan Data');
  const https = require('https');
  const options = { hostname: 'www.bungie.net', path: '/Platform/GroupV2/' + Bot.ClanID + '/Members/?currentPage=1', method: 'GET', headers: { "X-API-Key": apiKey } };
  https.get(options, (resp) => {
    let data = '';
    resp.on('data', (chunk) => { data += chunk; });
    resp.on('end', () => {
      if(Misc.IsJson(data)) {
        var parsedData = JSON.parse(data);
        if(parsedData.ErrorCode == 1) {
          if(parsedData.Response.results.length > 0) {
            if(PreviousClanMembers.length == 0){
              for(i in parsedData.Response.results){
                PreviousClanMembers.push(parsedData.Response.results[i].destinyUserInfo.displayName);
                ClanMembers.push(parsedData.Response.results[i].destinyUserInfo.displayName);
                ClanMemberIDs.push(parsedData.Response.results[i].destinyUserInfo.membershipId);
              }
            }
            else {
              PreviousClanMembers = ClanMembers;
              ClanMembers = [];
              ClanMemberIDs = [];
              for(i in parsedData.Response.results){
                ClanMembers.push(parsedData.Response.results[i].destinyUserInfo.displayName);
                ClanMemberIDs.push(parsedData.Response.results[i].destinyUserInfo.membershipId);
              }
            }
            CheckClanMembers(apiKey);
          }
        }
        else {
          try { console.log("Error: " + JSON.stringify(parsedData.Message)); Log.SaveLog('Error', JSON.stringify(parsedData.Message)); }
          catch (err) { console.log("Error: " + err.message); Log.SaveLog('Error', err.message); }
        }
      }
    });
  }).on("error", (err) => { console.log("Error: " + err.message); Log.SaveLog('Error', err.message); });
}
function CheckClanMembers(apiKey) {
  var ClanMembersLeft = PreviousClanMembers;
  var ClanMembersJoined = ClanMembers;
  var TempArray = [];
  TempArray = ClanMembersJoined.filter(function(item) { return !ClanMembersLeft.includes(item); });
  ClanMembersLeft = ClanMembersLeft.filter(function(item) { return !ClanMembersJoined.includes(item); });
  ClanMembersJoined = TempArray;

  if(ClanMembersLeft.length > 0){ for(i in ClanMembersLeft){ SendJoinLeaveMessage(ClanMembersLeft[i], 'Left'); } } else { }
  if(ClanMembersJoined.length > 0){ for(i in ClanMembersJoined){ SendJoinLeaveMessage(ClanMembersJoined[i], 'Joined'); } } else { }
  try { GrabClanRankings(ClanMemberIDs, Bot.ClanID); } catch (err) { console.log(err); Log.SaveLog('Error', err); }
}
function SendJoinLeaveMessage(player, input) {
  if(input == 'Joined'){
    const embed = new Discord.RichEmbed().setColor(0x006400).setAuthor(player + " has joined the clan!");
    Bot.client.channels.get('529183360707330048').send({embed});
    Log.SaveLog('Annoucement', player + ' has joined the clan!');
  }
  if(input == 'Left'){
    const embed = new Discord.RichEmbed().setColor(0xFF4100).setAuthor(player + " has left the clan!");
    Bot.client.channels.get('529183360707330048').send({embed});
    Log.SaveLog('Annoucement', player + ' has left the clan!');
  }
}
