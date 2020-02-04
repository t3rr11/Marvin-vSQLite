const MySQL = require('mysql');
const Misc = require("../js/misc.js");
const Log = require("../js/log.js");
const Config = require('../data/config.json');
const fetch = require("node-fetch");

//Exports
module.exports = {
  GetRegisteredClansFromDB, GetRegisteredUsersFromDB, GetTrackedPlayersFromDB, GetClanDetails, GetSingleClanLeaderboard, GetClanLeaderboards, GetGlobalLeaderboards, GetClanDetailsViaAuthor,
  GetGlobalDryStreak, GetFromBroadcasts, GetFromClanBroadcasts, GetClanDryStreaks,
  CheckRegistered, CheckNewBroadcast, CheckFirstBroadcast,
  AddTrackedPlayer, AddClanBroadcastsChannel, AddNewClan, AddClanToExisting, AddNewBroadcast,
  UpdateClanDetails, UpdateClanMembers, GetPlayerDetails, UpdatePlayerDetails, UpdateClanFirstScan,
  RemoveClanBroadcastsChannel, RemoveClan,
  EnableWhitelist, DisableWhitelist, ToggleWhitelistFilter, ToggleBlacklistFilter, DeleteClan, ForceFullScan, ReAuthClan, TransferClan,
  DisableTracking, EnableTracking
};

//MySQL Connection
var db = MySQL.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'marvin'
});

//Connect to MySQL
db.connect(function(error) { if(!!error) { console.log(Misc.GetReadableDateTime() + ' - ' + 'Error connecting to MySQL'); } else { console.log(Misc.GetReadableDateTime() + ' - ' + 'Connected to MySQL'); } });

//MySQL Functions

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
function CheckNewBroadcast(data, season, type, broadcast, count, date, callback) {
  var sql = "SELECT * FROM broadcasts WHERE membershipId = ? AND season = ? AND broadcast = ?";
  var inserts = [data.AccountInfo.membershipId, season, broadcast];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error finding broadcast: ${ error }`); callback(true); }
    else {
      if(rows.length > 0) { callback(false, true); }
      else { callback(false, false); }
    }
  });
}
function CheckFirstBroadcast(broadcast, callback) {
  var sql = "SELECT * FROM broadcasts WHERE broadcast = ?";
  var inserts = [broadcast];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error finding broadcast: ${ error }`); callback(true); }
    else {
      if(rows.length > 0) { callback(false, true); }
      else { callback(false, false); }
    }
  });
}

//Gets
function GetRegisteredClansFromDB(callback) {
  var buildClans = [];
  var sql = "SELECT * FROM ??";
  var inserts = ['clans'];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error querying: ${ error }`); callback(true); }
    else {
      for(var i in rows) { buildClans.push(rows[i]); }
      callback(false, buildClans);
    }
  });
  return buildClans;
}
function GetRegisteredUsersFromDB(callback) {
  var buildPlayers = [];
  var sql = "SELECT * FROM ??";
  var inserts = ['users'];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error querying: ${ error }`); callback(true); }
    else {
      for(var i in rows) {
        buildPlayers.push({
          "discord_id": rows[i].discord_id,
          "username": rows[i].username,
          "membershipId": rows[i].membershipId,
          "platform": rows[i].platform
        });
      }
      callback(false, buildPlayers);
    }
  });
}
function GetTrackedPlayersFromDB(callback) {
  var buildPlayers = [];
  var sql = "SELECT * FROM ?? WHERE clanId NOT LIKE ''";
  var inserts = ['playerInfo'];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error querying: ${ error }`); callback(true); }
    else { callback(false, rows); }
  });
}
function GetClanDetails(guild_id, clan_id, callback) {
  if(guild_id !== false) {
    var sql = "SELECT * FROM clans WHERE guild_id = ?";
    var inserts = [guild_id];
    sql = db.format(sql, inserts);
    db.query(sql, function(error, rows, fields) {
      if(!!error) { Log.SaveError(`Error getting clan details: ${ error }`); callback(true); }
      else { if(rows.length > 0) { callback(false, true, rows[0]); } else { callback(false, false); } }
    });
  }
  else {
    var sql = "SELECT * FROM clans WHERE clan_id = ?";
    var inserts = [clan_id];
    sql = db.format(sql, inserts);
    db.query(sql, function(error, rows, fields) {
      if(!!error) { Log.SaveError(`Error getting clan details: ${ error }`); callback(true); }
      else { if(rows.length > 0) { callback(false, true, rows[0]); } else { callback(false, false); } }
    });
  }
}
function GetClanDetailsViaAuthor(data, callback) {
  var sql = "SELECT * FROM clans WHERE creator_id = ? && creator_avatar = ?";
  var inserts = [data.id, data.avatar];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error getting clan details: ${ error }`); callback(true); }
    else { if(rows.length > 0) { callback(false, true, rows); } else { callback(false, false); } }
  });
}
function GetPlayerDetails(AccountInfo, callback) {
  var sql = "SELECT * FROM playerInfo WHERE membershipId = ?";
  var inserts = [AccountInfo.membershipId];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error finding player: ${ AccountInfo.membershipId } Error: ${ error }`, ); callback(true); }
    else {
      if(rows.length > 0) { callback(false, true, rows[0]); }
      else {
        var sqlu = "INSERT INTO playerInfo (clanId,displayName,membershipId,joinDate) VALUES (?,?,?,?)";
        var inserts = [AccountInfo.clanId, Misc.cleanString(AccountInfo.displayName), AccountInfo.membershipId, AccountInfo.joinDate];
        sqlu = db.format(sqlu, inserts);
        db.query(sqlu, function(error, rows, fields) {
          if(!!error) { Log.SaveError(`Failed to add member to MySQL: ${ AccountInfo.displayName } (${ AccountInfo.membershipId }), Error: ${ error }`); callback(true); }
        });
        callback(false, false);
      }
    }
  });
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
function GetSingleClanLeaderboard(clanId, callback) {
  var sql = "SELECT * FROM playerInfo WHERE clanId = ?";
  var inserts = [clanId];
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
  db.query(`SELECT * FROM playerInfo`, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error getting global leaderboards, Error: ${ error }`); callback(true); }
    else { if(rows.length > 0) { callback(false, true, rows); } else { callback(true); } }
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
function AddClanBroadcastsChannel(channel_Id, guild_id, callback) {
  var sql = "UPDATE clans SET broadcasts_channel = ? WHERE guild_id = ?";
  var inserts = [channel_Id, guild_id];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error updating broadcasts channel for: ${ guild_id }, Error: ${ error }`); callback(true); }
    else { callback(false); }
  });
}
function AddClanToExisting(guild_id, clan_ids, callback) {
  var sql = `UPDATE clans SET server_clan_ids = "${ clan_ids }", firstScan = ?, joinedOn = "${ new Date().getTime() }" WHERE guild_id = ?`;
  var inserts = ['true', guild_id];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error updating clanIds for: ${ guild_id }, Error: ${ error }`); callback(true); }
    else { callback(false); }
  });
}
function AddNewClan(message, clanData, callback) {
  var sql = `INSERT INTO clans (guild_id,creator_id,creator_avatar,clan_id,clan_name,server_clan_ids,joinedOn) VALUES (?,?,?,?,?,?,"${ new Date().getTime() }")`;
  var inserts = [message.guild.id, message.author.id, message.author.avatar, clanData.id, clanData.name, clanData.id];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error adding clan: ${ clanData.id }, Error: ${ error }`); callback(true); }
    else { callback(false); }
  });
}
function AddNewBroadcast(data, season, type, broadcast, count, date, callback) {
  var sql = "INSERT INTO broadcasts (clanId,displayName,membershipId,season,type,broadcast,count,date) VALUES (?,?,?,?,?,?,?,?)";
  var inserts = [data.AccountInfo.clanId, data.AccountInfo.displayName, data.AccountInfo.membershipId, season, type, broadcast, count, date];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error adding new broadcast, Error: ${ error }`); callback(true); }
    else { callback(false); }
  });
}

//Removes
function RemoveClanBroadcastsChannel(guild_id, callback) {
  var sql = "UPDATE clans SET broadcasts_channel = ? WHERE guild_id = ?";
  var inserts = ['null', guild_id];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error removing broadcasts channel for: ${ guild_id }, Error: ${ error }`); callback(true); }
    else { callback(false); }
  });
}
function RemoveClan(guild_id, clan_id, callback) {
  var sql = "SELECT * FROM clans WHERE guild_id = ?";
  var inserts = [guild_id];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error removing clan: ${ clan_id } from guild: ${ guild_id }, Error: ${ error }`); callback(true); }
    else {
      var server_clan_ids = rows[0].server_clan_ids.split(",");
      server_clan_ids.splice(server_clan_ids.indexOf(clan_id), 1);
      var sqlu = `UPDATE clans SET server_clan_ids= "${ server_clan_ids }" WHERE guild_id= ?`;
      var inserts = [guild_id];
      sqlu = db.format(sqlu, inserts);
      db.query(sqlu, function(error, rows, fields) {
        if(!!error) { Log.SaveError(`Error deleting clan guild: ${ guild_id }, Error: ${ error }`); callback(true); }
        else { callback(false); }
      });
    }
  });
}

//Updates
function UpdateClanDetails(Data, callback) {
  var sql = "UPDATE clans SET clan_name = ?, clan_level = ?, WHERE clan_id = ?";
  var inserts = [Data.name, Data.clanInfo.d2ClanProgressions["584850370"].level, Data.groupId];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error updating clan: ${ Data.groupId }, Error: ${ error }`); callback(true); }
    else { callback(false); }
  });
}
function UpdateClanFirstScan(guild_id, callback) {
  var sql = "SELECT * FROM clans WHERE guild_id = ?";
  var inserts = [guild_id];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error getting clan: ${ clan_id } from guild: ${ guild_id }, Error: ${ error }`); callback(true); }
    else {
      if(rows[0].firstScan === "true") {
        var sqlu = "UPDATE clans SET firstScan = ? WHERE guild_id = ?";
        var inserts = ["false", guild_id];
        sqlu = db.format(sqlu, inserts);
        db.query(sqlu, function(error, rows, fields) {
          if(!!error) { Log.SaveError(`Error setting first scan to false on guild: ${ guild_id }, Error: ${ error }`); callback(true, false); }
          else { callback(false, true); }
        });
      }
      else { callback(false, false); }
    }
  });
}
function UpdateClanMembers(ClanMembers, clanId) {
  var sql = "SELECT * FROM playerInfo WHERE clanId = ?";
  var inserts = [clanId];
  sql = db.format(sql, inserts);
  db.query(sql, async function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error getting clan players from: ${ clanId }, Error: ${ error }`); }
    else {
      for(var i in rows) {
        var playerData = rows[i];
        if(!ClanMembers.find(e => e.membership_Id === playerData.membershipId)) {
          //Double check to see if they have left the clan.
          const UpdatedClanMembers = await GetClanMembersFromAPI(clanId);
          if(!UpdatedClanMembers.error) {
            //If still can not be found, then remove player from clan tracking.
            if(!UpdatedClanMembers.members.find(e => e.membership_Id === playerData.membershipId)) {
              var displayName = playerData.displayName;
              var sqlu = "UPDATE playerInfo SET clanId = ?, firstLoad = ? WHERE membershipId = ?";
              var inserts = ['', 'true', playerData.membershipId];
              sqlu = db.format(sqlu, inserts);
              db.query(sqlu, function(error, rows, fields) {
                if(!!error) { Log.SaveError(`Error removing ${ displayName } from: ${ clanId }, Error: ${ error }`); }
                else { Log.SaveLog("Clans", `${ displayName } has left the clan: ${ clanId }`); }
              });
            }
          }
          else { Log.SaveError(`Failed to remove ${ rows[i].displayName } (${ rows[i].membershipId }) from clan: ${ clanId }, Reason: ${ UpdatedClanMembers.reason }`); }
        }
      }
    }
  });
}
function UpdatePlayerDetails(Data, callback) {
  var sql = `UPDATE playerInfo SET clanId = ?, displayName = ?, timePlayed = ?, infamy = ?, valor = ?, glory = ?, triumphScore = ?, items = "${ Data.Items.items }", titles = "${ Data.Titles.titles }", infamyResets = ?, valorResets = ?, motesCollected = ?, ibKills = ?, ibWins = ?, seasonRank = ?, sundialCompletions = ?, fractalineDonated = ?, wellsCompleted = ?, epsCompleted = ?, menageireEncounters = ?, menageireRunes = ?, joinDate = ?, lastWishCompletions = ?, scourgeCompletions = ?, sorrowsCompletions = ?, gardenCompletions = ?, lastPlayed = ?, firstLoad = ? WHERE membershipId = ?`;
  var inserts = [
    Data.AccountInfo.clanId,
    Misc.cleanString(Data.AccountInfo.displayName),
    Data.AccountInfo.totalTime,
    Data.Rankings.infamy,
    Data.Rankings.valor,
    Data.Rankings.glory,
    Data.Others.triumphScore,
    Data.Rankings.infamyResets,
    Data.Rankings.valorResets,
    Data.Rankings.motesCollected,
    Data.Rankings.ibKills,
    Data.Rankings.ibWins,
    Data.Seasonal.seasonRank,
    Data.Seasonal.sundial,
    Data.Seasonal.fractalineDonated,
    Data.Others.wellsRankings,
    Data.Others.epRankings,
    Data.Others.menageire,
    Data.Others.runes,
    Data.AccountInfo.joinDate,
    Data.Raids.lastWish,
    Data.Raids.scourge,
    Data.Raids.sorrows,
    Data.Raids.garden,
    Data.AccountInfo.lastPlayed,
    'false',
    Data.AccountInfo.membershipId
  ];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error updating player from the first scan: (${ Data.AccountInfo.membershipId }), Error: ${ error }`); callback(true); }
    else { callback(false); }
  });
}

//Others
function EnableWhitelist(guild_id, callback) {
  var sql = "UPDATE clans SET enable_whitelist = ? WHERE guild_id = ?";
  var inserts = ['true', guild_id];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error enabling whitelist for: ${ clanId }, Error: ${ error }`); callback(true); }
    else { callback(false); }
  });
}
function DisableWhitelist(guild_id, callback) {
  var sql = "UPDATE clans SET enable_whitelist = ? WHERE guild_id = ?";
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
  //Check if item exists in blacklist
  if(!items.find(e => e === item)) {
    //Add item to filter
    items.push(item);
    isFiltered = true;
  }
  else {
    //Remove item from filter
    items.splice(items.indexOf(item), 1);
    isFiltered = false;
  }
  //Update database
  var sql = `UPDATE clans SET blacklist = "${ items }" WHERE guild_id = ?`;
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
  if(!items.find(e => e === item)) {
    //Add item to filter
    items.push(item);
    isFiltered = true;
  }
  else {
    //Remove item from filter
    items.splice(items.indexOf(item), 1);
    isFiltered = false;
  }
  //Update database
  var sql = `UPDATE clans SET whitelist = "${ items }" WHERE guild_id = ?`;
  var inserts = [guild_id];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error updating whitelisted items for: ${ clanId }, Error: ${ error }`); callback(true); }
    else { callback(false, isFiltered); }
  });
}
function DeleteClan(guild_id, callback) {
  var sql = `DELETE FROM clans WHERE guild_id = ?`;
  var inserts = [guild_id];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error deleting guild: ${ guild_id }, Error: ${ error }`); callback(true); }
    else { callback(false); }
  });
}
function ForceFullScan(callback) {
  db.query(`UPDATE clans SET firstScan="true"`, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error trying to force a rescan, Error: ${ error }`); callback(true); }
    else {
      db.query(`UPDATE playerInfo SET firstLoad="true"`, function(error, rows, fields) {
        if(!!error) { Log.SaveError(`Error trying to force a rescan, Error: ${ error }`); callback(true); }
        else { callback(false); }
      });
    }
  });
}
function ReAuthClan(message, callback) {
  var sql = "UPDATE clans SET creator_id = ?, creator_avatar = ? WHERE creator_id = ?";
  var inserts = [message.author.id, message.author.avatar, message.author.id];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error trying to reauth guild: ${ message.guild.id }, Error: ${ error }`); callback(true); }
    else { callback(false); }
  });
}
function TransferClan(message, guild_id, callback) {
  var sql = "UPDATE clans SET creator_id = ?, creator_avatar = ? WHERE guild_id = ?";
  var inserts = [message.mentions.users.first().id, message.mentions.users.first().avatar, guild_id];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error trying to transfer clan ownership for: ${ guild_id }, Error: ${ error }`); callback(true); }
    else { callback(false); }
  });
}
function DisableTracking(guild_id) {
  var sql = "UPDATE clans SET isTracking = ? WHERE guild_id = ?";
  var inserts = ["false", guild_id];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error trying to disable tracking for guild: ${ guild_id }, Error: ${ error }`); }
  });
}
function EnableTracking(guild_id, callback) {
  var sql = "SELECT * FROM clans WHERE guild_id = ?";
  var inserts = [guild_id];
  sql = db.format(sql, inserts);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error trying to find clan to re-enable tracking for guild: ${ guild_id }, Error: ${ error }`); callback(true); }
    else {
      if(rows.length > 0) {
        var sql = "UPDATE clans SET isTracking = ? WHERE guild_id = ?";
        var inserts = ["true", guild_id];
        sql = db.format(sql, inserts);
        db.query(sql, function(error, rows, fields) {
          if(!!error) { Log.SaveError(`Error trying to re-enable tracking for guild: ${ guild_id }, Error: ${ error }`); callback(true); }
          else { callback(false, true); }
        });
      }
      else {
        callback(false, false);
      }
    }
  });
}

//Non database functions
async function GetClanMembersFromAPI(clan_id) {
  const headers = { headers: { "X-API-Key": Config.apiKey, "Content-Type": "application/json" } };
  const request = await fetch(`https://www.bungie.net/Platform/GroupV2/${ clan_id }/Members/?currentPage=1`, headers);
  const response = await request.json();
  if(request.ok && response.ErrorCode && response.ErrorCode !== 1) {
    //Error with bungie, might have sent bad headers.
    console.log(`Error: ${ JSON.stringify(response) }`);
    return { 'error': true, 'reason': response };
  }
  else if(request.ok) {
    //Everything is ok, request was returned to sender.
    return { 'error': false, 'members': response.Response.results };
  }
  else {
    //Error in request ahhhhh!
    console.log(`Error: ${ JSON.stringify(response) }`);
    return { 'error': true, 'reason': response };
  }
}
