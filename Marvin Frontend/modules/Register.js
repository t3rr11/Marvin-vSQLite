//Required Libraraies
const fs = require('fs');
const Bot = require("../bot.js");
const Misc = require("../js/misc.js");
const Log = require("../js/log.js");
const SConfig = require("../../Combined/configs/DiscordConfig.json");
const LConfig = require("../../Combined/configs/LocalDiscordConfig.json");
const MConfig = require("../../Combined/configs/MarvinConfig.json");
let Config = MConfig.isLocal ? LConfig : SConfig;
const fetch = require("node-fetch");
const Database = require('./Database.js');

async function Register(message, discord_id, username) {
  if(!isNaN(username)) {
    if(!username.toString().startsWith("765")) {
      await GetMbmDataFromId(username).then(async function(membershipData) {
        if(membershipData.membershipId) { FinishRegistration(message, discord_id, username, membershipData); }
        else {
          message.reply(`Could not find a user with that ID, This has been logged, just check and make sure it starts with: 46116860\*\*\*\*\*\*\*`);
          Log.SaveError(`Could not find a user with the ID: ${ username }, Error: ${ JSON.stringify(membershipData) }`);
        }
      });
    }
    else { message.reply('This is your Steam ID not your Membership ID, Please follow these steps to get your Membership ID: \n\n1. Goto https://guardianstats.com and login there. \n2. Then if required choose a platform. \n3. If not then just click your name next to the setting wheel which will reveal your Membership ID.'); }
  }
  else {
    await GetMbmId(encodeURIComponent(username)).then(async function(membershipData) {
      if(membershipData === "Too many results") {
        message.reply('There were too many results... \n\n1. Goto https://guardianstats.com and login there. \n2. Then if required choose a platform. \n3. If not then just click your name next to the setting wheel which will reveal your membershipId. \n4. Once you have copied that ID then just use the command like this `~Register 1234567890`.');
      }
      else if(membershipData === "Not found") {
        message.reply('No users with that name found... Try this: \n\n1. Goto https://guardianstats.com and login there. \n2. Then if required choose a platform. \n3. If not then just click your name next to the setting wheel which will reveal your membershipId. \n4. Once you have copied that ID then just use the command like this `~Register 1234567890`.');
      }
      else {
        try { FinishRegistration(message, discord_id, username, membershipData); }
        catch (err) {
          message.reply('Sorry an error has occured, this has been logged!');
          Log.SaveError("Error", membershipData + " - " + err);
          console.log(membershipData);
        }
      }
    });
  }
}

async function FinishRegistration(message, discord_id, username, membershipData) {
  Database.AddTrackedPlayer(discord_id, membershipData, function(isError, isAdded, isUpdated) {
    if(!isError) {
      if(isAdded) { Log.SaveLog("Account", membershipData.displayName + " has just registered!"); message.reply('Your username has been set to: ' + membershipData.displayName); }
      if(isUpdated) { Log.SaveLog("Account", membershipData.displayName + " has updated their details!"); message.reply('Your username has been updated to: ' + membershipData.displayName); }
    }
    else {
      Log.SaveError(`Failed to set username for: ${ membershipData.displayName }, Discord: ${ message.author.name } (${ message.author.id })`);
      message.reply('Failed to set your username to: ' + membershipData.displayName + ' this has been logged.');
    }
  });
}

async function GetMbmId(displayName) {
  const headers = { headers: { "X-API-Key": Config.apiKey, "Content-Type": "application/json" } };
  const request = await fetch(`https://www.bungie.net/Platform/Destiny2/SearchDestinyPlayer/-1/${ displayName }`, headers);
  const response = await request.json();
  if(request.ok && response.ErrorCode && response.ErrorCode !== 1) {
    //Error with bungie, might have sent bad headers.
    console.log(`Error: ${ JSON.stringify(response) }`);
    return JSON.stringify(response);
  }
  else if(request.ok) {
    //Everything is ok, request was returned to sender.
    if(response.Response.length > 1) { return "Too many results"; }
    else if(response.Response.length === 0) { return "Not found"; }
    else { return response.Response[0]; }
  }
  else {
    //Error in request ahhhhh!
    console.log(`Error: ${ JSON.stringify(response) }`);
    return JSON.stringify(response);
  }
}
async function GetMbmDataFromId(mbmId) {
  const headers = { headers: { "X-API-Key": Config.apiKey, "Content-Type": "application/json" } };
  const request = await fetch(`https://www.bungie.net/Platform/User/GetMembershipsById/${ mbmId }/-1/`, headers);
  const response = await request.json();
  if(request.ok && response.ErrorCode && response.ErrorCode !== 1) {
    //Error with bungie, might have sent bad headers.
    console.log(`Error: ${ JSON.stringify(response) }`);
    return JSON.stringify(response);
  }
  else if(request.ok) {
    //Everything is ok, request was returned to sender.
    for(var i in response.Response.destinyMemberships) {
      if(response.Response.destinyMemberships[i].membershipId === mbmId) { return response.Response.destinyMemberships[i]; }
    }
  }
  else {
    //Error in request ahhhhh!
    console.log(`Error: ${ JSON.stringify(response) }`);
    return JSON.stringify(response);
  }
}

module.exports = Register;
