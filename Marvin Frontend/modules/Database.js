const MySQL = require('mysql');
const Misc = require("../js/misc.js");
const Log = require("../js/log.js");
const DBConfig = require('../../Combined/configs/db_config.json');
const Config = require('../../Combined/configs/config.json');
const fetch = require("node-fetch");

//Exports
module.exports = {
  GetClan, GetClans, GetGuild, GetGuilds, GetAllGuilds, GetPlayers, GetUsers, GetGlobalDryStreak, GetClanDryStreaks, GetFromBroadcasts, GetFromClanBroadcasts, GetNewBroadcasts, GetSingleClanLeaderboard, GetClanLeaderboards, GetGlobalLeaderboards, GetClanDetailsViaAuthor,
  CheckRegistered, CheckNewBroadcast, CheckNewClanBroadcast, 
  AddTrackedPlayer, AddGuildBroadcastChannel, AddClanToGuild, AddNewClan, AddNewGuild, AddBroadcast,
  RemoveClanBroadcastsChannel, RemoveClan, RemoveAwaitingBroadcast, RemoveAwaitingClanBroadcast,
  ForceFullScan, EnableWhitelist, DisableWhitelist, ToggleBlacklistFilter, ToggleWhitelistFilter, DeleteGuild, ReAuthClan, TransferClan, DisableTracking, EnableTracking
};

//MySQL Connection
var db;
function handleDisconnect() {
  db = MySQL.createConnection(DBConfig);
  db.connect(function(err) {
    if(err) {
      console.log('Error when connecting to db: ', err);
      setTimeout(handleDisconnect, 2000);
    }
  });
  db.on('error', function(err) {
    console.log('Database Error: ', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { Log.SaveError("Frontend lost connection to MySQL database. Reconnecting now..."); handleDisconnect(); }
    else { throw err; }
  });
}

handleDisconnect();
//MySQL Functions

//Gets
function GetClan(clan_id, callback) {
  var sql = "SELECT * FROM clans WHERE clan_id = ?";
  var inserts = [clan_id];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error getting clan details for: ${ clan_id }, ${ error }`); callback(true); }
    else { if(rows.length > 0) { callback(false, true, rows[0]); } else { callback(false, false); } }
  });
}
function GetClans(callback) {
  var buildClans = [];
  db.query(`SELECT * FROM clans WHERE isTracking="true"`, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error getting all registered clans from server: ${ error }`); callback(true); }
    else { for(var i in rows) { buildClans.push(rows[i]); } callback(false, buildClans); }
  });
  return buildClans;
}
function GetGuild(guild_id, callback) {
  var sql = "SELECT * FROM guilds WHERE guild_id = ?";
  var inserts = [guild_id];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error getting guild details for: ${ guild_id }, ${ error }`); callback(true); }
    else { if(rows.length > 0) { callback(false, true, rows[0]); } else { callback(false, false); } }
  });
}
function GetGuilds(callback) {
  var buildGuilds = [];
  db.query(`SELECT * FROM guilds WHERE isTracking="true"`, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error getting all registered guilds from server: ${ error }`); callback(true); }
    else { for(var i in rows) { buildGuilds.push(rows[i]); } callback(false, buildGuilds); }
  });
  return buildGuilds;
}
function GetAllGuilds(callback) {
  var buildGuilds = [];
  db.query(`SELECT * FROM guilds`, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error getting all guilds from server: ${ error }`); callback(true); }
    else { for(var i in rows) { buildGuilds.push(rows[i]); } callback(false, buildGuilds); }
  });
  return buildGuilds;
}
function GetPlayers(callback) {
  var players = [];
  db.query(`SELECT * FROM playerInfo`, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error getting all players from server: ${ error }`); callback(true); }
    else { for(var i in rows) { players.push(rows[i]); } callback(false, players); }
  });
  return players;
}
function GetUsers(callback) {
  var users = [];
  db.query(`SELECT * FROM users`, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error getting all users from server: ${ error }`); callback(true); }
    else { for(var i in rows) { users.push(rows[i]); } callback(false, users); }
  });
  return users;
}
function GetGlobalDryStreak(item, callback) {
  var sql = "SELECT * FROM playerInfo WHERE (items NOT LIKE ?) AND (clanId NOT LIKE '')";
  var inserts = ['%' + item + '%'];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error getting drystreak leaderboards for ${ item } Error: ${ error }`); callback(true); }
    else { if(rows.length > 0) { callback(false, true, rows); } else { callback(true); } }
  });
}
function GetClanDryStreaks(clanIds, item, callback) {
  var query = ""; for(var i in clanIds) { if(i == 0) { query = `clanId="${ clanIds[i] }"` } else { query = `${ query } OR clanId="${ clanIds[i] }"` } }
  var sql = `SELECT * FROM playerInfo WHERE (items NOT LIKE ?) AND (${ query })`;
  var inserts = ['%' + item + '%'];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error getting drystreak leaderboards for ${ item } Error: ${ error }`); callback(true); }
    else { if(rows.length > 0) { callback(false, true, rows); } else { callback(true); } }
  });
}
function GetFromBroadcasts(item, callback) {
  var sql = "SELECT * FROM broadcasts WHERE broadcast LIKE ?";
  var inserts = ['%' + item + '%'];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error getting broadcasts for ${ item } Error: ${ error }`); callback(true); }
    else { if(rows.length > 0) { callback(false, true, rows); } else { callback(true); } }
  });
}
function GetFromClanBroadcasts(clanIds, item, callback) {
  var query = ""; for(var i in clanIds) { if(i == 0) { query = `clanId="${ clanIds[i] }"` } else { query = `${ query } OR clanId="${ clanIds[i] }"` } }
  var sql = `SELECT * FROM broadcasts WHERE (broadcast LIKE ?) AND (${ query })`;
  var inserts = ['%' + item + '%'];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error getting broadcasts for ${ item } Error: ${ error }`); callback(true); }
    else { if(rows.length > 0) { callback(false, true, rows); } else { callback(true); } }
  });
}
function GetNewBroadcasts(callback) {
  db.query(`SELECT * FROM awaiting_broadcasts`, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error getting awaiting broadcasts, Error: ${ error }`); callback(true); }
    else { if(rows.length > 0) { callback(false, true, rows); } else { callback(true); } }
  });
}
function GetSingleClanLeaderboard(clanId, callback) {
  var sql = "SELECT * FROM playerInfo WHERE clanId = ? AND isPrivate = ?";
  var inserts = [clanId, "false"];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error getting clan leaderboards: ${ clanId } Error: ${ error }`); callback(true); }
    else { if(rows.length > 0) { callback(false, true, rows); } else { callback(true); } }
  });
}
function GetClanLeaderboards(clanIds, callback) {
  var query = ""; for(var i in clanIds) { if(i == 0) { query = `clanId="${ clanIds[i] }"` } else { query = `${ query } OR clanId="${ clanIds[i] }"` } }
  db.query(`SELECT * FROM playerInfo WHERE ${ query }`, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error getting clan leaderboards: ${ clanIds } Error: ${ error }`); callback(true); }
    else { if(rows.length > 0) { callback(false, true, rows); } else { callback(true); } }
  });
}
function GetGlobalLeaderboards(callback) {
  db.query(`SELECT * FROM playerInfo WHERE EXISTS (SELECT 1 FROM clans WHERE clans.clan_id = playerInfo.clanId AND clans.isTracking = "true" AND playerInfo.isPrivate = "false")`, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error getting global leaderboards, Error: ${ error }`); callback(true); }
    else { if(rows.length > 0) { callback(false, true, rows); } else { callback(true); } }
  });
}
function GetClanDetailsViaAuthor(data, callback) {
  var sql = "SELECT * FROM guilds WHERE owner_id = ? && owner_avatar = ?";
  var inserts = [data.id, data.avatar];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error getting guild details using discord user data, ${ error }`); callback(true); }
    else { if(rows.length > 0) { callback(false, true, rows); } else { callback(false, false); } }
  });
}

//Checks
function CheckRegistered(discord_id, callback) {
  var sql = "SELECT * FROM users WHERE discord_id = ?";
  var inserts = [discord_id];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error finding player: ${ error }`); callback(true); }
    else { if(rows.length > 0) { callback(false, true, rows[0]); } else { callback(false, false); } }
  });
}
function CheckNewBroadcast(membershipId, season, broadcast, callback) {
  var sql = "SELECT * FROM broadcasts WHERE membershipId = ? AND season = ? AND broadcast = ?";
  var inserts = [membershipId, season, broadcast];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error finding broadcast: ${ error }`); callback(true); }
    else {
      if(rows.length > 0) { callback(false, true); }
      else { callback(false, false); }
    }
  });
}
function CheckNewClanBroadcast(clanId, season, broadcast, callback) {
  var sql = "SELECT * FROM broadcasts WHERE clanId = ? AND season = ? AND broadcast = ?";
  var inserts = [clanId, season, broadcast];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error finding broadcast: ${ error }`); callback(true); }
    else {
      if(rows.length > 0) { callback(false, true); }
      else { callback(false, false); }
    }
  });
}

//Adds
function AddTrackedPlayer(discord_id, membershipData, callback) {
  var sql = "SELECT * FROM users WHERE discord_id = ?";
  var inserts = [discord_id];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error finding players, Error: ${ error }`); callback(true); }
    else {
      if(rows.length > 0) {
        var sql = "UPDATE users SET discord_id = ?, username = ?, membershipId = ?, platform = ? WHERE discord_id = ?";
        var inserts = [discord_id, membershipData.displayName, membershipData.membershipId, membershipData.membershipType, discord_id];
        sql = db.format(sql, inserts);
        db.query(sql, function(error, rows, fields) {
          if(!!error) { Log.SaveError(`Error updating player: ${ membershipData }, Error: ${ error }`); callback(true); }
          else { callback(false, false, true); }
        });
      }
      else {
        var sql = "INSERT INTO users (discord_id,username,membershipId,platform) VALUES (?,?,?,?)";
        var inserts = [discord_id, membershipData.displayName, membershipData.membershipId, membershipData.membershipType];
        sql = db.format(sql, inserts);
        db.query(sql, function(error, rows, fields) {
          if(!!error) { Log.SaveError(`Error adding player: ${ membershipData }, Error: ${ error }`); callback(true); }
          else { callback(false, true, false); }
        });
      }
    }
  });
}
function AddGuildBroadcastChannel(channel_Id, guild_id, callback) {
  var sql = "UPDATE guilds SET broadcasts_channel = ? WHERE guild_id = ?";
  var inserts = [channel_Id, guild_id];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error updating broadcasts channel for: ${ guild_id }, Error: ${ error }`); callback(true); }
    else { callback(false); }
  });
}
function AddClanToGuild(guild_id, clans, callback) {
  var sql = `UPDATE guilds SET clans="${ clans }", joinedOn = "${ new Date().getTime() }" WHERE guild_id = ?`;
  var inserts = [guild_id];
  sql = db.format(sql, inserts);
  db.query(sql, async function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error updating tracked clans for: ${ guild_id }, Error: ${ error }`); callback(true); }
    else {
      //Check if clan already exists in the tracking, if not add it.
      for(var i in clans) {
        await new Promise(resolve =>
          db.query(`SELECT * FROM clans WHERE clan_id="${ clans[i] }"`, function(error, rows, fields) {
            if(!!error) { Log.SaveError(`Error checking if clan exists: ${ clans[i] }, Error: ${ error }`); }
            else { if(rows.length === 0) { AddNewClan(clans[i]); } }
            resolve(true);
          })
        );
      }
      callback(false);
    }
  });
}
function AddNewClan(clan_id) {
  db.query(`SELECT * FROM clans WHERE clan_id="${ clan_id }"`, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error checking if clan exists: ${ clan_id }, Error: ${ error }`); }
    else {
      if(rows.length === 0) {
        var sql = `INSERT INTO clans (clan_id, joinedOn) VALUES (?, "${ new Date().getTime() }")`;
        var inserts = [clan_id];
        sql = db.format(sql, inserts);
        db.query(sql, function(error, rows, fields) {
          if(!!error) { Log.SaveError(`Error adding clan: ${ clan_id }, Error: ${ error }`); }
        });
      }
    }
  });
}
function AddNewGuild(message, clanData, callback) {
  var sql = `INSERT INTO guilds (guild_id,guild_name,owner_id,owner_avatar,clans,joinedOn) VALUES (?,?,?,?,?,"${ new Date().getTime() }")`;
  var inserts = [message.guild.id, Misc.cleanString(message.guild.name), message.author.id, message.author.avatar, clanData.id];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error adding clan: ${ clanData.id }, Error: ${ error }`); callback(true); }
    else { callback(false); }
  });
}
function AddBroadcast(broadcast) {
  var sql = "INSERT INTO broadcasts (clanId,displayName,membershipId,season,type,broadcast,count,date) VALUES (?,?,?,?,?,?,?,?)";
  var inserts = [broadcast.clanId, broadcast.displayName, broadcast.membershipId, broadcast.season, broadcast.type, broadcast.broadcast, broadcast.count, broadcast.date];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error adding new broadcast into broadcasts, Error: ${ error }`); }
    else {
      var sql = "DELETE FROM awaiting_broadcasts WHERE membershipId=? AND season=? AND broadcast=?";
      var inserts = [broadcast.membershipId, broadcast.season, broadcast.broadcast];
      sql = db.format(sql, inserts);
      db.query(sql, function(error, rows, fields) {
        if(!!error) { Log.SaveError(`Error deleteing broadcast from awaiting_broadcast, Error: ${ error }`); }
      });
    }
  });
}

//Removes
function RemoveClanBroadcastsChannel(guild_id, callback) {
  var sql = "UPDATE guilds SET broadcasts_channel = ? WHERE guild_id = ?";
  var inserts = ['null', guild_id];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error removing broadcasts channel for: ${ guild_id }, Error: ${ error }`); callback(true); }
    else { callback(false); }
  });
}
function RemoveClan(guild_id, clan_id, callback) {
  db.query(`SELECT * FROM guilds WHERE guild_id="${ guild_id }"`, async function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error removing clan: ${ clan_id } from guild: ${ guild_id }, Error: ${ error }`); callback(true); }
    else {
      var clans = rows[0].clans.split(",");
      clans.splice(clans.indexOf(clan_id), 1);
      if(clans.length > 0) {
        //If there was more than 1 clan, just remove the clan.
        db.query(`UPDATE guilds SET clans="${ clans }" WHERE guild_id="${ guild_id }"`, function(error, rows, fields) {
          if(!!error) { Log.SaveError(`Error removing clan from guild: ${ guild_id }, Error: ${ error }`); callback(true); }
          else { callback(false); }
        });
      }
      else {
        //If it was the only clan, delete the clan from database.
        db.query(`DELETE FROM guilds WHERE guild_id = "${ guild_id }"`, function(error, rows, fields) {
          if(!!error) { Log.SaveError(`Error deleting guild: ${ guild_id }, Error: ${ error }`); callback(true); }
          else { callback(false); }
        });
      }
    }
  });
}
function RemoveAwaitingBroadcast(broadcast) {
  var sql = "DELETE FROM awaiting_broadcasts WHERE membershipId=? AND season=? AND broadcast=?";
  var inserts = [broadcast.membershipId, broadcast.season, broadcast.broadcast];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error deleteing broadcast from awaiting_broadcast, Error: ${ error }`); }
    else { Log.SaveError(`Tried to duplicate entry this broadcast: (${ broadcast.clanId }) ${ broadcast.displayName } has obtained ${ broadcast.broadcast }`); }
  });
}
function RemoveAwaitingClanBroadcast(broadcast) {
  var sql = "DELETE FROM awaiting_broadcasts WHERE clanId=? AND season=? AND broadcast=?";
  var inserts = [broadcast.clanId, broadcast.season, broadcast.broadcast];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error deleteing broadcast from awaiting_broadcast, Error: ${ error }`); }
    else { Log.SaveError(`Tried to duplicate entry this broadcast: (${ broadcast.clanId }) ${ broadcast.broadcast }`); }
  });
}

//Others
function ForceFullScan(callback) {
  db.query(`UPDATE clans SET forcedScan="true" WHERE isTracking="true"`, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error trying to force a rescan, Error: ${ error }`); callback(true); }
    else {
      db.query(`UPDATE playerInfo SET firstLoad="true"`, function(error, rows, fields) {
        if(!!error) { Log.SaveError(`Error trying to force a rescan, Error: ${ error }`); callback(true); }
        else { callback(false); }
      });
    }
  });
}
function EnableWhitelist(guild_id, callback) {
  var sql = "UPDATE guilds SET enable_whitelist = ? WHERE guild_id = ?";
  var inserts = ['true', guild_id];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error enabling whitelist for: ${ clanId }, Error: ${ error }`); callback(true); }
    else { callback(false); }
  });
}
function DisableWhitelist(guild_id, callback) {
  var sql = "UPDATE guilds SET enable_whitelist = ? WHERE guild_id = ?";
  var inserts = ['false', guild_id];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error disabling whitelist for: ${ clanId }, Error: ${ error }`); callback(true); }
    else { callback(false); }
  });
}
function ToggleBlacklistFilter(guild_id, clan_data, item, callback) {
  var items = clan_data.blacklist.split(",");
  var isFiltered = true;
  console.log(items.length);
  //Check if item exists in blacklist
  if(!items.find(e => e.toUpperCase() === item.toUpperCase())) {
    //Add item to filter
    if(items[0] === "") { items = [item]; }
    else { items.push(item.toUpperCase()); }
    isFiltered = true;
    console.log(items);
  }
  else {
    //Remove item from filter
    items.splice(items.indexOf(item), 1);
    isFiltered = false;
  }
  //Update database
  var sql = `UPDATE guilds SET blacklist = "${ items }" WHERE guild_id = ?`;
  var inserts = [guild_id];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error updating blacklisted items for: ${ clanId }, Error: ${ error }`); callback(true); }
    else { callback(false, isFiltered); }
  });
}
function ToggleWhitelistFilter(guild_id, clan_data, item, callback) {
  var items = clan_data.whitelist.split(",");
  var isFiltered = true;
  //Check if item exists in blacklist
  if(!items.find(e => e.toUpperCase() === item.toUpperCase())) {
    //Add item to filter
    if(items[0] === "") { items = [item]; }
    else { items.push(item.toUpperCase()); }
    isFiltered = true;
  }
  else {
    //Remove item from filter
    items.splice(items.indexOf(item), 1);
    isFiltered = false;
  }
  //Update database
  var sql = `UPDATE guilds SET whitelist = "${ items }" WHERE guild_id = ?`;
  var inserts = [guild_id];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error updating whitelisted items for: ${ clanId }, Error: ${ error }`); callback(true); }
    else { callback(false, isFiltered); }
  });
}
function DeleteGuild(guild_id, callback) {
  var sql = `DELETE FROM guilds WHERE guild_id = ?`;
  var inserts = [guild_id];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error deleting guild: ${ guild_id }, Error: ${ error }`); callback(true); }
    else { callback(false); }
  });
}
function ReAuthClan(message, callback) {
  var sql = "UPDATE guilds SET owner_id = ?, owner_avatar = ? WHERE owner_id = ?";
  var inserts = [message.author.id, message.author.avatar, message.author.id];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error trying to reauth guild: ${ message.guild.id }, Error: ${ error }`); callback(true); }
    else { callback(false); }
  });
}
function TransferClan(message, guild_id, callback) {
  var sql = "UPDATE guilds SET owner_id = ?, owner_avatar = ? WHERE guild_id = ?";
  var inserts = [message.mentions.users.first().id, message.mentions.users.first().avatar, guild_id];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error trying to transfer clan ownership for: ${ guild_id }, Error: ${ error }`); callback(true); }
    else { callback(false); }
  });
}
function DisableTracking(guild_id) {
  db.query(`SELECT * FROM guilds WHERE guild_id="${ guild_id }"`, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error trying to find guild to disable tracking for: ${ guild_id }, Error: ${ error }`); }
    else {
      if(rows.length > 0) {
        var clans = rows[0].clans.split(",");
        db.query(`UPDATE guilds SET isTracking="false" WHERE guild_id="${ guild_id }"`, function(error, rows, fields) {
          if(!!error) { Log.SaveError(`Error trying to disable tracking for guild: ${ guild_id }, Error: ${ error }`); }
          else {
            for(var i in clans) {
              db.query(`SELECT * FROM guilds WHERE clans LIKE "%${ clans[i] }%"`, function(error, rows, fields) {
                if(!!error) { Log.SaveError(`Failed to find clan: ${ clans[i] }, Error: ${ error }`); }
                else {
                  if(rows.length === 1) {
                    db.query(`UPDATE clans SET isTracking="false" WHERE clan_id="${ clans[i] }"`, function(error, rows, fields) {
                      if(!!error) { Log.SaveError(`Failed to disable tracking for clan: ${ clans[i] }, Error: ${ error }`); }
                      else { Log.SaveLog("Clans", `Disabled tracking for ${ clans[i] } as there are no longer any more guilds tracking it.`); }
                    });
                  }
                }
              });
            }
          }
        });
      }
    }
  });
}
function EnableTracking(guild_id, callback) {
  db.query(`SELECT * FROM guilds WHERE guild_id="${ guild_id }"`, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error trying to find clan to re-enable tracking for guild: ${ guild_id }, Error: ${ error }`); callback(true); }
    else {
      if(rows.length > 0) {
        var guildInfo = rows[0];
        db.query(`UPDATE guilds SET isTracking="true" WHERE guild_id="${ guild_id }"`, function(error, rows, fields) {
          if(!!error) { Log.SaveError(`Error trying to re-enable tracking for guild: ${ guild_id }, Error: ${ error }`); callback(true); }
          else {
            var clans = guildInfo.clans.split(",");
            for(var i in clans) {
              db.query(`SELECT * FROM clans WHERE clan_id="${ clans[i] }"`, function(error, rows, fields) {
                if(!!error) { Log.SaveError(`Failed to get info for clan: ${ clans[i] }, Error: ${ error }`); }
                else {
                  if(rows.length > 0) {
                    if(rows[0].isTracking === "false") {
                      db.query(`UPDATE clans SET isTracking="true", forcedScan="true" WHERE clan_id="${ clans[i] }"`, function(error, rows, fields) {
                        if(!!error) { Log.SaveError(`Failed to enable tracking for clan: ${ clans[i] }, Error: ${ error }`); }
                        else { Log.SaveLog("Clans", `Re-Enabled tracking for ${ clans[i] } as it has returned to being tracked!`); }
                      });
                    }
                  }
                }
              });
            }
            callback(false, true);
          }
        });
      }
      else {
        callback(false, false);
      }
    }
  });
}
