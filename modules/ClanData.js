//Required Libraraies
const Discord = require('discord.js');
const fs = require('fs');
const Bot = require("../bot.js");
const Misc = require("../js/misc.js");
const Log = require("../js/log.js");
const Config = require("../data/config.json");
const fetch = require("node-fetch");
let UpdateClanData = require("./UpdateClanData.js");

//Exports
module.exports = { GetClanMembers, CheckClanMembers };

//Functions
async function GetClanMembers(clan_id) {
  const headers = { headers: { "X-API-Key": Config.apiKey, "Content-Type": "application/json" } };
  const request = await fetch(`https://www.bungie.net/Platform/GroupV2/${ clan_id }/Members/?currentPage=1`, headers);
  const response = await request.json();
  if(request.ok && response.ErrorCode && response.ErrorCode !== 1) {
    //Error with bungie, might have sent bad headers.
    try { console.log(response.ErrorStatus); } catch (err) { console.log(`Bad Error: ${ JSON.stringify(response) }`); }
    return "Error";
  }
  else if(request.ok) {
    //Everything is ok, request was returned to sender.
    return response.Response.results;
  }
  else {
    //Error in request ahhhhh!
    try { console.log(response.ErrorStatus); } catch (err) { console.log(`Bad Error: ${ JSON.stringify(response) }`); }
    return "Error";
  }
}
async function CheckClanMembers(clan_id, client) {
  var CurrentClanMembers = await GetClanMembers(clan_id);
  var ClanMembers = [];

  if(CurrentClanMembers !== "Error") {
    try {
      for(i in CurrentClanMembers) {
        ClanMembers.push({
          "displayName": CurrentClanMembers[i].destinyUserInfo.displayName,
          "membership_Id": CurrentClanMembers[i].destinyUserInfo.membershipId,
          "membershipType": CurrentClanMembers[i].destinyUserInfo.membershipType,
          "joinDate": CurrentClanMembers[i].joinDate
        });
      }
      fs.writeFile(`./data/clans/${ clan_id }/ClanMembers.json`, JSON.stringify(ClanMembers), (err) => { if (err) console.error(err) });
      UpdateClanData(clan_id, ClanMembers, client);
    }
    catch (err) { Log.SaveLog("Error", Misc.GetReadableDateTime() + " - " + "Error Saving Clan Members: " + err); }
  }
}
