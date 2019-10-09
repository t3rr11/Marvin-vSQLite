//Required Libraraies
const Discord = require('discord.js');
const Request = require('request');
const fs = require('fs');
const client = new Discord.Client();

//Modules
var Players = JSON.parse(fs.readFileSync(__dirname + "/data/players.json", "utf8"));
var Clans = JSON.parse(fs.readFileSync(__dirname + "/data/clans.json", "utf8"));
let Config = require(__dirname + "/data/config.json");
let Misc = require(__dirname + '/js/misc.js');
let Log = require(__dirname + '/js/log.js');
let DiscordCommands = require(__dirname + '/modules/DiscordCommands.js');
let ClanData = require(__dirname + '/modules/ClanData.js');
let Register = require(__dirname + '/modules/Register.js');
let ManageClans = require(__dirname + '/modules/ManageClans.js');

//Data
var ClanID = '2603670';
var CommandsInput = 0;
var ClanScans = 0;

//Exports
module.exports = { Players, Clans, client, ClanID, CommandsInput, ClanScans };

//Functions
function UpdateActivityList() {
  var ActivityList = [];
  ActivityList.push(`Serving ${client.users.size} users`);
  ActivityList.push('Tracking ' + Players.length + ' players!');
  ActivityList.push('Use ~HELP for Support');
  ActivityList.push('Want to support? ~Donate');
  var activity = ActivityList[Math.floor(Math.random() * ActivityList.length)];
  client.user.setActivity(activity);
}

//Discord Client Code
client.on("ready", () => {
  //Start Up Console Log
  console.log(Misc.GetReadableDateTime() + ' - ' + `Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
  console.log(Misc.GetReadableDateTime() + ' - ' + 'Tracking ' + Players.length + ' players!');

	//SetTimeouts
	setInterval(function() { UpdateActivityList() }, 10000);
  //setInterval(function() { ClanData.GetClanData(Config.apiKey); ClanScans++; }, 180000);
});

client.on("message", async message => {
  //Translate command
  var default_command = message.content;
  var command = message.content.toUpperCase();

  //Commands
  if(message.author.bot) return;
  if(command.startsWith('~') && !command.startsWith('~~')) {
    if(command.startsWith("~REGISTER ")) { Register(Players, message, message.author.id, command.substr("~REGISTER ".length)); }
    else if(command === "~REGISTERCLAN" || command === "~REGISTER CLAN") { ManageClans.RegisterClan(Players, Clans, message, message.author.id); }
    else if(command === "~REMOVECLAN" || command === "~REMOVE CLAN") { ManageClans.RemoveClan(Clans, message, message.author.id); }
    else if(command === "~TEST") {
      DiscordCommands.ServerID(message);
    }
    else { message.reply('I\'m not sure what that commands is sorry.').then(msg => { msg.delete(2000) }).catch(); }
  }
});

client.on('error', console.error);
client.login(Config.token);
