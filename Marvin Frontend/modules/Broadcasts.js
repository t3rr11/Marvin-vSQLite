//Required Libraraies
const Config = require('../../Combined/configs/config.json');
const Discord = require('discord.js');
const Misc = require("../js/misc.js");
const Log = require("../js/log.js");
const Database = require('./Database.js');

module.exports = { SetupBroadcasts, ConfigureBroadcasts, ToggleBroadcasts, RemoveBroadcasts, AddToBlacklist, AddToWhitelist, ProcessBroadcast, SendBroadcast, SendFinishedLoadingAnnouncement };

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
async function ConfigureBroadcasts(message) {
  Database.CheckRegistered(message.author.id, function(isError, isFound, data) {
    if(!isError) {
      if(isFound) {
        Database.GetGuild(message.guild.id, function(isError, isFound, data) {
          if(!isError) {
            if(isFound) {
              if(data.creator_id === message.author.id || message.member.hasPermission("ADMINISTRATOR")) {
                if(data.broadcasts_channel !== "null") {
                  let broadcastsEnabled = [];
                  let ignoredBroadcasts = [];
                  let whitelistedItems = data.whitelist.split(",");
                  data.enable_broadcasts_items === "true" ? broadcastsEnabled.push("Items") : ignoredBroadcasts.push("Items");
                  data.enable_broadcasts_titles === "true" ? broadcastsEnabled.push("Titles") : ignoredBroadcasts.push("Titles");
                  data.enable_broadcasts_clans === "true" ? broadcastsEnabled.push("Clans") : ignoredBroadcasts.push("Clans");
                  const embed = new Discord.RichEmbed()
                  .setColor(0x0099FF)
                  .setAuthor("Configure Broadcasts")
                  .setDescription(`
                    Broadcasts Channel: <#${ data.broadcasts_channel }>
                    Item Whitelist Enabled: ${ data.enable_whitelist }
                    ${ data.enable_whitelist === "true" ? (`${ whitelistedItems.length > 0 ? (`**Whitelisted Items: ** \n ${ whitelistedItems.map((item) => { return(` ${ item }`) }) } \n`) : "" }`) : "" }
                    ${ broadcastsEnabled.length > 0 ? (`**Enabled Broadcasts: ** \n ${ broadcastsEnabled.map((item) => { return(` ${ item }`) }) }`) : "" }
                    ${ ignoredBroadcasts.length > 0 ? (`**Disabled Broadcasts: ** \n ${ ignoredBroadcasts.map((item) => { return(` ${ item }`) }) }\n`) : "" }
                    To edit these options please see: \n\`~help broadcasts\`
                  `)
                  .setFooter(Config.defaultFooter, Config.defaultLogoURL)
                  .setTimestamp()
                  message.channel.send({embed});
                }
                else {
                  const embed = new Discord.RichEmbed()
                  .setColor(0x0099FF)
                  .setAuthor("Configure Broadcasts")
                  .setDescription(`
                    Broadcasts are currently disabled for this guild. If you would like to enable them please use: \`~Set Broadcasts #example\`.
                    Replace example with whichever channel you would like to have the broadcasts be announced into.
                  `)
                  .setFooter(Config.defaultFooter, Config.defaultLogoURL)
                  .setTimestamp()
                  message.channel.send({embed});
                }
              }
              else { message.reply("Only discord administrators or the one who linked this server to the clan edit the clan."); }
            }
            else { message.reply("Please register a clan to track first. Use: `~Set clan`"); }
          }
          else { Log.SaveError("Failed to set broadcasts channel"); message.reply("An error has occured... This has been logged, sorry about that!"); }
        });
      }
      else { message.reply("Please register first. Use: `~Register example`"); }
    }
    else { Log.SaveError("Failed to set broadcasts channel"); message.reply("An error has occured... This has been logged, sorry about that!"); }
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
async function ProcessBroadcast(client, broadcast, definitions) {
  const BroadcastType = broadcast.type;
  let BroadcastMessage = null;

  //Define Broadcast Description Message
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
  else if(BroadcastType === "other") { BroadcastMessage = broadcast.broadcast; }
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
              if(Guilds[i].broadcasts_channel !== "null") { SendBroadcast(client, Guilds[i], BroadcastMessage, broadcast, definitions); }
            }
          }
        }
      }
    });
  }
  Database.AddBroadcast(broadcast);
}
async function SendBroadcast(client, guild, message, broadcast, definitions) {
  //Make simple broadcast embed.
  let embed = new Discord.RichEmbed()
  .setColor(0xFFE000)
  .setTitle("Clan Broadcast")
  .setDescription(message)
  .setFooter(Config.defaultFooter, Config.defaultLogoURL)
  .setTimestamp();

  //Check to see what type of broadcast has been detected.
  if(broadcast.type === "item" && guild.enable_broadcasts_items === "true") {
    //If item, get item from definitions and adjust embed.
    var itemDef = definitions.find(e => e.hash === broadcast.hash);

    //Check if broadcasts are enabled on that item.
    if(JSON.parse(itemDef.broadcast_enabled)) {
      embed = new Discord.RichEmbed()
      .setColor(0xFFE000)
      .setTitle("Clan Broadcast")
      .setDescription(message)
      .setThumbnail(encodeURI(itemDef.imageUrl))
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp();
  
      if(itemDef.description.length > 0){ embed.addField("How to obtain:", itemDef.description) }
  
      //If whitelist is enabled then check the whitelisted items to see if it needs to be broadcasted.
      if(guild.enable_whitelist === "true") {
        var whitelistItems = guild.whitelist.split(',');
        if(whitelistItems.find(e => e.toUpperCase() === broadcast.broadcast.toUpperCase())) {
          try { client.guilds.get(guild.guild_id).channels.get(guild.broadcasts_channel).send({embed}); }
          catch(err) { console.log(`Failed to send item broadcast to ${ guild.guild_id } because of ${ err }`); }
        }
      }
      else {
        //If whitelist is disabled then check the blacklisted items to make sure it's not blacklisted.
        var blacklistItems = guild.blacklist.split(",");
        if(!blacklistItems.find(e => e.toUpperCase() === broadcast.broadcast.toUpperCase())) {
          try { client.guilds.get(guild.guild_id).channels.get(guild.broadcasts_channel).send({embed}); }
          catch(err) { console.log(`Failed to send item broadcast to ${ guild.guild_id } because of ${ err }`); }
        }
      }
    }
  }
  else if(broadcast.type === "title" && guild.enable_broadcasts_titles === "true") {
    //If title, get title from definitions and adjust embed.
    var titleDef = definitions.find(e => e.hash === broadcast.hash);
    
    //Check if broadcasts are enabled on that item.
    if(JSON.parse(titleDef.broadcast_enabled)) {
      embed = new Discord.RichEmbed()
      .setColor(0xFFE000)
      .setTitle("Clan Broadcast")
      .setDescription(message)
      .setThumbnail(encodeURI(titleDef.imageUrl))
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp();

      if(titleDef.description.length > 0){ embed.addField("Obtained by:", titleDef.description) }
  
      try { client.guilds.get(guild.guild_id).channels.get(guild.broadcasts_channel).send({embed}); }
      catch(err) { console.log(`Failed to send title broadcast to ${ guild.guild_id } because of ${ err }`); }
    }
  }
  else if(broadcast.type === "clan" && guild.enable_broadcasts_clans === "true") {
    try { client.guilds.get(guild.guild_id).channels.get(guild.broadcasts_channel).send({embed}); }
    catch(err) { console.log(`Failed to send clan broadcast to ${ guild.guild_id } because of ${ err }`); }
  }
  else if(broadcast.type === "dungeon" && guild.enable_broadcasts_dungeons === "true") {
    try { client.guilds.get(guild.guild_id).channels.get(guild.broadcasts_channel).send({embed}); }
    catch(err) { console.log(`Failed to send dungeon broadcast to ${ guild.guild_id } because of ${ err }`); }
  }
  else if(broadcast.type === "catalyst" && guild.enable_broadcasts_catalysts === "true") {
    try { client.guilds.get(guild.guild_id).channels.get(guild.broadcasts_channel).send({embed}); }
    catch(err) { console.log(`Failed to send catalyst broadcast to ${ guild.guild_id } because of ${ err }`); }
  }
  else if(broadcast.type === "other" && guild.enable_broadcasts_others === "true") {
    try { client.guilds.get(guild.guild_id).channels.get(guild.broadcasts_channel).send({embed}); }
    catch(err) { console.log(`Failed to send other broadcast to ${ guild.guild_id } because of ${ err }`); }
  }
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
async function ToggleBroadcasts(message, type) {
  Database.CheckRegistered(message.author.id, function(isError, isFound, data) {
    if(!isError) {
      if(isFound) {
        Database.GetGuild(message.guild.id, function(isError, isFound, data) {
          if(!isError) {
            if(isFound) {
              if(data.creator_id === message.author.id || message.member.hasPermission("ADMINISTRATOR")) {
                if(type === "Item") {
                  Database.ToggleBroadcasts(message.guild.id, type, data.enable_broadcasts_items, function(isError) {
                    if(!isError) {
                      if(data.enable_broadcasts_items === "true") { message.channel.send(`${ type } Broadcasts will no longer be sent to the broadcasts channel. You can see or configure other broadcasts by using: \`~Configure Broadcasts\``); }
                      else { message.channel.send(`${ type } Broadcasts have been re-enabled and will be sent to the broadcasts channel. You can see or configure other broadcasts by using: \`~Configure Broadcasts\``); }  
                    }
                    else { Log.SaveError(`Failed to toggle ${ type } broadcast for ${ message.guild.id }`); message.reply("An error has occured... This has been logged, sorry about that!"); }
                  });
                }
                else if(type === "Title") {
                  Database.ToggleBroadcasts(message.guild.id, type, data.enable_broadcasts_titles, function(isError) {
                    if(!isError) {
                      if(data.enable_broadcasts_titles === "true") { message.channel.send(`${ type } Broadcasts will no longer be sent to the broadcasts channel. You can see or configure other broadcasts by using: \`~Configure Broadcasts\``); }
                      else { message.channel.send(`${ type } Broadcasts have been re-enabled and will be sent to the broadcasts channel. You can see or configure other broadcasts by using: \`~Configure Broadcasts\``); }
                    }
                    else { Log.SaveError(`Failed to toggle ${ type } broadcast for ${ message.guild.id }`); message.reply("An error has occured... This has been logged, sorry about that!"); }
                  });
                }
                else if(type === "Clan") {
                  Database.ToggleBroadcasts(message.guild.id, type, data.enable_broadcasts_clans, function(isError) {
                    if(!isError) {
                      if(data.enable_broadcasts_clans === "true") { message.channel.send(`${ type } Broadcasts will no longer be sent to the broadcasts channel. You can see or configure other broadcasts by using: \`~Configure Broadcasts\``); }
                      else { message.channel.send(`${ type } Broadcasts have been re-enabled and will be sent to the broadcasts channel. You can see or configure other broadcasts by using: \`~Configure Broadcasts\``); }
                    }
                    else { Log.SaveError(`Failed to toggle ${ type } broadcast for ${ message.guild.id }`); message.reply("An error has occured... This has been logged, sorry about that!"); }
                  });
                }
              }
              else { message.reply("Only discord administrators or the one who linked this server to the clan edit the clan."); }
            }
            else { message.reply("Please register a clan to track first. Use: `~Set clan`"); }
          }
          else { Log.SaveError("Failed to set broadcasts channel"); message.reply("An error has occured... This has been logged, sorry about that!"); }
        });
      }
      else { message.reply("Please register first. Use: `~Register example`"); }
    }
    else { Log.SaveError("Failed to set broadcasts channel"); message.reply("An error has occured... This has been logged, sorry about that!"); }
  });
}