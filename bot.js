//Required Libraraies
const Discord = require('discord.js');
const Request = require('request');
const fs = require('fs');
const client = new Discord.Client();

//Modules
let Config = require(__dirname + "/data/config.json");
let Players = require(__dirname + "/data/players.json");
let Misc = require(__dirname + '/js/misc.js');
let Log = require(__dirname + '/js/log.js');
let DiscordCommands = require(__dirname + '/modules/DiscordCommands.js');

//Data
var ClanID = '2603670';
var CommandsInput = 0;
var ClanScans = 0;

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
	setInterval(function(one) { UpdateActivityList() }, 10000);
});

client.on("message", async message => {
  //Translate command
  var default_command = message.content;
  var command = message.content.toUpperCase();

  //Commands
  if(message.author.bot) return;
  else if(command == "~TEST") {
    DiscordCommands.Test(message);
  }
  else { message.reply('I\'m not sure what that commands is sorry.').then(msg => { msg.delete(2000) }).catch(); }
});

client.on('error', console.error);
client.login(Config.token);
