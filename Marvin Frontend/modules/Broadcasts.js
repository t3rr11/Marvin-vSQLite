//Required Libraraies
const Discord = require('discord.js');
const Misc = require("../js/misc.js");
const Log = require("../js/log.js");
const Config = require('../data/config.json');
const Database = require('./Database.js');

module.exports = { SetupBroadcasts, RemoveBroadcasts, AddToBlacklist, AddToWhitelist, SendBroadcast, SendFinishedLoadingAnnouncement };

async function SetupBroadcasts(message) {
  Database.CheckRegistered(message.author.id, function(isError, isFound, data) {
    if(!isError) {
      if(isFound) {
        Database.GetGuild(message.guild.id, function(isError, isFound, data) {
          if(!isError) {
            if(isFound) {
              if(data.creator_id === message.author.id || message.member.hasPermission("ADMINISTRATOR")) {
                var channel_Id = null; try { channel_Id = message.mentions.channels.first().id } catch (err) {  }
                if(channel_Id !== null) {
                  Database.AddGuildBroadcastChannel(channel_Id, message.guild.id, function(isError) {
                    if(!isError) {
                      Log.SaveLog("Clans", data.guild_name + " has added an broadcasts channel: " + channel_Id);
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
        Database.GetGuild(message.guild.id, function(isError, isFound, data) {
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
          Database.GetGuild(message.guild.id, function(isError, isFound, data) {
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
          Database.GetGuild(message.guild.id, function(isError, isFound, data) {
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
async function SendBroadcast(client, broadcast) {
  //Here lie the broadcast sending function, this needs to filter through GetGuilds and find ones that have a likeness of the broadcast.clanId value. Then check if they have a broadcast channel other than null,
  //If so then send broadcast else, just report the broadcast.
  var message = null;
  if(broadcast.type === "item") {
    if(broadcast.count === -1) { message = `${ broadcast.displayName } has obtained ${ broadcast.broadcast }`; }
    else { message = `${ broadcast.displayName } has obtained ${ broadcast.broadcast } in ${ broadcast.count } ${ broadcast.count > 1 ? "raids!" : "raid!" }` }
  }
  else if(broadcast.type === "title") { message = `${ broadcast.displayName } has obtained the ${ broadcast.broadcast } title!` }
  Database.GetGuilds(function(isError, Guilds) {
    if(!isError) {
      for(var i in Guilds) {
        var clans = Guilds[i].clans.split(',');
        for(var j in clans) {
          if(clans[j] === broadcast.clanId) {
            if(Guilds[i].enable_whitelist === "true") {
              //If whitelist is enabled then check the whitelisted items
              var whitelistItems = Guilds[i].whitelist.split(',');
              if(whitelistItems.find(e => e.toUpperCase() === broadcast.broadcast.toUpperCase())) {
                //If broadcasts channel != null then broadcast, otherwise ignore.
                if(Guilds[i].broadcasts_channel !== "null") {
                  const thisDate = new Date();
                  const embed = new Discord.RichEmbed().setColor(0xFFE000).setAuthor("Clan Broadcast").setDescription(message).setFooter(Config.defaultFooter, Config.defaultLogoURL).setTimestamp();
                  try { client.guilds.get(Guilds[i].guild_id).channels.get(Guilds[i].broadcasts_channel).send({embed}); }
                  catch(err) { console.log(`Failed to broadcast to ${ Guilds[i].guild_id } because of ${ err }`); }
                }
              }
            }
            else {
              //If whitelist is disabled then check the blacklisted items.
              var blacklistItems = Guilds[i].blacklist.split(",");
              if(!blacklistItems.find(e => e.toUpperCase() === broadcast.broadcast.toUpperCase())) {
                if(Guilds[i].broadcasts_channel !== "null") {
                  const thisDate = new Date();
                  const embed = new Discord.RichEmbed().setColor(0xFFE000).setAuthor("Clan Broadcast").setDescription(message).setFooter(Config.defaultFooter, Config.defaultLogoURL).setTimestamp();
                  try { client.guilds.get(Guilds[i].guild_id).channels.get(Guilds[i].broadcasts_channel).send({embed}); }
                  catch(err) { console.log(`Failed to broadcast to ${ Guilds[i].guild_id } because of ${ err }`); }
                }
              }
            }
          }
        }
      }
    }
  });
  Database.AddBroadcast(broadcast);
}
async function SendFinishedLoadingAnnouncement(client, Clan) {
  Database.GetGuilds(function(isError, Guilds) {
    if(!isError) {
      for(var i in Guilds) {
        var clans = Guilds[i].clans.split(',');
        for(var j in clans) {
          if(clans[j] === Clan.clan_id) {
            const thisDate = new Date();
            const embed = new Discord.RichEmbed().setColor(0xFFE000).setAuthor("Clan Broadcast").setDescription(`${ Clan.clan_name } has finished loading for the first time. You are free to use commands now! For help use: ~help.`).setFooter(Config.defaultFooter, Config.defaultLogoURL).setTimestamp();
            try { Misc.getDefaultChannel(client.guilds.get(Guilds[i].guild_id)).send({embed}); }
            catch(err) { console.log(`Failed to broadcast to ${ Guilds[i].guild_id } because of ${ err }`); }
          }
        }
      }
    }
  });
}
