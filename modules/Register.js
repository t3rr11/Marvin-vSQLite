//Required Libraraies
const Request = require('request');
const fs = require('fs');
const Bot = require("../bot.js");
const Misc = require("../js/misc.js");
const Log = require("../js/log.js");
const Config = require('../data/config.json');
const fetch = require("node-fetch");

async function Register(Players, message, discord_id, username) {
  if(!isNaN(username)) {
    await GetMbmDataFromId(username).then(async function(membershipData) {
      if(membershipData.membershipId) { FinishRegistration(Players, message, discord_id, username, membershipData); }
      else { message.reply('Failed to find membershipId for: ' + membershipData); console.log(membershipData); }
    });
  }
  else {
    await GetMbmId(encodeURIComponent(username)).then(async function(membershipData) {
      if(membershipData === "Too many results") {
        message.reply('There were too many results... \n\n1. Goto https://guardianstats.com and login there. \n2. Then open the settings wheel and click "Get memebership ID". \n3. Once you have that ID then just use the command like this `~Register 1234567890`.');
      }
      else if(membershipData === "Not found") {
        message.reply('No users with that name found... Try this: \n\n1. Goto https://guardianstats.com and login there. \n2. Then open the settings wheel and click "Get memebership ID". \n3. Once you have that ID then just use the command like this `~Register 1234567890`.');
      }
      else {
        try { FinishRegistration(Players, message, discord_id, username, membershipData); }
        catch (err) {
          message.reply('Sorry an error has occured, this has been logged could you message Terrii#5799 and let him know?');
          Log.SaveLog("Error", Misc.GetReadableDateTime() + " - " + membershipData + " - " + err);
          console.log(membershipData);
        }
      }
    });
  }
}

function FinishRegistration(Players, message, discord_id, username, membershipData) {
  if(isRegistered(Players, discord_id)) {
    for(var i in Players) {
      if(Players[i].discord_id === discord_id) {
        Log.SaveLog("Account", Misc.GetReadableDateTime() + " - " + Players[i].username + " has changed their name to " + membershipData.displayName);
        Players[i] = { 'discord_id': discord_id, 'username': membershipData.displayName, 'membershipId': membershipData.membershipId, 'platform': membershipData.membershipType };
        fs.writeFile("./data/players.json", JSON.stringify(Players), (err) => { if (err) console.error(err) });
        message.reply('Your username has been updated to: ' + membershipData.displayName);
      }
    }
  }
  else {
    Log.SaveLog("Account", Misc.GetReadableDateTime() + " - " + membershipData.displayName + " has just registered!");
    Players.push({ 'discord_id': discord_id, 'username': membershipData.displayName, 'membershipId': membershipData.membershipId, 'platform': membershipData.membershipType });
    fs.writeFile("./data/players.json", JSON.stringify(Players), (err) => { if (err) console.error(err) });
    message.reply('Your username has been set to: ' + membershipData.displayName);
  }
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
function isRegistered(Players, discord_id) { if(Players.find(player => player.discord_id === discord_id)) { return true } else { return false } }

module.exports = Register;
