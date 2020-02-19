//Required Libraraies
const Discord = require('discord.js');
const fs = require('fs');
const Bot = require("../bot.js");
const Misc = require("../js/misc.js");
const Log = require("../js/log.js");
const Config = require('../data/config.json');
const fetch = require("node-fetch");
const Database = require('./Database.js');

module.exports = { RegisterClan, AddClan, RemoveClan, DeleteClan, UserDeleteGuild };

async function GetClanIDFromMbmID(mbmType, mbmId) {
  const headers = { headers: { "X-API-Key": Config.apiKey, "Content-Type": "application/json" } };
  const request = await fetch(`https://www.bungie.net/Platform/GroupV2/User/${ mbmType }/${ mbmId }/0/1`, headers);
  const response = await request.json();
  if(request.ok && response.ErrorCode && response.ErrorCode !== 1) {
    //Error with bungie, might have sent bad headers.
    console.log(`Error: ${ JSON.stringify(response) }`);
    return JSON.stringify(response);
  }
  else if(request.ok) {
    //Everything is ok, request was returned to sender.
    return { 'id': response.Response.results[0].group.groupId, 'name': response.Response.results[0].group.name };
  }
  else {
    //Error in request ahhhhh!
    console.log(`Error: ${ JSON.stringify(response) }`);
    return JSON.stringify(response);
  }
}
async function RegisterClan(message) {
  Database.CheckRegistered(message.author.id, function(isError, isFound, data) {
    if(!isError) {
      if(isFound) {
        var playerData = data;
        Database.GetGuild(message.guild.id, async function(isError, isFound, data) {
          if(!isError) {
            if(!isFound) {
              const Clan = await GetClanIDFromMbmID(playerData.platform, playerData.membershipId);
              if(Clan.id !== undefined) {
                if(Clan !== "Error") {
                  Database.AddNewGuild(message, Clan, function(isError) {
                    if(!isError) {
                      Log.SaveLog("Clans", "Clan Added: " + Clan.name + " (" + Clan.id + ")");
                      message.channel.send(`${ Clan.name } has been successfully registered to this server! If this is the first time registering it may take a few minutes to grab your clans data for the first time.`);
                    }
                    else { message.reply("Sorry we failed to set clan, please try again!"); }
                  });
                }
                else { message.reply("Sorry we failed to set clan, please try again!"); console.log(Clan); }
              }
              else { message.reply("Sorry we failed to set clan, please try again!"); }
            }
            else { message.reply("This clan already has a registered clan, if you wish to add another to the tracking use `~Add clan`, or if you have changed clan use `~Delete clan` first."); }
          }
          else { Log.SaveError("Failed to set clan"); message.reply("An error has occured... This has been logged, sorry about that!"); }
        });
      }
      else { message.reply("Please register first. Use: `~Register example`"); }
    }
    else { Log.SaveError("Failed to check if user exists"); message.reply("An error has occured... This has been logged, sorry about that!"); }
  });
}
function AddClan(message, clan_id) {
  Database.CheckRegistered(message.author.id, function(isError, isFound, data) {
    if(!isError) {
      if(isFound) {
        var playerData = data;
        Database.GetGuild(message.guild.id, async function(isError, isFound, data) {
          if(!isError) {
            if(isFound) {
              if(data.creator_id === message.author.id || message.member.hasPermission("ADMINISTRATOR")) {
                if(clan_id.length > 0 && !isNaN(clan_id)) {
                  const Clan = await GetClanInfo(message, clan_id);
                  if(Clan !== undefined) {
                    var clans = data.clans.split(",");
                    if(!clans.find(e => e === clan_id)) {
                      clans.push(clan_id);
                      Database.AddClanToGuild(message.guild.id, clans, function(isError) {
                        if(!isError) {
                          console.log(`Added ${ Clan.name } to the tracking for ${ message.guild.id }`);
                          message.channel.send(`${ Clan.name } has been succesfully added and will start to be tracked for this server! If this is the first time, it may take a few minutes to load the data for the first time. Please wait.`);
                        }
                        else { message.reply(`There was an error trying to add clan. Sorry please try again.`); }
                      });
                    }
                    else { message.reply(`${ Clan.name } (${ Clan.groupId }) is already being tracked by this server. Whatcha doing willis?`); }
                  }
                  else { console.log(`Could not find clan with the ID: ${ clan_id }`); }
                }
                else {
                  const embed = new Discord.RichEmbed()
                  .setColor(0x0099FF)
                  .setAuthor("How to add another clan!")
                  .setDescription("In order to add a new clan to be tracked along side your main clan you will need to find that clan here: https://www.bungie.net/en/ClanV2/MyClans \n\nOnce you've found the clan you wish to add check the URL of the page, it should say `https://www.bungie.net/en/ClanV2/Index?groupId=1234567`. \n\nThen it's just a matter of using that groupId like this: `~add clan 1234567`")
                  .setFooter(Config.defaultFooter, Config.defaultLogoURL)
                  .setTimestamp()
                  message.channel.send({embed});
                }
              }
              else { message.reply("Only discord administrators or the one who linked this server can add or remove clans from the server. Get them to use: `~add clan` for you."); }
            }
            else { RegisterClan(message); }
          }
          else { Log.SaveError("Failed to find clan."); message.reply("An error has occured... This has been logged, sorry about that!"); }
        });
      }
      else { message.reply("Please register first. Use: `~Register example`"); }
    }
    else { Log.SaveError("Failed to check if user exists"); message.reply("An error has occured... This has been logged, sorry about that!"); }
  });
}
function RemoveClan(message, clanToDelete) {
  Database.CheckRegistered(message.author.id, function(isError, isFound, data) {
    if(!isError) {
      if(isFound) {
        var playerData = data;
        Database.GetGuild(message.guild.id, async function(isError, isFound, data) {
          if(!isError) {
            if(isFound) {
              if(data.owner_id === message.author.id || message.member.hasPermission("ADMINISTRATOR")) {
                if(clanToDelete.length > 0) {
                  var clans = data.clans.split(",");
                  var clanIdToDelete = clans[clanToDelete-1];
                  if(clanIdToDelete !== undefined) {
                    Database.RemoveClan(message.guild.id, clanIdToDelete, function(isError) {
                      if(!isError) {
                        message.channel.send("Clan has been removed and will no longer be tracked for this server.");
                        Log.SaveLog("Clans", `Clan removed: ${ clanIdToDelete } from ${ message.guild.id }`);
                      }
                      else { message.reply("Failed to remove clan."); }
                    });
                  }
                  else { message.reply(`There is no clan at value: ${ clanToDelete }`); GetTrackedClans(message); }
                }
                else { GetTrackedClans(message); }
              }
              else { message.reply("Only discord administrators or the one who linked this server can remove the clan from the server."); }
            }
            else { message.reply("We could not find a clan to remove."); }
          }
          else { Log.SaveError("Failed to find clan."); message.reply("An error has occured... This has been logged, sorry about that!"); }
        });
      }
      else { message.reply("Please register first. Use: `~Register example`"); }
    }
    else { Log.SaveError("Failed to check if user exists"); message.reply("An error has occured... This has been logged, sorry about that!"); }
  });
}
function DeleteClan(guild_id) {
  Database.DeleteGuild(guild_id, async function(isError, isFound, data) {
    if(!isError) { console.log("Guild deleted."); }
    else { Log.SaveError("Failed to delete guild for " + guild_id); }
  });
}
function UserDeleteGuild(message) {
  Database.CheckRegistered(message.author.id, function(isError, isFound, data) {
    if(!isError) {
      if(isFound) {
        var playerData = data;
        Database.GetGuild(message.guild.id, async function(isError, isFound, data) {
          if(!isError) {
            if(isFound) {
              if(data.creator_id === message.author.id || message.member.hasPermission("ADMINISTRATOR")) {
                Database.DeleteGuild(message.guild.id, function(isError) {
                  if(!isError) { console.log(`Guild deleted: ${ message.guild.id }`); message.reply("Guild data has been deleted. We are no longer tracking this guild or clan(s)"); }
                  else { Log.SaveError("Failed to delete guild: " + message.guild.id); }
                });
              }
              else { message.reply("Only discord administrators or the one who linked this server can remove the clan from the server."); }
            }
            else { message.reply("We could not find a clan to remove."); }
          }
          else { Log.SaveError("Failed to remove clan"); message.reply("An error has occured... This has been logged, sorry about that!"); }
        });
      }
      else { message.reply("Please register first. Use: `~Register example`"); }
    }
    else { Log.SaveError("Failed to check if user exists"); message.reply("An error has occured... This has been logged, sorry about that!"); }
  });
}
async function GetTrackedClans(message) {
  Database.GetGuild(message.guild.id, async function(isError, isFound, data) {
    var clans = data.clans.split(",");
    var clanData = { "names": [], "ids":[] }
    for(var i in clans) {
      await new Promise(resolve =>
        Database.GetClan(clans[i], function(isError, isFound, data) {
          clanData.names.push(`${ parseInt(i)+1 }. ${ data.clan_name }`);
          clanData.ids.push(data.clan_id);
          resolve(true);
        })
      );
    }
    const embed = new Discord.RichEmbed()
    .setColor(0x0099FF)
    .setAuthor("Clans Tracked")
    .setDescription("In order to remove a tracked clan, use the number associated with the clan. Example: `~remove clan 1`")
    .addField("Name", clanData.names, true)
    .addField("Clan ID", clanData.ids, true)
    .setFooter(Config.defaultFooter, Config.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  });
}
async function GetClanNames(clan_ids) {
  var clanData = [];
  var clans = clan_ids.split(",");
  for(var i in clans) {
    const headers = { headers: { "X-API-Key": Config.apiKey, "Content-Type": "application/json" } };
    const request = await fetch(`https://www.bungie.net/Platform/GroupV2/${ clans[i] }/`, headers);
    const response = await request.json();
    if(request.ok && response.ErrorCode && response.ErrorCode !== 1) { console.log(`Error: ${ JSON.stringify(response) }`); }
    else if(request.ok) { clanData.push({ "name": response.Response.detail.name, "groupId": response.Response.detail.groupId }); }
    else { console.log(`Error: ${ JSON.stringify(response) }`); }
  }
  return clanData;
}
async function GetClanInfo(message, clan_id) {
  try {
    const headers = { headers: { "X-API-Key": Config.apiKey, "Content-Type": "application/json" } };
    const request = await fetch(`https://www.bungie.net/Platform/GroupV2/${ clan_id }/`, headers);
    const response = await request.json();
    if(request.ok && response.ErrorCode && response.ErrorCode !== 1) {
      Log.SaveError(`Error trying to find clan with the ID: ${ clan_id } Error: ${ JSON.stringify(response) }`);
      message.reply(`Error trying to find clan with the ID: ${ clan_id }. This has been logged.`);
      return undefined;
    }
    else if(request.ok) {
      if(response.Response.detail.clanInfo) { return response.Response.detail; }
      else { message.reply("A clan was found, but it is not a Destiny 2 clan. Not added sorry."); return undefined; }
    }
    else {
      if(response.ErrorCode === 622) { message.reply(`No clan with the ID: ${ clan_id } was found.`); }
      else { Log.SaveError(`Error trying to find clan with the ID: ${ clan_id } Error: ${ JSON.stringify(response) }`); message.reply(`Error trying to find clan with the ID: ${ clan_id }. This has been logged.`); }
      return undefined;
    }
  }
  catch(err) {
    Log.SaveError(`Error trying to find clan with the ID: ${ clan_id } Error: ${ err }`);
    message.reply(`Error trying to find clan with the ID: ${ clan_id }. This has been logged.`);
  }
}
