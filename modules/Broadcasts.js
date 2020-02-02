//Required Libraraies
const Discord = require('discord.js');
const fs = require('fs');
const Bot = require("../bot.js");
const Misc = require("../js/misc.js");
const Log = require("../js/log.js");
const Config = require('../data/config.json');
const fetch = require("node-fetch");
const Database = require('./Database.js');

module.exports = { SetupBroadcasts, RemoveBroadcasts, AddToBlacklist, AddToWhitelist };

async function SetupBroadcasts(message) {
  Database.CheckRegistered(message.author.id, function(isError, isFound, data) {
    if(!isError) {
      if(isFound) {
        Database.GetClanDetails(message.guild.id, false, function(isError, isFound, data) {
          if(!isError) {
            if(isFound) {
              if(data.creator_id === message.author.id || message.member.hasPermission("ADMINISTRATOR")) {
                var channel_Id = null; try { channel_Id = message.mentions.channels.first().id } catch (err) {  }
                if(channel_Id !== null) {
                  Database.AddClanBroadcastsChannel(channel_Id, message.guild.id, function(isError) {
                    if(!isError) {
                      Log.SaveLog("Clans", data.clan_name + " has added an broadcasts channel: " + channel_Id);
                      message.channel.send(`Successfully set <#${ channel_Id }> as the broadcasts channel!`);
                    } else { Log.SaveError("Failed to set broadcasts channel"); message.reply("An error has occured... This has been logged, sorry about that!"); }
                  });
                } else { message.reply("Please set the broadcasts channel by tagging it in the message. E.g: `~Set Broadcasts #general`"); }
              } else { message.reply("Only discord administrators or the one who linked this server to the clan edit the clan."); }
            } else { message.reply("Please register a clan to track first. Use: `~Set clan`"); }
          } else { Log.SaveError("Failed to set broadcasts channel"); message.reply("An error has occured... This has been logged, sorry about that!"); }
        });
      } else { message.reply("Please register first. Use: `~Register example`"); }
    } else { Log.SaveError("Failed to set broadcasts channel"); message.reply("An error has occured... This has been logged, sorry about that!"); }
  });
}
async function RemoveBroadcasts(message) {
  Database.CheckRegistered(message.author.id, function(isError, isFound, data) {
    if(!isError) {
      if(isFound) {
        Database.GetClanDetails(message.guild.id, false, function(isError, isFound, data) {
          if(!isError) {
            if(isFound) {
              if(data.creator_id === message.author.id || message.member.hasPermission("ADMINISTRATOR")) {
                Database.RemoveClanBroadcastsChannel(message.guild.id, function(isError) {
                  if(!isError) {
                    Log.SaveLog("Clans", data.clan_name + " has removed their an broadcasts channel");
                    message.channel.send(`Successfully removed the broadcasts channel!`);
                  } else { Log.SaveError("Failed to remove broadcasts channel"); message.reply("An error has occured... This has been logged, sorry about that!"); }
                });
              } else { message.reply("Only discord administrators or the one who linked this server to the clan edit the clan."); }
            } else { message.reply("Please register a clan to track first. Use: `~Set clan`"); }
          } else { Log.SaveError("Failed to remove broadcasts channel"); message.reply("An error has occured... This has been logged, sorry about that!"); }
        });
      } else { message.reply("Please register first. Use: `~Register example`"); }
    } else { Log.SaveError("Failed to remove broadcasts channel"); message.reply("An error has occured... This has been logged, sorry about that!"); }
  });
}
async function AddToBlacklist(message, item) {
  if(item.indexOf("'") != -1) { message.reply("Please retry without quotes"); }
  else {
    Database.CheckRegistered(message.author.id, function(isError, isFound, data) {
      if(!isError) {
        if(isFound) {
          Database.GetClanDetails(message.guild.id, false, function(isError, isFound, data) {
            if(!isError) {
              if(isFound) {
                if(data.creator_id === message.author.id || message.member.hasPermission("ADMINISTRATOR")) {
                  Database.ToggleBlacklistFilter(message.guild.id, data, item, function(isError, isFiltered) {
                    if(!isError) {
                      if(isFiltered) {
                        Log.SaveLog("Clans", data.clan_name + " has filtered the item: " + item);
                        message.channel.send(`Successfully added ${ item } to the blacklist!`);
                      }
                      else {
                        Log.SaveLog("Clans", data.clan_name + " has un-filtered the item: " + item);
                        message.channel.send(`Successfully removed ${ item } from the blacklist!`);
                      }
                    }
                    else { Log.SaveError("Failed to filter item"); message.reply("An error has occured... This has been logged, sorry about that!"); }
                  });
                } else { message.reply("Only discord administrators or the one who linked this server to the clan edit the clan."); }
              } else { message.reply("Please register a clan to track first. Use: `~Set clan`"); }
            } else { Log.SaveError("Failed to filter item"); message.reply("An error has occured... This has been logged, sorry about that!"); }
          });
        } else { message.reply("Please register first. Use: `~Register example`"); }
      } else { Log.SaveError("Failed to filter item"); message.reply("An error has occured... This has been logged, sorry about that!"); }
    });
  }
}
async function AddToWhitelist(message, item) {
  if(item.indexOf("'") != -1) { message.reply("Please retry without quotes"); }
  else {
    Database.CheckRegistered(message.author.id, function(isError, isFound, data) {
      if(!isError) {
        if(isFound) {
          Database.GetClanDetails(message.guild.id, false, function(isError, isFound, data) {
            if(!isError) {
              if(isFound) {
                if(data.creator_id === message.author.id || message.member.hasPermission("ADMINISTRATOR")) {
                  Database.ToggleWhitelistFilter(message.guild.id, data, item, function(isError, isFiltered) {
                    if(!isError) {
                      if(isFiltered) {
                        Log.SaveLog("Clans", data.clan_name + " has filtered the item: " + item);
                        message.channel.send(`Successfully added ${ item } to the whitelist!`);
                      }
                      else {
                        Log.SaveLog("Clans", data.clan_name + " has un-filtered the item: " + item);
                        message.channel.send(`Successfully removed ${ item } from the whitelist!`);
                      }
                    }
                    else { Log.SaveError("Failed to filter item"); message.reply("An error has occured... This has been logged, sorry about that!"); }
                  });
                } else { message.reply("Only discord administrators or the one who linked this server to the clan edit the clan."); }
              } else { message.reply("Please register a clan to track first. Use: `~Set clan`"); }
            } else { Log.SaveError("Failed to filter item"); message.reply("An error has occured... This has been logged, sorry about that!"); }
          });
        } else { message.reply("Please register first. Use: `~Register example`"); }
      } else { Log.SaveError("Failed to filter item"); message.reply("An error has occured... This has been logged, sorry about that!"); }
    });
  }
}
