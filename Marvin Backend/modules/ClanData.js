//Required Libraraies
const Discord = require('discord.js');
const Misc = require("../js/misc.js");
const Log = require("../js/log.js");
const Config = require("../data/config.json");
const fetch = require("node-fetch");
const Database = require("./Database");
var id = 0;

//Exports
module.exports = { CheckClanMembers, GetClanMembers };

//Functions
flagEnum = (state, value) => !!(state & value);
function GetItemState(state) { return { none: flagEnum(state, 0), notAcquired: flagEnum(state, 1), obscured: flagEnum(state, 2), invisible: flagEnum(state, 4), cannotAffordMaterialRequirements: flagEnum(state, 8), inventorySpaceUnavailable: flagEnum(state, 16), uniquenessViolation: flagEnum(state, 32), purchaseDisabled: flagEnum(state, 64) }; }
async function CheckClanMembers(trackedClan) {
  //Get current clan members.
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
            else if(response.private) { } //This means the user was private, i should really log these accounts somewhere.
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
        if(!ClanDetails.error) { Database.UpdateClanDetails(ClanDetails.detail, trackedClan.clan_id, MembersToScan.length); }
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
  const headers = { headers: { "X-API-Key": Config.apiKey, "Content-Type": "application/json" } };
  const request = await fetch(`https://www.bungie.net/Platform/GroupV2/${ clan_id }/Members/?currentPage=1`, headers);
  const response = await request.json();
  if(request.ok && response.ErrorCode && response.ErrorCode === 1) { return response.Response.results; }
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
    const headers = { headers: { "X-API-Key": Config.apiKey, "Content-Type": "application/json" } };
    const request = await fetch(`https://bungie.net/Platform/Destiny2/${ playerInfo.membershipType }/Profile/${ playerInfo.membership_Id }/?components=100,200,202,204,800,900`, headers);
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
  var displayName = response.playerInfo.displayName;
  var membershipId = response.playerInfo.membership_Id;
  var isOnline = response.playerInfo.isOnline;
  var joinDate = response.playerInfo.joinDate;
  var characterIds = response.playerData.profile.data.characterIds;
  var characterLight0 = 0; try { characterLight0 = response.playerData.characters.data[characterIds[0]].light } catch (err) {  }
  var characterLight1 = 0; try { characterLight1 = response.playerData.characters.data[characterIds[1]].light } catch (err) {  }
  var characterLight2 = 0; try { characterLight2 = response.playerData.characters.data[characterIds[2]].light } catch (err) {  }
  var highestPower = Math.max(characterLight0, characterLight1, characterLight2);
  var lastPlayed = new Date(response.playerData.profile.data.dateLastPlayed).getTime();
  var dlcOwned = response.playerData.profile.data.versionsOwned;
  var totalTime0 = 0; try { totalTime0 = response.playerData.characters.data[characterIds[0]].minutesPlayedTotal; } catch (err) {  }
  var totalTime1 = 0; try { totalTime1 = response.playerData.characters.data[characterIds[1]].minutesPlayedTotal; } catch (err) {  }
  var totalTime2 = 0; try { totalTime2 = response.playerData.characters.data[characterIds[2]].minutesPlayedTotal; } catch (err) {  }
  var totalTimeOverall = parseInt(totalTime0) + parseInt(totalTime1) + parseInt(totalTime2);

  return {
    "displayName": displayName,
    "membershipId": membershipId,
    "clanId": clanId,
    "isOnline": isOnline,
    "joinDate": joinDate,
    "highestCurrrentPower": highestPower,
    "totalTime": totalTimeOverall,
    "lastPlayed": lastPlayed,
    "dlcOwned": dlcOwned
  }
}
function GetRankings(response) {
  var characterIds = response.playerData.profile.data.characterIds;
  var infamy = 0; try { infamy = response.playerData.characterProgressions.data[characterIds[0]].progressions["2772425241"].currentProgress; } catch (err) { }
  var valor = 0; try { valor = response.playerData.characterProgressions.data[characterIds[0]].progressions["3882308435"].currentProgress; } catch (err) { }
  var glory = 0; try { glory = response.playerData.characterProgressions.data[characterIds[0]].progressions["2679551909"].currentProgress; } catch (err) { }
  var infamyResets = response.playerData.profileRecords.data.records["3901785488"].objectives[0].progress;
  var valorResets = response.playerData.profileRecords.data.records["2282573299"].objectives[1].progress;
  var totalInfamy = parseInt(infamy) + (parseInt('15000') * parseInt(infamyResets));
  var totalValor = parseInt(valor) + (parseInt('2000') * parseInt(valorResets));
  var ibKills = response.playerData.profileRecords.data.records["2023796284"].intervalObjectives[2].progress;
  var ibWins = response.playerData.profileRecords.data.records["759958308"].intervalObjectives[2].progress;
  var motesCollected = response.playerData.profileRecords.data.records["1767590660"].intervalObjectives[2].progress;

  return {
    "infamy": totalInfamy,
    "valor": totalValor,
    "glory": glory,
    "infamyResets": infamyResets,
    "valorResets": valorResets,
    "ibKills": ibKills,
    "ibWins": ibWins,
    "motesCollected": motesCollected
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

  return {
    "levi": { "normal": leviCompletions, "prestige": leviPresCompletions },
    "eow": { "normal": eowCompletions, "prestige": eowPresCompletions },
    "sos": { "normal": sosCompletions, "prestige": sosPresCompletions },
    "lastWish": lastWishCompletions,
    "scourge": scourgeCompletions,
    "sorrows": sorrowsCompletions,
    "garden": gardenCompletions,
  }
}
function GetItems(response) {
  var itemList = [
    { "name": "1000 Voices", "collectibleHash": 199171385 },
    { "name": "Luna Howl", "collectibleHash": 3260604718 },
    { "name": "Not Forgotten", "collectibleHash": 3260604717 },
    { "name": "Redrix Broadsword", "collectibleHash": 1111219481 },
    { "name": "Redrix Claymore", "collectibleHash": 4274523516 },
    { "name": "Breakneck", "collectibleHash": 1666039008 },
    { "name": "Mountain Top", "collectibleHash": 4047371119 },
    { "name": "Le Monarque", "collectibleHash": 3573051804 },
    { "name": "Jötunn", "collectibleHash": 3584311877 },
    { "name": "Anarchy", "collectibleHash": 2220014607 },
    { "name": "Thorn", "collectibleHash": 4009683574 },
    { "name": "Recluse", "collectibleHash": 2335550020 },
    { "name": "Last Word", "collectibleHash": 3074058273 },
    { "name": "Izanagis Burden", "collectibleHash": 24541428 },
    { "name": "Arbalest", "collectibleHash": 2036397919 },
    { "name": "Hush", "collectibleHash": 1670904512 },
    { "name": "Wendigo GL3", "collectibleHash": 3830703103 },
    { "name": "Tarrabah", "collectibleHash": 2329697053 },
    { "name": "Revoker", "collectibleHash": 3066162258 },
    { "name": "Lumina", "collectibleHash": 2924632392 },
    { "name": "Bad Juju", "collectibleHash": 4207100358 },
    { "name": "Xenophage", "collectibleHash": 1258579677 },
    { "name": "Divinity", "collectibleHash": 1988948484 },
    { "name": "Komodo-4FR", "collectibleHash": 4116184726 },
    { "name": "Python", "collectibleHash": 3972149937 },
    { "name": "Buzzard", "collectibleHash": 2011258732 },
    { "name": "Loaded Question", "collectibleHash": 3810740723 },
    { "name": "Whisper of the Worm", "collectibleHash": 3875807583 },
    { "name": "Outbreak Perfected", "collectibleHash": 2500286745 },
    { "name": "Legend of Acrius", "collectibleHash": 199171389 },
    { "name": "Oxygen SR3", "collectibleHash": 543982652 },
    { "name": "21% Delirium", "collectibleHash": 1639266456 },
    { "name": "Edgewise", "collectibleHash": 853534062 },
    { "name": "Exit Strategy", "collectibleHash": 1510655351 },
    { "name": "Randys Throwing Knife", "collectibleHash": 1303705556 },
    { "name": "Wish-Ender", "collectibleHash": 1660030044 },
    { "name": "Leviathans Breath", "collectibleHash": 3552855013 },
    { "name": "Devils Ruin", "collectibleHash": 2190071629 },
    { "name": "Bastion", "collectibleHash": 3207791447 },
    { "name": "Always on Time (Sparrow)", "collectibleHash": 1903459810 },
    { "name": "Luxurious Toast", "collectibleHash": 1866399776 }
  ];
  var items = [];
  for(var i in itemList) {
    if(GetItemState(response.playerData.profileCollectibles.data.collectibles[itemList[i].collectibleHash].state).notAcquired === false) {
      items.push(itemList[i].name)
    }
  }
  return { "items": items };
}
function GetTitles(response) {
  var titleList = [
    { "name": "Wayfarer", "recordHash": 2757681677 },
    { "name": "Dredgen", "recordHash": 3798931976 },
    { "name": "Unbroken", "recordHash": 3369119720 },
    { "name": "Chronicler", "recordHash": 1754983323 },
    { "name": "Cursebreaker", "recordHash": 1693645129 },
    { "name": "Rivensbane", "recordHash": 2182090828 },
    { "name": "Blacksmith", "recordHash": 2053985130 },
    { "name": "Reckoner", "recordHash": 1313291220 },
    { "name": "MMXIX", "recordHash": 2254764897 },
    { "name": "Shadow", "recordHash": 1883929036 },
    { "name": "Undying", "recordHash": 2707428411 },
    { "name": "Enlightened", "recordHash": 3387213440 },
    { "name": "Harbinger", "recordHash": 3793754396 },
    { "name": "Savior", "recordHash": 2460356851 }
  ];
  var titles = [];
  for(var i in titleList) { if(response.playerData.profileRecords.data.records[titleList[i].recordHash].objectives[0].complete) { titles.push(titleList[i].name) } }
  return { titles };
}
function GetSeasonal(response) {
  //Season Ranks
  var characterIds = response.playerData.profile.data.characterIds;
  var season8Rank = "0"; try { var seasonRankBefore = response.playerData.characterProgressions.data[characterIds[0]].progressions["1628407317"].level; var seasonRankAfter = response.playerData.characterProgressions.data[characterIds[0]].progressions["3184735011"].level; season8Rank = seasonRankBefore + seasonRankAfter; } catch (err) { }
  var season9Rank = "0"; try { var seasonRankBefore = response.playerData.characterProgressions.data[characterIds[0]].progressions["3256821400"].level; var seasonRankAfter = response.playerData.characterProgressions.data[characterIds[0]].progressions["2140885848"].level; season9Rank = seasonRankBefore + seasonRankAfter; } catch (err) { }
  var fractalineDonated = 0; try { fractalineDonated = response.playerData.characterProgressions.data[characterIds[0]].progressions["2480822985"].level; } catch (err) { }
  var resonance = response.playerData.profileRecords.data.records["4205106950"].objectives[0].progress;

  //Sundial
  var sundialCompletions = response.playerData.profileRecords.data.records["3801239892"].objectives[0].progress;

  return {
    "seasonRank": season9Rank,
    "sundial": sundialCompletions,
    "fractalineDonated": fractalineDonated,
    "resonance": resonance
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

  return {
    "menageire": menageire,
    "runes": runes,
    "triumphScore": triumphScore,
    "wellsRankings": wellsCompleted,
    "epRankings": epsCompleted,
    "shatteredThrone": { "completed": sT_completed, "flawless": sT_flawless, "solo": sT_solo, "solo_flawless": sT_solo_flawless },
    "pitOfHeresy": { "completed": pOH_completed, "flawless": pOH_flawless, "solo": pOH_solo, "solo_flawless": pOH_solo_flawless }
  }
}


//Player Updates
function CheckItems(Data, SQLData) {
  if(Data.Items.items.length > 0) {
    var prevData = SQLData.items.split(',');
    var newData = Data.Items.items;
    var foundData = newData.filter(item => !prevData.includes(item));

    if(foundData.length !== 0) {
      for(var i = 0; i < foundData.length; i++) {
        if(foundData[i] === "1000 Voices") { SendBroadcast(Data, "item", foundData[i], Data.Raids.lastWish); }
        else if(foundData[i] === "Anarchy" || foundData[i] === "Always on Time") { SendBroadcast(Data, "item", foundData[i], Data.Raids.scourge); }
        else if(foundData[i] === "Tarrabah") { SendBroadcast(Data, "item", foundData[i], Data.Raids.sorrows); }
        else { SendBroadcast(Data, "item", foundData[i], -1); }
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
        SendBroadcast(Data, "title", foundData[i], -1);
      }
    }
  }
}

//Send Broadcast
function SendBroadcast(data, type, broadcast, count) {
  if(Config.enableBroadcasts) {
    Database.AddNewBroadcast(data, Config.currentSeason, type, broadcast, count, new Date().getTime(), function(isError) {
      if(isError) { console.log("There was an error saving broadcast to awaiting_broadcasts."); }
      else {
        var message = null;
        if(type === "item") { if(count === -1) { message = `${ data.AccountInfo.displayName } has obtained ${ broadcast }`; } else { message = `${ data.AccountInfo.displayName } has obtained ${ broadcast } in ${ count } ${ count > 1 ? "raids!" : "raid!" }` } }
        else if(type === "title") { message = `${ data.AccountInfo.displayName } has obtained the ${ broadcast } title!` }
        Log.SaveLog("Clans", `[${ data.AccountInfo.clanId }]: ${ message }`);
      }
    });
  }
}

//Others
async function GetClanDetails(clan_id) {
  const headers = { headers: { "X-API-Key": Config.apiKey, "Content-Type": "application/json" } };
  const request = await fetch(`https://www.bungie.net/Platform/GroupV2/${ clan_id }/`, headers);
  const response = await request.json();
  if(request.ok && response.ErrorCode && response.ErrorCode !== 1) { console.log(`Couldn't find ${ clan_id } due to ${ JSON.stringify(response) }`); return { "error": true, "reason": response } }
  else if(request.ok) { return { "error": false, "detail": response.Response.detail } }
  else { console.log(`Couldn't find ${ clan_id } due to ${ JSON.stringify(response) }`); return { "error": true, "reason": response } }
}
