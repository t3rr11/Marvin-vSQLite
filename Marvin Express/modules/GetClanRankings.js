//Express
const { db } = require("./Database");
const Log = require("../js/log.js");
const fetch = require("node-fetch");

async function GetClanRankings(req, res, name, url) {
  Log.SaveLog("Request", `GET Request to: ${ name }`);
  db.query("SELECT * FROM clans WHERE isTracking='true'", function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error: ${ error }`); res.status(200).send({ error: "Failed" }); }
    else {
      const clans = rows;
      db.query("SELECT * FROM playerInfo", function(error, rows, fields) {
        if(!!error) { Log.SaveError(`Error: ${ error }`); res.status(200).send({ error: "Failed" }); }
        else {
          var clanLeaderboards = [];
          for(var i in clans) {
            //Ignore non-tracked clans
            if(!clanLeaderboards.find(e => e.clan_id === clans[i].clan_id)) {
            var totalTimePlayed = 0;
            var totalTriumphScore = 0;
            var totalibKills = 0;
            var totalibWins = 0;
            var totalSundialCompletions = 0;
            var totalWellsCompleted = 0;
            var totalMenageire = 0;
            var totalLeviCompletions = 0;
            var totalEowCompletions = 0;
            var totalSosCompletions = 0;
            var totalLastWishCompletions = 0;
            var totalScourgeCompletions = 0;
            var totalSorrowsCompletions = 0;
            var totalGardenCompletions = 0;
            var totalRaidCompletions = 0;
            var totalSeasonRanks = 0;
            var totalFractaline = 0;
            var totalResonance = 0;
              //Scan each player add to respective clans
              for(var j in rows) {
                if(rows[j].clanId === clans[i].clan_id) {
                  totalTimePlayed = totalTimePlayed + rows[j].timePlayed;
                  totalTriumphScore = totalTriumphScore + rows[j].triumphScore;
                  totalibKills = totalibKills + rows[j].ibKills;
                  totalibWins = totalibWins + rows[j].ibWins;
                  totalSundialCompletions = totalSundialCompletions + rows[j].sundialCompletions;
                  totalWellsCompleted = totalWellsCompleted + rows[j].wellsCompleted;
                  totalMenageire = totalMenageire + rows[j].menageireEncounters;
                  totalLeviCompletions = totalLeviCompletions + ( rows[j].leviCompletions + rows[j].leviPresCompletions );
                  totalEowCompletions = totalEowCompletions + ( rows[j].eowCompletions + rows[j].eowPresCompletions );
                  totalSosCompletions = totalSosCompletions + ( rows[j].sosCompletions + rows[j].sosPresCompletions );
                  totalLastWishCompletions = totalLastWishCompletions + rows[j].lastWishCompletions;
                  totalScourgeCompletions = totalScourgeCompletions + rows[j].scourgeCompletions;
                  totalSorrowsCompletions = totalSorrowsCompletions + rows[j].sorrowsCompletions;
                  totalGardenCompletions = totalGardenCompletions + rows[j].gardenCompletions;
                  totalSeasonRanks = totalSeasonRanks + rows[j].seasonRank;
                  totalFractaline = totalFractaline + rows[j].fractalineDonated;
                  totalResonance = totalResonance + (rows[j].resonance+2);
                }
              }
              //Finally save all that data
              clanLeaderboards.push({
                "clan_id": clans[i].clan_id,
                "clan_name": clans[i].clan_name,
                "data": {
                  "timePlayed": totalTimePlayed,
                  "triumphScore": totalTriumphScore,
                  "ibKills": totalibKills,
                  "ibWins": totalibWins,
                  "sundial": totalSundialCompletions,
                  "wells": totalWellsCompleted,
                  "menageire": totalMenageire,
                  "leviCompletions": totalLeviCompletions,
                  "eowCompletions": totalEowCompletions,
                  "sosCompletions": totalSosCompletions,
                  "lwCompletions": totalLastWishCompletions,
                  "scourgeCompletions": totalScourgeCompletions,
                  "sorrowsCompletions": totalSorrowsCompletions,
                  "gardenCompletions": totalGardenCompletions,
                  "totalRaids": (totalLeviCompletions + totalEowCompletions + totalSosCompletions + totalLastWishCompletions + totalScourgeCompletions + totalSorrowsCompletions + totalGardenCompletions),
                  "seasonRanks": totalSeasonRanks,
                  "fractalineDonated": totalFractaline,
                  "resonance": totalResonance
                }
              });
            }
          }
          res.status(200).send({ error: null, data: clanLeaderboards })
        }
      });
    }
  });
}

module.exports = GetClanRankings;