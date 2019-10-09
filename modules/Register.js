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
      if(membershipData === "Too many results") { message.reply('There were too many results... Possibly change your username to something more unique or goto https://guardianstats.com and login there, then open the settings wheel and click "Get memebership ID". Once you have that ID then just use the command `~Register {ID}` without the {}.'); }
      else if(membershipData.membershipId) { FinishRegistration(Players, message, discord_id, username, membershipData); }
      else { message.reply('Failed to find membershipId for: ' + username); console.log(membershipData); }
    });
  }
}

function FinishRegistration(Players, message, discord_id, username, membershipData) {
  if(isRegistered(Players, discord_id)) {
    for(var i in Players) {
      if(Players[i].discord_id === discord_id) {
        Players[i] = { 'discord_id': discord_id, 'username': membershipData.displayName, 'membershipId': membershipData.membershipId, 'platform': membershipData.membershipType };
        fs.writeFile("./data/players.json", JSON.stringify(Players), (err) => { if (err) console.error(err) });
        message.reply('Your username has been updated to: ' + membershipData.displayName);
      }
    }
  }
  else {
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
