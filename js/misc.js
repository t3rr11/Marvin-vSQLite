const Discord = require('discord.js');
const Bot = require("../bot.js");
module.exports = { GetDateString, GetReadableDateTime, IsJson, AddCommas, DeleteMessages, WriteAnnoucement, WriteCustomAnnoucement, formatTime };

function AddCommas(x) { return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
function IsJson(str) { try { JSON.parse(str); } catch (e) { return false; } return true; }

function GetDateString() {
  var d = new Date();
  var day = d.getDate();
  var month = d.getMonth();
  var year = d.getFullYear();
  var hour = d.getHours();
  var minute = d.getMinutes();
  var seconds = d.getSeconds();
  if(day.toString().length == 1){ day = '0' + day }
  if(month.toString().length == 1){ month = '0' + month }
  if(hour.toString().length == 1){ hour = '0' + hour }
  if(minute.toString().length == 1){ minute = '0' + minute }
  if(seconds.toString().length == 1){ seconds = '0' + seconds }
  var dateString = year + "-" + month + "-" + day + "_" + hour + "-" + minute + "-" + seconds;
  return dateString;
}

function GetReadableDateTime() {
  var d = new Date();
  var day = d.getDate();
  var month = d.getMonth();
  var year = d.getFullYear();
  var hour = d.getHours();
  var minute = d.getMinutes();
  var seconds = d.getSeconds();
  if(day.toString().length == 1){ day = '0' + day }
  if(month.toString().length == 1){ month = '0' + month }
  if(hour.toString().length == 1){ hour = '0' + hour }
  if(minute.toString().length == 1){ minute = '0' + minute }
  if(seconds.toString().length == 1){ seconds = '0' + seconds }
  var dateString = day + "-" + month + "-" + year + " " + hour + ":" + minute + ":" + seconds;
  return dateString;
}

function formatTime(TimeinSeconds) {
  var seconds  = Math.floor(Number(TimeinSeconds));
  var years    = Math.floor(seconds / (24*60*60*7*4.34*12));
  var seconds  = seconds - Math.floor(years   * (24*60*60*7*4.34*12));
  var months   = Math.floor(seconds / (24*60*60*7*4.34));
  var seconds  = seconds - Math.floor(months  * (24*60*60*7*4.34));
  var weeks    = Math.floor(seconds / (24*60*60*7));
  var seconds  = seconds - Math.floor(weeks   * (24*60*60*7));
  var days     = Math.floor(seconds / (24*60*60));
  var seconds  = seconds - Math.floor(days    * (24*60*60));
  var hours    = Math.floor(seconds / (60*60));
  var seconds  = seconds - Math.floor(hours   * (60*60));
  var minutes  = Math.floor(seconds / (60));
  var seconds  = seconds - Math.floor(minutes * (60));

  var YDisplay = years > 0 ? years + (years == 1 ? ' year ' : ' years ') : '';
  var MDisplay = months > 0 ? months + (months == 1 ? ' month ' : ' months ') : '';
  var wDisplay = weeks > 0 ? weeks + (weeks == 1 ? ' week ' : ' weeks ') : '';
  var dDisplay = days > 0 ? days + (days == 1 ? ' day ' : ' days ') : '';
  var hDisplay = hours > 0 ? hours + (hours == 1 ? ' hour ' : ' hours ') : '';
  var mDisplay = minutes > 0 ? minutes + (minutes == 1 ? ' minute ' : ' minutes ') : '';
  var sDisplay = seconds > 0 ? seconds + (seconds == 1 ? ' second ' : ' seconds ') : '';

  if (TimeinSeconds < 60) { return sDisplay; }
  if (TimeinSeconds >= 60 && TimeinSeconds < 3600) { return mDisplay + sDisplay; }
  if (TimeinSeconds >= 3600 && TimeinSeconds < 86400) { return hDisplay + mDisplay; }
  if (TimeinSeconds >= 86400 && TimeinSeconds < 604800) { return dDisplay + hDisplay; }
  if (TimeinSeconds >= 604800 && TimeinSeconds < 2624832) { return wDisplay + dDisplay; }
  if (TimeinSeconds >= 2624832 && TimeinSeconds !== Infinity) { return MDisplay + wDisplay + dDisplay; }
  return YDisplay + MDisplay + wDisplay + dDisplay + hDisplay + mDisplay + sDisplay;
}

function DeleteMessages(message, amount) {
  if(message.author == "<@194972321168097280>" || message.author == "<@226123337410019328>"){
    message.channel.fetchMessages({limit: amount}).then(collected => { collected.forEach(msg => {
      if(msg.id == "527052089575342080" || msg.id == "574073272141086721" || msg.id == "500157460577779713" || msg.id == "582368247949819915" || msg.id == "585234859186716730") { console.log('Cannot Delete This Message! ' + msg.id); }
      else { msg.delete(); }
    }); });
  }
  else { message.channel.send('You don\'t have access to this command'); }
}
// Fix this!!
// function DeleteMessages(message, amount) {
//   if(message.author == "<@194972321168097280>" || message.author == "<@226123337410019328>"){
//     message.channel.fetchMessages({limit: amount}).then(collected => { collected.forEach(msg => {
//       lockedMsgs = ['527052089575342080', '574073272141086721', '500157460577779713', '582368247949819915', '585231117280346112'];
//       for(i in lockedMsgs){
//         if(msg.id == lockedMsgs[i]){ console.log('Cannot Delete This Message! ' + msg.id); }
//         else { msg.delete(); }
//       }
//     }); });
//   }
//   else { message.channel.send('You don\'t have access to this command'); }
// }
function WriteAnnoucement(type, data) {
  if(type == 'Item'){
    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .addField("Clan Broadcast", data.member_name + " has obtained the " + data.item)
    .setFooter("Guardianstats", "http://guardianstats.com/images/icons/logo.png")
    .setTimestamp()
    Bot.client.channels.get('498828495619883018').send({embed});
  }
  if(type == 'Titles'){
    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .addField("Clan Broadcast", data.member_name + " has achieved the " + data.title + " title!")
    .setFooter("Guardianstats", "http://guardianstats.com/images/icons/logo.png")
    .setTimestamp()
    Bot.client.channels.get('498828495619883018').send({embed});
  }
}
function WriteCustomAnnoucement(data) {
  const embed = new Discord.RichEmbed()
  .setColor(0x0099FF)
  .addField("Clan Broadcast", data)
  .setFooter("Guardianstats", "http://guardianstats.com/images/icons/logo.png")
  .setTimestamp()
  Bot.client.channels.get('498828495619883018').send({embed});
}
function GetMembershipId() {
  if(Bot.Players.some(player => player.discord_id === message.member.user.id)) {
    for(j in Bot.Players){
      if(Bot.Players[j].discord_id === message.member.user.id){
        
      }
    }
  }
  else {
    message.reply('Please register first using the `~Register` command. Example: `~Register Terrii#1506`');
  }
}
