//Required Libraraies
const Config = require('../../Combined/configs/config.json');
const Discord = require('discord.js');
const Misc = require("../js/misc.js");
const Log = require("../js/log.js");
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
  const BroadcastType = broadcast.type;
  const thisDate = new Date();
  let BroadcastMessage = null;

  if(BroadcastType === "item") {
    if(broadcast.count === -1) {
      //If broadcast count === -1 then the broadcast is not a raid specific broadcast.
      BroadcastMessage = `${ broadcast.displayName } has obtained ${ broadcast.broadcast }`;
    }
    else {
      //If the broadcast count has a value other than -1 then it must be a raid broadcast so the message needs to be changed to include this.
      BroadcastMessage = `${ broadcast.displayName } has obtained ${ broadcast.broadcast } in ${ broadcast.count } ${ broadcast.count > 1 ? "raids!" : "raid!" }`;
    }
  }
  else if(BroadcastType === "title") {
    //If the broadcast is a title, then set the message as seen below.
    BroadcastMessage = `${ broadcast.displayName } has obtained the ${ broadcast.broadcast } title!` 
  }
  else if(BroadcastType === "clan") { BroadcastMessage = broadcast.broadcast; }
  else { Log.SaveError(`New broadcast type found, but we are unsure of what to do with it. Type: ${ BroadcastType }`); }

  //Check to see if broadcasts are enabled. Usually disabled for debugging.
  if(Config.enableBroadcasts) {
    //Loop through guilds and find guilds where the clan_id matches those guilds tracked clans.
    Database.GetGuilds(function(isError, Guilds) {
      if(!isError) {
        for(var i in Guilds) {
          var clans = Guilds[i].clans.split(',');
          for(var j in clans) {
            if(clans[j] === broadcast.clanId) {
              //Check to see if they have broadcasts enabled. If they have broadcasts disabled it will return null.
              if(Guilds[i].broadcasts_channel !== "null") {
                //Make broadcast embed.
                const embed = new Discord.RichEmbed()
                .setColor(0xFFE000)
                .setAuthor("Clan Broadcast")
                .setDescription(BroadcastMessage)
                .setFooter(Config.defaultFooter, Config.defaultLogoURL)
                .setTimestamp();
                
                //Check to see what type of broadcast has been detected.
                if(BroadcastType === "item" && Guilds[i].enable_broadcasts_items === "true") {
                  //If whitelist is enabled then check the whitelisted items to see if it needs to be broadcasted.
                  if(Guilds[i].enable_whitelist === "true") {
                    var whitelistItems = Guilds[i].whitelist.split(',');
                    if(whitelistItems.find(e => e.toUpperCase() === broadcast.broadcast.toUpperCase())) {
                      try { client.guilds.get(Guilds[i].guild_id).channels.get(Guilds[i].broadcasts_channel).send({embed}); }
                      catch(err) { console.log(`Failed to send item broadcast to ${ Guilds[i].guild_id } because of ${ err }`); }
                    }
                  }
                  else {
                    //If whitelist is disabled then check the blacklisted items to make sure it's not blacklisted.
                    var blacklistItems = Guilds[i].blacklist.split(",");
                    if(!blacklistItems.find(e => e.toUpperCase() === broadcast.broadcast.toUpperCase())) {
                      try { client.guilds.get(Guilds[i].guild_id).channels.get(Guilds[i].broadcasts_channel).send({embed}); }
                      catch(err) { console.log(`Failed to send item broadcast to ${ Guilds[i].guild_id } because of ${ err }`); }
                    }
                  }
                }
                else if(BroadcastType === "title" && Guilds[i].enable_broadcasts_titles === "true") {
                  try { client.guilds.get(Guilds[i].guild_id).channels.get(Guilds[i].broadcasts_channel).send({embed}); }
                  catch(err) { console.log(`Failed to send title broadcast to ${ Guilds[i].guild_id } because of ${ err }`); }
                }
                else if(BroadcastType === "clan" && Guilds[i].enable_broadcasts_clans === "true") {
                  try { client.guilds.get(Guilds[i].guild_id).channels.get(Guilds[i].broadcasts_channel).send({embed}); }
                    catch(err) { console.log(`Failed to send clan broadcast to ${ Guilds[i].guild_id } because of ${ err }`); }
                }
                else if(BroadcastType === "dungeon" && Guilds[i].enable_broadcasts_dungeons === "true") {
                  try { client.guilds.get(Guilds[i].guild_id).channels.get(Guilds[i].broadcasts_channel).send({embed}); }
                  catch(err) { console.log(`Failed to send dungeon broadcast to ${ Guilds[i].guild_id } because of ${ err }`); }
                }
                else if(BroadcastType === "catalyst" && Guilds[i].enable_broadcasts_catalysts === "true") {
                  try { client.guilds.get(Guilds[i].guild_id).channels.get(Guilds[i].broadcasts_channel).send({embed}); }
                  catch(err) { console.log(`Failed to send catalyst broadcast to ${ Guilds[i].guild_id } because of ${ err }`); }
                }
              }
            }
          }
        }
      }
    });
  }
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
            try { Misc.getDefaultChannel(client.guilds.get(Guilds[i].guild_id)).send({embed}); Log.SaveLog("Clans", `Informed ${ Guilds[i].guild_id } that the clan ${ Clan.clan_id } has finished loading.`); }
            catch(err) { Log.SaveError(`Failed to inform ${ Guilds[i].guild_id } that the clan ${ Clan.clan_id } has finished loading. Error: ${ err }`); }
          }
        }
      }
    }
  });
}
