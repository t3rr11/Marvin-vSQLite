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
            else { ProcessPlayerData(response, MembersToScan[i].clanId); } //All was successful, now onto processing that players data.
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

function ProcessPlayerData(response, clanId) {
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
              CheckItems({ AccountInfo, Rankings, Raids, Items, Titles, Seasonal, Others }, SQLData);
              CheckTitles({ AccountInfo, Rankings, Raids, Items, Titles, Seasonal, Others }, SQLData);
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
  var infamy = response.playerData.characterProgressions.data[characterIds[0]].progressions["2772425241"].currentProgress;
  var valor = response.playerData.characterProgressions.data[characterIds[0]].progressions["3882308435"].currentProgress;
  var glory = response.playerData.characterProgressions.data[characterIds[0]].progressions["2679551909"].currentProgress;
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
  var items = [];

  var voicesState = response.playerData.profileCollectibles.data.collectibles["199171385"].state;
  var malfeasanceState = response.playerData.profileCollectibles.data.collectibles["1660030045"].state;
  var lunaState = response.playerData.profileCollectibles.data.collectibles["3260604718"].state;
  var notForgottenState = response.playerData.profileCollectibles.data.collectibles["3260604717"].state;
  var broadswordState = response.playerData.profileCollectibles.data.collectibles["1111219481"].state;
  var claymoreState = response.playerData.profileCollectibles.data.collectibles["4274523516"].state;
  var breakneckState = response.playerData.profileCollectibles.data.collectibles["1666039008"].state;
  var mountainTopState = response.playerData.profileCollectibles.data.collectibles["4047371119"].state;
  var leMonarqueState = response.playerData.profileCollectibles.data.collectibles["3573051804"].state;
  var jotunnState = response.playerData.profileCollectibles.data.collectibles["3584311877"].state;
  var anarchyState = response.playerData.profileCollectibles.data.collectibles["2220014607"].state;
  var thornState = response.playerData.profileCollectibles.data.collectibles["4009683574"].state;
  var recluseState = response.playerData.profileCollectibles.data.collectibles["2335550020"].state;
  var lastWordState = response.playerData.profileCollectibles.data.collectibles["3074058273"].state;
  var izanagiState = response.playerData.profileCollectibles.data.collectibles["24541428"].state;
  var arbalestState = response.playerData.profileCollectibles.data.collectibles["2036397919"].state;
  var hushState = response.playerData.profileCollectibles.data.collectibles["1670904512"].state;
  var wendigoState = response.playerData.profileCollectibles.data.collectibles["3830703103"].state;
  var tarrabahState = response.playerData.profileCollectibles.data.collectibles["2329697053"].state;
  var revokerState = response.playerData.profileCollectibles.data.collectibles["3066162258"].state;
  var luminaState = response.playerData.profileCollectibles.data.collectibles["2924632392"].state;
  var badjujuState = response.playerData.profileCollectibles.data.collectibles["4207100358"].state;
  var xenophageState = response.playerData.profileCollectibles.data.collectibles["1258579677"].state;
  var divinityState = response.playerData.profileCollectibles.data.collectibles["1988948484"].state;
  var komodo4FRState = response.playerData.profileCollectibles.data.collectibles["4116184726"].state;
  var pythonState = response.playerData.profileCollectibles.data.collectibles["3972149937"].state;
  var buzzardState = response.playerData.profileCollectibles.data.collectibles["2011258732"].state;
  var loadedQuestionState = response.playerData.profileCollectibles.data.collectibles["3810740723"].state;
  var whisperState = response.playerData.profileCollectibles.data.collectibles["3875807583"].state;
  var outbreakState = response.playerData.profileCollectibles.data.collectibles["2500286745"].state;
  var acriusState = response.playerData.profileCollectibles.data.collectibles["199171389"].state;
  var oxygenState = response.playerData.profileCollectibles.data.collectibles["543982652"].state;
  var deliriumState = response.playerData.profileCollectibles.data.collectibles["1639266456"].state;
  var edgewiseState = response.playerData.profileCollectibles.data.collectibles["853534062"].state;
  var exitStrategyState = response.playerData.profileCollectibles.data.collectibles["1510655351"].state;
  var randyState = response.playerData.profileCollectibles.data.collectibles["1303705556"].state;
  var wishEnderState = response.playerData.profileCollectibles.data.collectibles["1660030044"].state;
  var leviBreathState = response.playerData.profileCollectibles.data.collectibles["3552855013"].state;
  var devilsRuinState = response.playerData.profileCollectibles.data.collectibles["2190071629"].state;
  var bastionState = response.playerData.profileCollectibles.data.collectibles["3207791447"].state;
  var alwaysOnTimeState = response.playerData.profileCollectibles.data.collectibles["1903459810"].state;
  var luxuriousToast = response.playerData.profileCollectibles.data.collectibles["1866399776"].state;

  if(GetItemState(voicesState).notAcquired == false){ items.push("1000 Voices"); }
  if(GetItemState(lunaState).notAcquired == false){ items.push("Luna Howl"); }
  if(GetItemState(notForgottenState).notAcquired == false){ items.push("Not Forgotten"); }
  if(GetItemState(broadswordState).notAcquired == false){ items.push("Redrix Broadsword"); }
  if(GetItemState(claymoreState).notAcquired == false){ items.push("Redrix Claymore"); }
  if(GetItemState(breakneckState).notAcquired == false){ items.push("Breakneck"); }
  if(GetItemState(mountainTopState).notAcquired == false){ items.push("Mountain Top"); }
  if(GetItemState(leMonarqueState).notAcquired == false){ items.push("Le Monarque"); }
  if(GetItemState(anarchyState).notAcquired == false){ items.push("Anarchy"); }
  if(GetItemState(alwaysOnTimeState).notAcquired == false){ items.push("Always on Time (Sparrow)"); }
  if(GetItemState(thornState).notAcquired == false){ items.push("Thorn"); }
  if(GetItemState(jotunnState).notAcquired == false){ items.push("Jötunn"); }
  if(GetItemState(recluseState).notAcquired == false){ items.push("Recluse"); }
  if(GetItemState(lastWordState).notAcquired == false){ items.push("Last Word"); }
  if(GetItemState(izanagiState).notAcquired == false){ items.push("Izanagis Burden"); }
  if(GetItemState(arbalestState).notAcquired == false){ items.push("Arbalest"); }
  if(GetItemState(hushState).notAcquired == false){ items.push("Hush"); }
  if(GetItemState(wendigoState).notAcquired == false){ items.push("Wendigo GL3"); }
  if(GetItemState(tarrabahState).notAcquired == false){ items.push("Tarrabah"); }
  if(GetItemState(revokerState).notAcquired == false){ items.push("Revoker"); }
  if(GetItemState(luminaState).notAcquired == false){ items.push("Lumina"); }
  if(GetItemState(badjujuState).notAcquired == false){ items.push("Bad Juju"); }
  if(GetItemState(xenophageState).notAcquired == false){ items.push("Xenophage"); }
  if(GetItemState(divinityState).notAcquired == false){ items.push("Divinity"); }
  if(GetItemState(komodo4FRState).notAcquired == false){ items.push("Komodo-4FR"); }
  if(GetItemState(pythonState).notAcquired == false){ items.push("Python"); }
  if(GetItemState(buzzardState).notAcquired == false){ items.push("Buzzard"); }
  if(GetItemState(loadedQuestionState).notAcquired == false){ items.push("Loaded Question"); }
  if(GetItemState(whisperState).notAcquired == false){ items.push("Whisper of the Worm"); }
  if(GetItemState(outbreakState).notAcquired == false){ items.push("Outbreak Perfected"); }
  if(GetItemState(acriusState).notAcquired == false){ items.push("Legend of Acrius"); }
  if(GetItemState(oxygenState).notAcquired == false){ items.push("Oxygen SR3"); }
  if(GetItemState(deliriumState).notAcquired == false){ items.push("21% Delirium"); }
  if(GetItemState(edgewiseState).notAcquired == false){ items.push("Edgewise"); }
  if(GetItemState(exitStrategyState).notAcquired == false){ items.push("Exit Strategy"); }
  if(GetItemState(randyState).notAcquired == false){ items.push("Randys Throwing Knife"); }
  if(GetItemState(wishEnderState).notAcquired == false){ items.push("Wish-Ender"); }
  if(GetItemState(leviBreathState).notAcquired == false){ items.push("Leviathans Breath"); }
  if(GetItemState(devilsRuinState).notAcquired == false){ items.push("Devils Ruin"); }
  if(GetItemState(bastionState).notAcquired == false){ items.push("Bastion"); }
  if(GetItemState(luxuriousToast).notAcquired == false){ items.push("Luxurious Toast"); }

  return {
    "items": items
  };
}
function GetTitles(response) {
  var titles = [];

  var wayfarer = response.playerData.profileRecords.data.records["2757681677"].objectives[0].complete;
  var dredgen = response.playerData.profileRecords.data.records["3798931976"].objectives[0].complete;
  var unbroken = response.playerData.profileRecords.data.records["3369119720"].objectives[0].complete;
  var chronicler = response.playerData.profileRecords.data.records["1754983323"].objectives[0].complete;
  var cursebreaker = response.playerData.profileRecords.data.records["1693645129"].objectives[0].complete;
  var rivensbane = response.playerData.profileRecords.data.records["2182090828"].objectives[0].complete;
  var blacksmith = response.playerData.profileRecords.data.records["2053985130"].objectives[0].complete;
  var reckoner = response.playerData.profileRecords.data.records["1313291220"].objectives[0].complete;
  var mmxix = response.playerData.profileRecords.data.records["2254764897"].objectives[0].complete;
  var shadow = response.playerData.profileRecords.data.records["1883929036"].objectives[0].complete;
  var undying = response.playerData.profileRecords.data.records["2707428411"].objectives[0].complete;
  var enlightened = response.playerData.profileRecords.data.records["3387213440"].objectives[0].complete;
  var harbinger = response.playerData.profileRecords.data.records["3793754396"].objectives[0].complete;
  var savior = response.playerData.profileRecords.data.records["2460356851"].objectives[0].complete;

  if(wayfarer){ titles.push("Wayfarer"); }
  if(dredgen){ titles.push("Dredgen"); }
  if(unbroken){ titles.push("Unbroken"); }
  if(chronicler){ titles.push("Chronicler"); }
  if(cursebreaker){ titles.push("Cursebreaker"); }
  if(rivensbane){ titles.push("Rivensbane"); }
  if(blacksmith){ titles.push("Blacksmith"); }
  if(reckoner){ titles.push("Reckoner"); }
  if(mmxix){ titles.push("MMXIX"); }
  if(shadow){ titles.push("Shadow"); }
  if(undying){ titles.push("Undying"); }
  if(enlightened){ titles.push("Enlightened"); }
  if(harbinger){ titles.push("Harbinger"); }
  if(savior){ titles.push("Savior"); }

  return { titles };
}
function GetSeasonal(response) {
  //Season Ranks
  var characterIds = response.playerData.profile.data.characterIds;
  var season8Rank = "0"; try { var seasonRankBefore = response.playerData.characterProgressions.data[characterIds[0]].progressions["1628407317"].level; var seasonRankAfter = response.playerData.characterProgressions.data[characterIds[0]].progressions["3184735011"].level; season8Rank = seasonRankBefore + seasonRankAfter; } catch (err) { }
  var season9Rank = "0"; try { var seasonRankBefore = response.playerData.characterProgressions.data[characterIds[0]].progressions["3256821400"].level; var seasonRankAfter = response.playerData.characterProgressions.data[characterIds[0]].progressions["2140885848"].level; season9Rank = seasonRankBefore + seasonRankAfter; } catch (err) { }
  var fractalineDonated = 0; try { var fractalineDonated = response.playerData.characterProgressions.data[characterIds[0]].progressions["2480822985"].level; } catch (err) { }
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
  var triumphScore = "0"; try { var triumphScore = response.playerData.profileRecords.data.score; } catch (err) {  }
  var wellsCompleted = "0"; try { var wellsCompleted = response.playerData.profileRecords.data.records["819775261"].objectives[0].progress; } catch (err) {  }
  var epsCompleted = "0"; try { var epsCompleted = response.playerData.profileRecords.data.records["3350489579"].objectives[0].progress; } catch (err) {  }

  return {
    "menageire": menageire,
    "runes": runes,
    "triumphScore": triumphScore,
    "wellsRankings": wellsCompleted,
    "epRankings": epsCompleted,
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
