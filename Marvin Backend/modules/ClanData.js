//Required Libraraies
const Log = require("../js/log.js");
const Misc = require("../js/misc.js");
const Config = require("../../Combined/configs/config.json");
const Backend_Config = require("../../Combined/configs/backend_config.json");
const fetch = require("node-fetch");
const Database = require("./Database");
var Definitions = [];
var id = 0;

//Exports
module.exports = { CheckClanMembers, GetClanMembers, GetClanDetails };

//Functions
const flagEnum = (state, value) => !!(state & value);
function GetItemState(state) { return { none: flagEnum(state, 0), notAcquired: flagEnum(state, 1), obscured: flagEnum(state, 2), invisible: flagEnum(state, 4), cannotAffordMaterialRequirements: flagEnum(state, 8), inventorySpaceUnavailable: flagEnum(state, 16), uniquenessViolation: flagEnum(state, 32), purchaseDisabled: flagEnum(state, 64) }; }
async function CheckClanMembers(trackedClan, definitions) {
  //Get current clan members.
  Definitions = definitions;
  var ClanMembers = [];
  var CurrentClanMembers = await GetClanMembers(trackedClan.clan_id);
  var ClanDetails = null;
  await Promise.all([GetClanMembers(trackedClan.clan_id), GetClanDetails(trackedClan.clan_id)]).then(function(ClanData) { CurrentClanMembers = ClanData[0]; ClanDetails = ClanData[1]; });
  if(CurrentClanMembers.includes("ClanNotFound - ")) {
    Database.RemoveClan(trackedClan.guild_id, trackedClan.clan_id);
    Log.SaveLog("Info", `${ trackedClan.clan_id } no longer exists and has been deleted or removed from the database.`);
    Log.SaveErrorCounter("ClanNotFound");
  }
  else if(CurrentClanMembers === "Error") { Log.SaveErrorCounter("unknown"); }
  else if(CurrentClanMembers === "UnhandledException") { Log.SaveErrorCounter("unknown"); }
  else if(CurrentClanMembers === "SystemDisabled") { }
  else if(CurrentClanMembers === "DestinyShardRelayProxyTimeout") { Log.SaveErrorCounter("DestinyShardRelayProxyTimeout"); }
  else if(CurrentClanMembers === "DestinyShardRelayClientTimeout") { Log.SaveErrorCounter("DestinyShardRelayClientTimeout"); }
  else if(CurrentClanMembers === "DestinyUnexpectedError") { Log.SaveErrorCounter("DestinyUnexpectedError"); }
  else if(CurrentClanMembers === "DestinyInternalError") { Log.SaveErrorCounter("DestinyInternalError"); }
  else {
    for(var i in CurrentClanMembers) {
      ClanMembers.push({
        "displayName": CurrentClanMembers[i].destinyUserInfo.displayName,
        "membership_Id": CurrentClanMembers[i].destinyUserInfo.membershipId,
        "membershipType": CurrentClanMembers[i].destinyUserInfo.membershipType,
        "membershipTypes": CurrentClanMembers[i].destinyUserInfo.applicableMembershipTypes,
        "memberType": CurrentClanMembers[i].memberType,
        "isOnline": CurrentClanMembers[i].isOnline,
        "lastOnlineStatusChange": CurrentClanMembers[i].lastOnlineStatusChange,
        "joinDate": CurrentClanMembers[i].joinDate,
        "clanId": trackedClan.clan_id
      });
    }
  }

  //Next is onto processing each players information. First we get the clan to determine some variables then process player data.
  await new Promise(resolve => Database.GetClan(trackedClan.clan_id, async function(isError, isFound, data) {
    let PreviousClanDetails = data;
    if(!isError) {
      if(isFound) {
        //Determine whether this is the first time the clan has been scanned or not, or if a forced scan was put in place.
        var MembersToScan = null;
        if(data.forcedScan === "true" || data.firstScan === "true") { MembersToScan = ClanMembers; }
        else { MembersToScan = ClanMembers.filter(e => e.isOnline === true || (new Date() - new Date(e.lastOnlineStatusChange * 1000)) < 900000); }

        //Get each players data
        for(var i in MembersToScan) {
          await GetClanMemberData(MembersToScan[i], false).then(function(response) {
            if(response.failed) {
              if(response.reason === "DestinyAccountNotFound") { } //This means the account used to be a bnet account that never transfered over. Recommend kicking these players.
              else { } //Failed for another unknown reason. Not logging.
            }
            else if(response.private) { Database.SetPrivate(response.playerInfo.membership_Id); } //This means the user was private, i should really log these accounts somewhere.
            else { ProcessPlayerData(response, MembersToScan[i].clanId, data.firstScan, data.forcedScan); } //All was successful, now onto processing that players data.
          });
        }

        //This checks for removed clan members, This takes all clan members that were in the previous scan and matches them against ones in the database, If they left or were removed from the clan
        //They have their clan tag removed in the database to prevent them from being connected with that clan, this also prevents them showing up in clan leaderboards as they are no longer associated with that clan.
        if(ClanMembers.length !== 0) { Database.CheckClanMembers(ClanMembers, trackedClan.clan_id); }

        //If that was the first time to scan or forced scan, change the value to false as we only want to scan online players to save on requests.
        if(data.firstScan === "true") { Database.UpdateClanFirstScan(trackedClan.clan_id); }
        if(data.forcedScan === "true") { Database.UpdateClanForcedScan(trackedClan.clan_id); }

        //Finally update all other clan details, including last scan time and online player count.
        if(!ClanDetails.error) { ProcessClanData(ClanDetails, PreviousClanDetails, MembersToScan); }
      }
      else {
        if(trackedClan.clan_id.length === 6 || trackedClan.clan_id.length === 7) { Database.AddNewClan(trackedClan.clan_id); }
        else { Log.SaveError(`${ trackedClan.clan_id } was not found? This uhh shouldn't happen.`); }
      }
    }
    else { Log.SaveError(`${ trackedClan.clan_id } failed to grab clan details as a server error occured.`); }
    resolve(true);
  }));

  return trackedClan.clan_id;
}
async function GetClanMembers(clan_id) {
  const headers = { headers: { "X-API-Key": Backend_Config.apiKey, "Content-Type": "application/json" } };
  const request = await fetch(`https://www.bungie.net/Platform/GroupV2/${ clan_id }/Members/?currentPage=1`, headers);
  const response = await request.json();
  if(request.ok && response.ErrorCode && response.ErrorCode === 1) { return response.Response.results; }
  else if(response.ErrorCode === 3) { return "UnhandledException"; }
  else if(response.ErrorCode === 5) { return "SystemDisabled"; }
  else if(response.ErrorCode === 686) { return `ClanNotFound - ${ clan_id }`; }
  else if(response.ErrorCode === 1618) { return "DestinyUnexpectedError"; }
  else if(response.ErrorCode === 1626) { return "DestinyInternalError"; }
  else if(response.ErrorCode === 1652) { return "DestinyShardRelayProxyTimeout"; }
  else if(response.ErrorCode === 1651) { return "DestinyShardRelayClientTimeout"; }
  else {
    if(response.ErrorCode) { Log.SaveError(`Failed to get clan members for ${ clan_id }: ${ response.ErrorCode }`); return "Error"; }
    else { Log.SaveError(`Failed to get clan members for ${ clan_id }: ${ JSON.stringify(response) }`); return "Error"; }
  }
}
async function GetClanMemberData(playerInfo, retried) {
  try {
    const headers = { headers: { "X-API-Key": Backend_Config.apiKey, "Content-Type": "application/json" } };
    const request = await fetch(`https://bungie.net/Platform/Destiny2/${ playerInfo.membershipType }/Profile/${ playerInfo.membership_Id }/?components=100,200,202,204,800,900,1100`, headers);
    const response = await request.json();
    if(request.ok && response.ErrorCode && response.ErrorCode !== 1) {
      if(!retried) { GrabClanMemberCharacterData(playerInfo, true); }
      else if(retried) { return { playerInfo, private: false, failed: true, reason: "Failed to grab account twice in a row!" }; }
    }
    else if(request.ok) {
      //Data returned successfully
      var playerData = response.Response;
      if(playerData.profile.data.dateLastPlayed !== "0001-01-01T00:00:00Z") {
        if(playerData.profileRecords.data) { return { playerInfo, playerData, private: false, failed: false }; }
        else { return { playerInfo, playerData, private: true, failed: false };  }
      }
      else { return { playerInfo, playerData, private: true, failed: false };  }
    }
    else {
      //Error, return error
      if(response.ErrorStatus !== "DestinyAccountNotFound") { console.log(`${ playerInfo.displayName }: ${ response.ErrorStatus }`); }
      return { playerInfo, private: false, failed: true, reason: response.ErrorStatus };
    }
  }
  catch (err) { return { playerInfo, private: false, failed: true, reason: `Timed out` }; }
}

//Process player data
function ProcessPlayerData(response, clanId, firstScan, forcedScan) {
  //Rankings
  const AccountInfo = GetAccountInfo(response, clanId);
  const Rankings = GetRankings(response);
  const Raids = GetRaids(response);
  const Items = GetItems(response);
  const Titles = GetTitles(response);
  const Seasonal = GetSeasonal(response);
  const Others = GetOthers(response);
  
  //Compare data
  Database.GetPlayerDetails(AccountInfo, function(isError, isFound, SQLData) {
    if(!isError) {
      if(isFound) {
        if(SQLData.firstLoad !== "true") {
          //Update details after announcing broadcasts. Toggle this is test broadcasts as they will stop updating.
          Database.UpdatePlayerDetails({ AccountInfo, Rankings, Raids, Items, Titles, Seasonal, Others }, function(isError) {
            if(isError) { var text = `Error in grabbing account information for ${ AccountInfo.displayName } (${ AccountInfo.membershipId })`; console.log(text); Log.SaveError(text); }
            else {
              //Do broadcast checks
              if(firstScan == "false" && forcedScan == "false") {
                CheckItems({ AccountInfo, Rankings, Raids, Items, Titles, Seasonal, Others }, SQLData);
                CheckTitles({ AccountInfo, Rankings, Raids, Items, Titles, Seasonal, Others }, SQLData);
              }
            }
          });
        }
        else {
          //If an account is found but results are default, then update them here without broadcasting, this usually happen if the bot crashes and never finished the creation process.
          Database.UpdatePlayerDetails({ AccountInfo, Rankings, Raids, Items, Titles, Seasonal, Others }, function(isError) {
            if(isError) { var text = `Error in grabbing account information for ${ AccountInfo.displayName } (${ AccountInfo.membershipId })`; console.log(text); Log.SaveError(text); }
          });
        }
      }
      else {
        //If no account is found it will create a default account, this is where you update the details.
        Database.UpdatePlayerDetails({ AccountInfo, Rankings, Raids, Items, Titles, Seasonal, Others }, function(isError) {
          if(isError) { var text = `Error in grabbing account information for ${ AccountInfo.displayName } (${ AccountInfo.membershipId })`; console.log(text); Log.SaveError(text); }
        });
      }
    }
  });
}
function GetAccountInfo(response, clanId) {
  let characterIds = response.playerData.profile.data.characterIds;
  let characters = response.playerData.characters.data;
  let lastPlayedCharacter = characters[characterIds[0]];
  let displayName = response.playerInfo.displayName;
  let membershipId = response.playerInfo.membership_Id;
  let isOnline = response.playerInfo.isOnline;
  let joinDate = response.playerInfo.joinDate;
  let lastPlayed = new Date(response.playerData.profile.data.dateLastPlayed).getTime();
  let dlcOwned = response.playerData.profile.data.versionsOwned;
  let highestPower = 0;
  let totalTime = 0;
  let lightLevels = [];

  for(let i in characterIds) {
    //Get users last played character
    if(new Date(characters[characterIds[i]].dateLastPlayed).getTime() > new Date(lastPlayedCharacter.dateLastPlayed).getTime()) { lastPlayedCharacter = characters[characterIds[i]]; }

    //Get users accurate light levels per character
    lightLevels.push({
      "id": characterIds[i],
      "class": Misc.GetClassName(characterIds[i].classType),
      "light": characters[characterIds[i]].light
    });

    //Get users overall playtime
    totalTime = parseInt(totalTime) + parseInt(characters[characterIds[i]].minutesPlayedTotal);
  }
    
  //Get users highest light character
  for(let i in lightLevels) { if(lightLevels[i].light > highestPower) { highestPower = lightLevels[i].light; } }

  return {
    "displayName": displayName,
    "membershipId": membershipId,
    "clanId": clanId,
    "isOnline": isOnline,
    "joinDate": joinDate,
    "lightLevels": lightLevels,
    "highestPower": highestPower,
    "totalTime": totalTime,
    "lastPlayed": lastPlayed,
    "currentClass": Misc.GetClassName(lastPlayedCharacter.classType),
    "dlcOwned": dlcOwned
  }
}
function GetRankings(response) {
  var characterIds = response.playerData.profile.data.characterIds;
  var infamy = 0; try { infamy = response.playerData.metrics.data.metrics["250859887"].objectiveProgress.progress; } catch (err) { }
  var valor = 0; try { valor = response.playerData.metrics.data.metrics["2872213304"].objectiveProgress.progress; } catch (err) { }
  var glory = 0; try { glory = response.playerData.characterProgressions.data[characterIds[0]].progressions["2679551909"].currentProgress; } catch (err) { }
  var infamyResets = response.playerData.profileRecords.data.records["3901785488"].objectives[0].progress;
  var valorResets = Math.floor(valor / 2000);
  var infamyResets = Math.floor(infamy / 15000);
  var ibKills = response.playerData.profileRecords.data.records["2023796284"].intervalObjectives[2].progress;
  var ibWins = response.playerData.profileRecords.data.records["759958308"].intervalObjectives[2].progress;
  var motesCollected = response.playerData.profileRecords.data.records["1767590660"].intervalObjectives[2].progress;

  //Trials
  var overall_trialsWins = response.playerData.metrics.data.metrics["1365664208"].objectiveProgress.progress;
  var overall_flawlessTickets = response.playerData.metrics.data.metrics["1765255052"].objectiveProgress.progress;
  var overall_finalblows = response.playerData.metrics.data.metrics["2082314848"].objectiveProgress.progress;
  var overall_postFlawlessWins = response.playerData.metrics.data.metrics["1082901574"].objectiveProgress.progress;
  var overall_lighthouseCarries = response.playerData.metrics.data.metrics["301249970"].objectiveProgress.progress;

  var weekly_trialsWins = response.playerData.metrics.data.metrics["3046315288"].objectiveProgress.progress;
  var weekly_trialsWinStreak = response.playerData.metrics.data.metrics["3787323274"].objectiveProgress.progress;
  var weekly_flawlessTickets = response.playerData.metrics.data.metrics["122451876"].objectiveProgress.progress;
  var weekly_finalblows = response.playerData.metrics.data.metrics["2091173752"].objectiveProgress.progress;
  var weekly_postFlawlessWins = response.playerData.metrics.data.metrics["2771330814"].objectiveProgress.progress;
  var weekly_lighthouseCarries = response.playerData.metrics.data.metrics["1155098170"].objectiveProgress.progress;

  var seasonal_trialsWins = response.playerData.metrics.data.metrics["2367472811"].objectiveProgress.progress;
  var seasonal_trialsWinStreak = response.playerData.metrics.data.metrics["957196641"].objectiveProgress.progress;
  var seasonal_flawlessTickets = response.playerData.metrics.data.metrics["1114483243"].objectiveProgress.progress;
  var seasonal_finalblows = response.playerData.metrics.data.metrics["3481560625"].objectiveProgress.progress;
  var seasonal_postFlawlessWins = response.playerData.metrics.data.metrics["128083325"].objectiveProgress.progress;
  var seasonal_lighthouseCarries = response.playerData.metrics.data.metrics["610393611"].objectiveProgress.progress;

  return {
    "infamy": infamy,
    "valor": valor,
    "glory": glory,
    "infamyResets": infamyResets,
    "valorResets": valorResets,
    "ibKills": ibKills,
    "ibWins": ibWins,
    "motesCollected": motesCollected,
    "trials": {
      "overall": {
        "wins": overall_trialsWins,
        "flawlessTickets": overall_flawlessTickets,
        "finalBlows": overall_finalblows,
        "postFlawlessWins": overall_postFlawlessWins,
        "carries": overall_lighthouseCarries
      },
      "seasonal": {
        "wins": seasonal_trialsWins,
        "winStreak": seasonal_trialsWinStreak,
        "flawlessTickets": seasonal_flawlessTickets,
        "finalBlows": seasonal_finalblows,
        "postFlawlessWins": seasonal_postFlawlessWins,
        "carries": seasonal_lighthouseCarries
      },
      "weekly": {
        "wins": weekly_trialsWins,
        "winStreak": weekly_trialsWinStreak,
        "flawlessTickets": weekly_flawlessTickets,
        "finalBlows": weekly_finalblows,
        "postFlawlessWins": weekly_postFlawlessWins,
        "carries": weekly_lighthouseCarries
      }
    }
  }
}
function GetRaids(response) {
  var leviCompletions = response.playerData.profileRecords.data.records["3420353827"].objectives[0].progress;
  var eowCompletions = response.playerData.profileRecords.data.records["2602370549"].objectives[0].progress;
  var sosCompletions = response.playerData.profileRecords.data.records["1742345588"].objectives[0].progress;

  var leviPresCompletions = response.playerData.profileRecords.data.records["940998165"].objectives[0].progress;
  var eowPresCompletions = response.playerData.profileRecords.data.records["3861076347"].objectives[0].progress;
  var sosPresCompletions = response.playerData.profileRecords.data.records["2923250426"].objectives[0].progress;

  var lastWishCompletions = response.playerData.profileRecords.data.records["2195455623"].objectives[0].progress;
  var scourgeCompletions = response.playerData.profileRecords.data.records["4060320345"].objectives[0].progress;
  var sorrowsCompletions = response.playerData.profileRecords.data.records["1558682421"].objectives[0].progress;
  var gardenCompletions = response.playerData.profileRecords.data.records["1120290476"].objectives[0].progress;

  //For some reason leviCompetions also count prestige completions, they need to be removed;
  leviCompletions = leviCompletions - leviPresCompletions;

  //Calulate total raids
  var totalRaids = leviCompletions + leviPresCompletions + eowCompletions + eowPresCompletions + sosCompletions + sosPresCompletions + lastWishCompletions + scourgeCompletions + sorrowsCompletions + gardenCompletions;

  return {
    "levi": { "normal": leviCompletions, "prestige": leviPresCompletions },
    "eow": { "normal": eowCompletions, "prestige": eowPresCompletions },
    "sos": { "normal": sosCompletions, "prestige": sosPresCompletions },
    "lastWish": lastWishCompletions,
    "scourge": scourgeCompletions,
    "sorrows": sorrowsCompletions,
    "garden": gardenCompletions,
    "totalRaids": totalRaids
  }
}
function GetItems(response) {
  var itemList = Definitions.filter(e => e.type === "item");
  var items = [];
  for(var i in itemList) {
    if(response.playerData.profileCollectibles.data.collectibles[itemList[i].hash]) {
      if(GetItemState(response.playerData.profileCollectibles.data.collectibles[itemList[i].hash].state).notAcquired === false) {
        items.push(itemList[i].hash);
      }
    }
  }
  return { items };
}
function GetTitles(response) {
  var titleList = Definitions.filter(e => e.type === "title");
  var titles = [];
  for(var i in titleList) {
    if(response.playerData.profileRecords.data.records[titleList[i].hash]) {
      if(response.playerData.profileRecords.data.records[titleList[i].hash].objectives[0].complete) {
        titles.push(titleList[i].hash);
      }
    }
  }
  return { titles };
}
function GetSeasonal(response) {
  //Season Ranks
  var characterIds = response.playerData.profile.data.characterIds;
  var season8Rank = "0"; try { var seasonRankBefore = response.playerData.characterProgressions.data[characterIds[0]].progressions["1628407317"].level; var seasonRankAfter = response.playerData.characterProgressions.data[characterIds[0]].progressions["3184735011"].level; season8Rank = seasonRankBefore + seasonRankAfter; } catch (err) { }
  var season9Rank = "0"; try { var seasonRankBefore = response.playerData.characterProgressions.data[characterIds[0]].progressions["3256821400"].level; var seasonRankAfter = response.playerData.characterProgressions.data[characterIds[0]].progressions["2140885848"].level; season9Rank = seasonRankBefore + seasonRankAfter; } catch (err) { }
  var season10Rank = "0"; try { var seasonRankBefore = response.playerData.characterProgressions.data[characterIds[0]].progressions["2926321498"].level; var seasonRankAfter = response.playerData.characterProgressions.data[characterIds[0]].progressions["1470619782"].level; season10Rank = seasonRankBefore + seasonRankAfter; } catch (err) { }
  var season11Rank = "0"; try { var seasonRankBefore = response.playerData.characterProgressions.data[characterIds[0]].progressions["1627914615"].level; var seasonRankAfter = response.playerData.characterProgressions.data[characterIds[0]].progressions["4021269753"].level; season11Rank = seasonRankBefore + seasonRankAfter; } catch (err) { }
  var dailyXP = "0"; try { dailyXP = response.playerData.characterProgressions.data[characterIds[0]].progressions["3810510634"].dailyProgress; } catch (err) { }
  var weeklyXP = "0"; try { weeklyXP = response.playerData.characterProgressions.data[characterIds[0]].progressions["3810510634"].weeklyProgress; } catch (err) { }
  var overallXP = "0"; try { overallXP = response.playerData.characterProgressions.data[characterIds[0]].progressions["3810510634"].currentProgress; } catch (err) { }
  var powerBonus = "0"; try { powerBonus = response.playerData.characterProgressions.data[characterIds[0]].progressions["3810510634"].level; } catch (err) { }

  //Sundial
  var sundialCompletions = response.playerData.profileRecords.data.records["3801239892"].objectives[0].progress;

  return {
    "seasonRank": season11Rank,
    "xp": { "dailyXP": dailyXP, "weeklyXP": weeklyXP, "overallXP": overallXP },
    "powerBonus": powerBonus,
    "sundial": sundialCompletions
  }
}
function GetOthers(response) {
  var characterIds = response.playerData.profile.data.characterIds;
  var menageire = response.playerData.profileRecords.data.records["1363982253"].objectives[0].progress;
  var runes = response.playerData.profileRecords.data.records["2422246600"].objectives[0].progress;
  var triumphScore = "0"; try { triumphScore = response.playerData.profileRecords.data.score; } catch (err) { }
  var wellsCompleted = "0"; try { wellsCompleted = response.playerData.profileRecords.data.records["819775261"].objectives[0].progress; } catch (err) { }
  var epsCompleted = "0"; try { epsCompleted = response.playerData.profileRecords.data.records["3350489579"].objectives[0].progress; } catch (err) { }

  //Shattered Throne
  var sT_completed = "0"; try { sT_completed = response.playerData.profileRecords.data.records["2314271318"].objectives[0].progress; } catch (err) { }
  var sT_flawless = "0"; try { sT_flawless = response.playerData.profileRecords.data.records["2029263931"].objectives[0].progress; } catch (err) { }
  var sT_solo = "0"; try { sT_solo = response.playerData.profileRecords.data.records["851701008"].objectives[0].progress; } catch (err) { }
  var sT_solo_flawless = "0"; try { sT_solo_flawless = response.playerData.profileRecords.data.records["1290451257"].objectives[0].progress; } catch (err) { }

  //Pit Of Heresy
  var pOH_completed = "0"; try { pOH_completed = response.playerData.profileRecords.data.records["3217987680"].objectives[0].progress; } catch (err) { }
  var pOH_flawless = "0"; try { pOH_flawless = response.playerData.profileRecords.data.records["3279886460"].objectives[0].progress; } catch (err) { }
  var pOH_solo = "0"; try { pOH_solo = response.playerData.profileRecords.data.records["376114010"].objectives[0].progress; } catch (err) { }
  var pOH_solo_flawless = "0"; try { pOH_solo_flawless = response.playerData.profileRecords.data.records["2615277024"].objectives[0].progress; } catch (err) { }

  //Guardian Games
  var GG_Laurels = "0"; try { GG_Laurels = response.playerData.profileRecords.data.records["379624208"].objectives[0].progress; } catch (err) { }
  var GG_Medals = "0"; try { GG_Medals = response.playerData.profileRecords.data.records["3800989613"].objectives[0].progress; } catch (err) { }
  var GG_RumbleSupers = "0"; try { GG_RumbleSupers = response.playerData.profileRecords.data.records["3672040342"].objectives[0].progress; } catch (err) { }
  var GG_Triumphs = "0"; try { GG_Triumphs = response.playerData.profileRecords.data.records["3199735617"].objectives[0].progress; } catch (err) { }

  //Lie Quest
  var lieCommQuest = { "EDZ": 0, "MOON": 0, "IO": 0 };
  try { lieCommQuest.EDZ = response.playerData.characterProgressions.data[characterIds[0]].uninstancedItemObjectives[1797229574][0].progress; } catch (err) { }
  try { lieCommQuest.MOON = response.playerData.characterProgressions.data[characterIds[0]].uninstancedItemObjectives[1797229574][1].progress; } catch (err) { }
  try { lieCommQuest.IO = response.playerData.characterProgressions.data[characterIds[0]].uninstancedItemObjectives[1797229574][2].progress; } catch (err) { }

  return {
    "menageire": menageire,
    "runes": runes,
    "triumphScore": triumphScore,
    "wellsRankings": wellsCompleted,
    "epRankings": epsCompleted,
    "shatteredThrone": { "completed": sT_completed, "flawless": sT_flawless, "solo": sT_solo, "solo_flawless": sT_solo_flawless },
    "pitOfHeresy": { "completed": pOH_completed, "flawless": pOH_flawless, "solo": pOH_solo, "solo_flawless": pOH_solo_flawless },
    "guardianGames": { "laurels": GG_Laurels, "medals": GG_Medals, "rumble_super_kills": GG_RumbleSupers, "triumphs": GG_Triumphs },
    "lieCommQuest": { "EDZ": lieCommQuest.EDZ, "MOON": lieCommQuest.MOON, "IO": lieCommQuest.IO }
  }
}

//Check for clan broadcasts
function ProcessClanData(ClanDetails, PreviousClanDetails, MembersToScan) {
  //Check clan details for changes.
  if(PreviousClanDetails.firstScan === "false") {
    CheckClanNameChange(ClanDetails, PreviousClanDetails);
    CheckClanTagChange(ClanDetails, PreviousClanDetails);
    CheckClanLevelUp(ClanDetails, PreviousClanDetails);
  }
  //Update details in database to the newest.
  Database.UpdateClanDetails(ClanDetails, MembersToScan);
}
function CheckClanNameChange(Data, SQLData) { if(Data.detail.name !== SQLData.clan_name) { SendClanBroadcast(Data, SQLData, "name_change"); } }
function CheckClanTagChange(Data, SQLData) { if(Data.detail.clanInfo.clanCallsign !== SQLData.clan_callsign) { SendClanBroadcast(Data, SQLData, "tag_change"); } }
function CheckClanLevelUp(Data, SQLData) {
  let new_clan_level = Data.detail.clanInfo.d2ClanProgressions["584850370"].level;
  if(new_clan_level !== SQLData.clan_level && new_clan_level > SQLData.clan_level) {
    if(new_clan_level === parseInt(SQLData.clan_level)+1) { SendClanBroadcast(Data, SQLData, "level_up"); }
    else { Log.SaveError(`Caught clan broadcast for ${ SQLData.clan_name } (${ SQLData.clan_id }). From Level: ${ SQLData.clan_level } to ${ new_clan_level }. We didn't send this due to the values being more than 1 level.`) }
  }
}

//Check for player broadcasts
function CheckItems(Data, SQLData) {
  if(Data.Items.items.length > 0) {
    var prevData = SQLData.items.split(',');
    var newData = Data.Items.items;
    var foundData = newData.filter(item => !prevData.includes(item));

    if(foundData.length !== 0) {
      for(var i = 0; i < foundData.length; i++) {
        var itemData = Definitions.find(e => e.hash == foundData[i]);
        if(itemData) {
          if(JSON.parse(itemData.broadcast_enabled)) {
            if(itemData.hash === "199171385") { SendBroadcast(Data, "item", itemData, Data.Raids.lastWish == 0 ? 1 : Data.Raids.lastWish); } // 1000 Voices
            else if (itemData.hash === "2220014607") { SendBroadcast(Data, "item", itemData, Data.Raids.scourge == 0 ? 1 : Data.Raids.scourge); } // Anarchy
            else if (itemData.hash === "1903459810") { SendBroadcast(Data, "item", itemData, Data.Raids.scourge); } // Always On Time
            else if (itemData.hash === "2329697053") { SendBroadcast(Data, "item", itemData, Data.Raids.sorrows == 0 ? 1 : Data.Raids.sorrows); } // Tarrabah
            else { SendBroadcast(Data, "item", itemData, -1); } //Everything else
          }
        }
      }
    }
  }
}
function CheckTitles(Data, SQLData) {
  if(Data.Titles.titles.length > 0) {
    var prevData = SQLData.titles.split(',');
    var newData = Data.Titles.titles;
    var foundData = newData.filter(item => !prevData.includes(item));
    if(foundData.length !== 0) {
      for(var i = 0; i < foundData.length; i++) {
        var titleData = Definitions.find(e => e.hash == foundData[i]);
        if(titleData) { if(JSON.parse(titleData.broadcast_enabled)) { SendBroadcast(Data, "title", titleData, -1); } }
      }
    }
  }
}

//Send broadcasts
function SendBroadcast(data, type, bData, count) {
  Database.AddNewBroadcast(data, Config.currentSeason, type, bData.name, bData.hash, count, new Date().getTime(), function(isError) {
    if(isError) { console.log("There was an error saving broadcast to awaiting_broadcasts."); }
    else {
      let BroadcastMessage = null;
      if(type === "item") { if(count === -1) { BroadcastMessage = `${ data.AccountInfo.displayName } has obtained ${ bData.name }`; } else { BroadcastMessage = `${ data.AccountInfo.displayName } has obtained ${ bData.name } in ${ count } ${ count > 1 ? "raids!" : "raid!" }` } }
      else if(type === "title") { BroadcastMessage = `${ data.AccountInfo.displayName } has obtained the ${ bData.name } title!` }
      Log.SaveLog("Clans", `[${ data.AccountInfo.clanId }]: ${ BroadcastMessage }`);
    }
  });
}
function SendClanBroadcast(Data, SQLData, type) {
  var BroadcastMessage = null;
  if(type === "name_change") { BroadcastMessage = `The clan name has been changed from ${ SQLData.clan_name } to ${ Data.detail.name }` }
  if(type === "tag_change") { BroadcastMessage = `The clan tag has been changed from ${ SQLData.clan_callsign } to ${ Data.detail.clanInfo.clanCallsign }` }
  if(type === "level_up") {
    var clanPerks = "None";

    if(Data.detail.clanInfo.d2ClanProgressions["584850370"].level === 2) {
      clanPerks = `Increased public event rewards.`;
    }
    else if(Data.detail.clanInfo.d2ClanProgressions["584850370"].level === 3) {
      clanPerks = `Increased public event rewards.\nCompleteting weekly Hawthorne bounties rewards mod components.`;
    }
    else if(Data.detail.clanInfo.d2ClanProgressions["584850370"].level === 4) {
      clanPerks = `Increased public event rewards.\nCompleteting weekly Hawthorne bounties rewards mod components.\nCompleting clan vendor challenges rewards enhancement cores.`;
    }
    else if(Data.detail.clanInfo.d2ClanProgressions["584850370"].level === 5) {
      clanPerks = `Increased public event rewards.\nCompleteting weekly Hawthorne bounties rewards mod components.\nCompleting clan vendor challenges rewards enhancement cores.\nEarn a bonus trials token when winning trials matches with clanmates.`;
    }
    else if(Data.detail.clanInfo.d2ClanProgressions["584850370"].level === 6) {
      clanPerks = `Increased public event rewards.\nCompleteting weekly Hawthorne bounties rewards mod components.\nCompleting clan vendor challenges rewards enhancement cores.\nEarn a bonus trials token when winning trials matches with clanmates.\nUnlocked an additional weekly bounty from Hawthorne.`;
    }
    BroadcastMessage = `${ SQLData.clan_name } has leveled up from level: ${ SQLData.clan_level } to ${ Data.detail.clanInfo.d2ClanProgressions["584850370"].level }\n\n**Clan Perks:**\n${ clanPerks }`;
  }
  Database.AddNewClanBroadcast(Data, SQLData, "clan", Config.currentSeason, BroadcastMessage, new Date().getTime(), function(isError) {
    if(isError) { console.log("There was an error saving broadcast to awaiting_broadcasts."); }
    else { Log.SaveLog("Clans", `[${ Data.detail.groupId }]: ${ BroadcastMessage }`); }
  });
}

//Others
async function GetClanDetails(clan_id) {
  const headers = { headers: { "X-API-Key": Backend_Config.apiKey, "Content-Type": "application/json" } };
  const request = await fetch(`https://www.bungie.net/Platform/GroupV2/${ clan_id }/`, headers);
  const response = await request.json();
  if(request.ok && response.ErrorCode && response.ErrorCode !== 1) { console.log(`Couldn't find ${ clan_id } due to ${ JSON.stringify(response) }`); return { "error": true, "reason": response } }
  else if(request.ok) { return { "error": false, "detail": response.Response.detail } }
  else { console.log(`Couldn't find ${ clan_id } due to ${ JSON.stringify(response) }`); return { "error": true, "reason": response } }
}
