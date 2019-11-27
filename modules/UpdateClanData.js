//Required Libraraies
const fs = require('fs');
const Config = require("../data/config.json");
const fetch = require("node-fetch");
let Misc = require("../js/misc.js");
let Log = require("../js/log.js");
let Announcements = require("./Announcements.js");

//Modules
module.exports = UpdateClanData;

//Functions
flagEnum = (state, value) => !!(state & value);
function GetItemState(state) { return { none: flagEnum(state, 0), notAcquired: flagEnum(state, 1), obscured: flagEnum(state, 2), invisible: flagEnum(state, 4), cannotAffordMaterialRequirements: flagEnum(state, 8), inventorySpaceUnavailable: flagEnum(state, 16), uniquenessViolation: flagEnum(state, 32), purchaseDisabled: flagEnum(state, 64) }; }
function playerExists(username) { return playersInClan.some(function(el) { return el.member_name === username }); }
async function UpdateClanData(clan_id, ClanMembers, client) {
  //Set Variables
  var playerId = -1;
  var processedAccounts = 0;
  var failureCheck = false;
  var ClanData = {
    Rankings: {
      infamyRankings: [],
      valorRankings: [],
      gloryRankings: [],
      ibRankings: []
    },
    Raids: {
      lastWish: [],
      scourge: [],
      sorrows: [],
      garden: []
    },
    Events: [],
    Items: {
      itemsObtained: []
    },
    Titles: {
      titlesObtained: []
    },
    Others: {
      triumphRankings: [],
      wellsRankings: [],
      epRankings: [],
      seasonRankings: [],
      menageire: [],
      totalTime: [],
      privatePlayers: []
    }
  }

  //GrabPlayerData
  var GrabPlayerData = setInterval(async function() {
    playerId++;
    if(playerId < ClanMembers.length) {
      var processedData = processPlayerData(ClanMembers[playerId], await GrabClanMemberCharacterData(ClanMembers[playerId], playerId, "false"));
      processedAccounts++;

      //Store Data in Clan Data
      if(processedData.private) {
        //console.log(`${ processedData.playerInfo.displayName } is Private.`);
      }
      else if(processedData.failed) {
        if(processedData.reason.ErrorStatus === "DestinyAccountNotFound") {
          //console.log(`Failed: ${ processedData.playerInfo.displayName } Does not have a valid Destiny 2 account.`);
          //Log.SaveLog("Warning", `${ processedData.playerInfo.displayName } Does not have a valid Destiny 2 account.`);
        }
        else {
          //console.log(`Failed: ${ processedData.playerInfo.displayName }. Here is why: ${ JSON.stringify(processedData.reason) }`);
          if(Misc.IsJson(processedData.reason)) {
            //Log.SaveLog("Error", `${ processedData.playerInfo.displayName }. Here is why: ${ processedData.reason.ErrorStatus }`);
          }
          else {
            //Log.SaveLog("Error", `${ processedData.playerInfo.displayName }. Here is why: ${ processedData.reason }`);
          }

          failureCheck = true;
        }
      }
      else {
        //Rankings
        ClanData.Rankings.infamyRankings.push(processedData.Rankings.infamyRankings);
        ClanData.Rankings.valorRankings.push(processedData.Rankings.valorRankings);
        ClanData.Rankings.gloryRankings.push(processedData.Rankings.gloryRankings);
        ClanData.Rankings.ibRankings.push(processedData.Rankings.ibRankings);

        //Raids
        ClanData.Raids.lastWish.push(processedData.Raids.lastWish);
        ClanData.Raids.scourge.push(processedData.Raids.scourge);
        ClanData.Raids.sorrows.push(processedData.Raids.sorrows);
        ClanData.Raids.garden.push(processedData.Raids.garden);

        //Items
        for(var i in processedData.Items.itemsObtained) { ClanData.Items.itemsObtained.push(processedData.Items.itemsObtained[i]); }

        //Titles
        for(var i in processedData.Titles.titlesObtained) { ClanData.Titles.titlesObtained.push(processedData.Titles.titlesObtained[i]); }

        //Others
        ClanData.Others.menageire.push(processedData.Others.menageire);
        ClanData.Others.triumphRankings.push(processedData.Others.triumphRankings);
        ClanData.Others.seasonRankings.push(processedData.Others.seasonRankings);
        ClanData.Others.wellsRankings.push(processedData.Others.wellsRankings);
        ClanData.Others.epRankings.push(processedData.Others.epRankings);
        ClanData.Others.totalTime.push(processedData.Others.totalTime);
      }
    }
    else {
      //This will run after all the clan info has been grabbed. It will clear the interval and then write all the data to file.
      if(processedAccounts === ClanMembers.length) {
        clearInterval(GrabPlayerData);
        if(!failureCheck) { Announcements.CheckForAnnouncements(clan_id, ClanData, client); }
      }
    }
  }, 100);
}
async function GrabClanMemberCharacterData(playerInfo, playerId, retried) {
  const headers = { headers: { "X-API-Key": Config.apiKey, "Content-Type": "application/json" } };
  const request = await fetch(`https://bungie.net/Platform/Destiny2/${ playerInfo.membershipType }/Profile/${ playerInfo.membership_Id }/?components=100,200,202,204,800,900`, headers);
  try {
    const response = await request.json();
    if(request.ok && response.ErrorCode && response.ErrorCode !== 1) {
      //Error with bungie, might have sent bad headers.
      if(retried == "false") { GrabClanMemberCharacterData(playerInfo, playerId, "true"); }
      else if(retried == "true") {
        var ProcessedData = {
          playerInfo,
          private: false,
          failed: true,
          reason: "Failed to grab account twice in a row!"
        }
        return ProcessedData;
      }
    }
    else if(request.ok) {
      //Data was obtained.
      return response.Response;
    }
    else {
      //console.log(`${ playerInfo.displayName }: ${ response.ErrorStatus }`);
      var ProcessedData = {
        playerInfo,
        private: false,
        failed: true,
        reason: response
      }
      return ProcessedData;
    }
  }
  catch (err) {
    var response = `${ request.status }: ${ request.statusText }`;
    var ProcessedData = {
      playerInfo,
      private: false,
      failed: true,
      reason: response
    }
    return ProcessedData;
  }
}

function processPlayerData(playerInfo, playerData) {
  if(!playerData.failed) {
    if(Object.keys(playerData.profileRecords).length > 1) {
      var thisDate = new Date().toLocaleString();
      var characterIds = playerData.profile.data.characterIds;
      var characterLight0 = 0; try { characterLight0 = playerData.characters.data[characterIds[0]].light } catch (err) {  }
      var characterLight1 = 0; try { characterLight1 = playerData.characters.data[characterIds[1]].light } catch (err) {  }
      var characterLight2 = 0; try { characterLight2 = playerData.characters.data[characterIds[2]].light } catch (err) {  }
      var highestPower = Math.max(characterLight0, characterLight1, characterLight2);
      var lastPlayed = new Date(playerData.profile.data.dateLastPlayed).getTime();
      var dlc_Owned = playerData.profile.data.versionsOwned;
      var totalTime0 = 0; try { totalTime0 = playerData.characters.data[characterIds[0]].minutesPlayedTotal; } catch (err) {  }
      var totalTime1 = 0; try { totalTime1 = playerData.characters.data[characterIds[1]].minutesPlayedTotal; } catch (err) {  }
      var totalTime2 = 0; try { totalTime2 = playerData.characters.data[characterIds[2]].minutesPlayedTotal; } catch (err) {  }
      var totalTimeOverall = parseInt(totalTime0) + parseInt(totalTime1) + parseInt(totalTime2);
      playerInfo.displayName = playerInfo.displayName.substring(0, 24);

      var ProcessedData = {
        Rankings: {
          infamyRankings: {},
          valorRankings: {},
          gloryRankings: {},
          ibRankings: {}
        },
        Raids: {
          lastWish: {},
          scourge: {},
          sorrows: {},
          garden: {}
        },
        Events: { },
        Items: {
          itemsObtained: {}
        },
        Titles: {
          titlesObtained: {}
        },
        Others: {
          triumphRankings: {},
          wellsRankings: {},
          epRankings: {},
          seasonRankings: {},
          menageire: {},
          totalTime: {}
        },
        playerInfo,
        private: false,
        failed: false,
        reason: ""
      }

      ProcessedData.Rankings = GetRankings(playerInfo, playerData, characterIds);
      ProcessedData.Raids = GetRaids(playerInfo, playerData, characterIds);
      ProcessedData.Items = GetObtainedItems(playerInfo, playerData);
      ProcessedData.Titles = GetObtainedTitles(playerInfo, playerData);
      ProcessedData.Others = GetOthers(playerInfo, playerData, characterIds);

      return ProcessedData;
    }
    else {
      //console.log(`Private: ${ playerInfo.displayName }`);
      var ProcessedData = {
        playerInfo,
        private: true,
        failed: false,
        reason: ""
      }
      return ProcessedData;
    }
  }
  else {
    var ProcessedData = {
      playerInfo,
      private: false,
      failed: true,
      reason: playerData.reason
    }
    return ProcessedData;
  }
}

function GetRankings(playerInfo, playerData, characterIds) {
  //PvP
  var infamy = playerData.characterProgressions.data[characterIds[0]].progressions["2772425241"].currentProgress;
  var valor = playerData.characterProgressions.data[characterIds[0]].progressions["3882308435"].currentProgress;
  var glory = playerData.characterProgressions.data[characterIds[0]].progressions["2679551909"].currentProgress;
  var infamyResets = playerData.profileRecords.data.records["3901785488"].objectives[0].progress;
  var valorResets = playerData.profileRecords.data.records["510151900"].objectives[1].progress;
  var totalInfamy = parseInt(infamy) + (parseInt('15000') * parseInt(infamyResets));
  var totalValor = parseInt(valor) + (parseInt('2000') * parseInt(valorResets));
  var ibKills = playerData.profileRecords.data.records["2023796284"].intervalObjectives[2].progress;
  var ibWins = playerData.profileRecords.data.records["759958308"].intervalObjectives[2].progress;
  var motesCollected = playerData.profileRecords.data.records["1767590660"].intervalObjectives[2].progress;

  return {
    infamyRankings: { "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "infamy": totalInfamy, "resets": infamyResets, "motesCollected": motesCollected, "lastScan": new Date() },
    valorRankings: { "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "valor": totalValor, "resets": valorResets, "lastScan": new Date() },
    gloryRankings: { "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "glory": glory, "seasonAnnouncement": { "hasAnnounced": false, "season": null }, "lastScan": new Date() },
    ibRankings: { "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "ibKills": ibKills, "ibWins": ibWins, "lastScan": new Date() }
  }
}
function GetRaids(playerInfo, playerData, characterIds) {
  var lastWishCompletions = playerData.profileRecords.data.records["2195455623"].objectives[0].progress;
  var scourgeCompletions = playerData.profileRecords.data.records["4060320345"].objectives[0].progress;
  var sorrowsCompletions = playerData.profileRecords.data.records["1558682421"].objectives[0].progress;
  var gardenCompletions = playerData.profileRecords.data.records["1120290476"].objectives[0].progress;

  return {
    lastWish: { "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "completions": lastWishCompletions, "lastScan": new Date() },
    scourge: { "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "completions": scourgeCompletions, "lastScan": new Date() },
    sorrows: { "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "completions": sorrowsCompletions, "lastScan": new Date() },
    garden: { "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "completions": gardenCompletions, "lastScan": new Date() }
  }
}
function GetOthers(playerInfo, playerData, characterIds) {
  var runes = playerData.profileRecords.data.records["2422246600"].objectives[0].progress;
  var encounters = playerData.profileRecords.data.records["1363982253"].objectives[0].progress;
  var triumphScore = "0"; try { var triumphScore = playerData.profileRecords.data.score; } catch (err) {  }
  var wellsCompleted = "0"; try { var wellsCompleted = playerData.profileRecords.data.records["819775261"].objectives[0].progress; } catch (err) {  }
  var epsCompleted = "0"; try { var epsCompleted = playerData.profileRecords.data.records["3350489579"].objectives[0].progress; } catch (err) {  }
  var finishers = "0"; try { var finishers = playerData.characterRecords.data[characterIds[0]].records["630510424"].objectives[0].progress; } catch (err) {  }
  try { var totalTime0 = playerData.characters.data[characterIds[0]].minutesPlayedTotal; } catch (err) { var totalTime0 = 0; }
  try { var totalTime1 = playerData.characters.data[characterIds[1]].minutesPlayedTotal; } catch (err) { var totalTime1 = 0; }
  try { var totalTime2 = playerData.characters.data[characterIds[2]].minutesPlayedTotal; } catch (err) { var totalTime2 = 0; }
  var totalTime = "0"; totalTime = parseInt(totalTime0) + parseInt(totalTime1) + parseInt(totalTime2);
  var seasonRank = "0";
  try {
    var seasonRankBefore = playerData.characterProgressions.data[characterIds[0]].progressions["1628407317"].level;
    var seasonRankAfter = playerData.characterProgressions.data[characterIds[0]].progressions["3184735011"].level;
    seasonRank = seasonRankBefore + seasonRankAfter;
  } catch (err) { }

  return {
    menageire: { "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "encounters": encounters, "runes": runes, "lastScan": new Date() },
    triumphRankings: { "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "triumphScore": triumphScore, "lastScan": new Date() },
    seasonRankings: { "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "seasonRank": seasonRank, "finishers": finishers, "lastScan": new Date() },
    wellsRankings: { "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "wellsCompleted": wellsCompleted, "lastScan": new Date() },
    epRankings: { "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "epsCompleted": epsCompleted, "lastScan": new Date() },
    totalTime: { "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "totalTime": totalTime, "lastScan": new Date() },
  }
}
function GetObtainedItems(playerInfo, playerData) {
  var itemsObtained = [];
  var voicesState = playerData.profileCollectibles.data.collectibles["199171385"].state;
  var cerberusState = playerData.profileCollectibles.data.collectibles["564802924"].state;
  var malfeasanceState = playerData.profileCollectibles.data.collectibles["1660030045"].state;
  var lunaState = playerData.profileCollectibles.data.collectibles["3260604718"].state;
  var notForgottenState = playerData.profileCollectibles.data.collectibles["3260604717"].state;
  var broadswordState = playerData.profileCollectibles.data.collectibles["1111219481"].state;
  var claymoreState = playerData.profileCollectibles.data.collectibles["4274523516"].state;
  var breakneckState = playerData.profileCollectibles.data.collectibles["1666039008"].state;
  var mountainTopState = playerData.profileCollectibles.data.collectibles["4047371119"].state;
  var leMonarqueState = playerData.profileCollectibles.data.collectibles["3573051804"].state;
  var anarchyState = playerData.profileCollectibles.data.collectibles["2220014607"].state;
  var thornState = playerData.profileCollectibles.data.collectibles["4009683574"].state;
  var jotunnState = playerData.profileCollectibles.data.collectibles["3584311877"].state;
  var recluseState = playerData.profileCollectibles.data.collectibles["2335550020"].state;
  var lastWordState = playerData.profileCollectibles.data.collectibles["3074058273"].state;
  var izanagiState = playerData.profileCollectibles.data.collectibles["24541428"].state;
  var huckleberryState = playerData.profileCollectibles.data.collectibles["564802914"].state;
  var arbalestState = playerData.profileCollectibles.data.collectibles["2036397919"].state;
  var hushState = playerData.profileCollectibles.data.collectibles["1670904512"].state;
  var wendigoState = playerData.profileCollectibles.data.collectibles["3830703103"].state;
  var tarrabahState = playerData.profileCollectibles.data.collectibles["2329697053"].state;
  var revokerState = playerData.profileCollectibles.data.collectibles["3066162258"].state;
  var luminaState = playerData.profileCollectibles.data.collectibles["2924632392"].state;
  var badjujuState = playerData.profileCollectibles.data.collectibles["4207100358"].state;
  var xenophageState = playerData.profileCollectibles.data.collectibles["1258579677"].state;
  var divinityState = playerData.profileCollectibles.data.collectibles["1988948484"].state;

  if(GetItemState(voicesState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "item": "1000 Voices" }); }
  if(GetItemState(cerberusState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "item": "Cerberus +1" }); }
  if(GetItemState(malfeasanceState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "item": "Malfeasance" }); }
  if(GetItemState(lunaState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "item": "Luna Howl" }); }
  if(GetItemState(notForgottenState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "item": "Not Forgotten" }); }
  if(GetItemState(broadswordState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "item": "Redrix Broadsword" }); }
  if(GetItemState(claymoreState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "item": "Redrix Claymore" }); }
  if(GetItemState(breakneckState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "item": "Breakneck" }); }
  if(GetItemState(mountainTopState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "item": "Mountain Top" }); }
  if(GetItemState(leMonarqueState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "item": "Le Monarque" }); }
  if(GetItemState(anarchyState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "item": "Anarchy" }); }
  if(GetItemState(thornState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "item": "Thorn" }); }
  if(GetItemState(jotunnState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "item": "Jötunn" }); }
  if(GetItemState(recluseState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "item": "Recluse" }); }
  if(GetItemState(lastWordState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "item": "Last Word" }); }
  if(GetItemState(izanagiState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "item": "Izanagis Burden" }); }
  if(GetItemState(huckleberryState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "item": "The Huckleberry" }); }
  if(GetItemState(arbalestState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "item": "Arbalest" }); }
  if(GetItemState(hushState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "item": "Hush" }); }
  if(GetItemState(wendigoState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "item": "Wendigo GL3" }); }
  if(GetItemState(tarrabahState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "item": "Tarrabah" }); }
  if(GetItemState(revokerState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "item": "Revoker" }); }
  if(GetItemState(luminaState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "item": "Lumina" }); }
  if(GetItemState(badjujuState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "item": "Bad Juju" }); }
  if(GetItemState(xenophageState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "item": "Xenophage" }); }
  if(GetItemState(divinityState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "item": "Divinity" }); }

  return { itemsObtained };
}
function GetObtainedTitles(playerInfo, playerData) {
  var titlesObtained = [];
  var wayfarer = playerData.profileRecords.data.records["2757681677"].objectives[0].complete;
  var dredgen = playerData.profileRecords.data.records["3798931976"].objectives[0].complete;
  var unbroken = playerData.profileRecords.data.records["3369119720"].objectives[0].complete;
  var chronicler = playerData.profileRecords.data.records["1754983323"].objectives[0].complete;
  var cursebreaker = playerData.profileRecords.data.records["1693645129"].objectives[0].complete;
  var rivensbane = playerData.profileRecords.data.records["2182090828"].objectives[0].complete;
  var blacksmith = playerData.profileRecords.data.records["2053985130"].objectives[0].complete;
  var reckoner = playerData.profileRecords.data.records["1313291220"].objectives[0].complete;
  var mmxix = playerData.profileRecords.data.records["2254764897"].objectives[0].complete;
  var shadow = playerData.profileRecords.data.records["1883929036"].objectives[0].complete;
  var undying = playerData.profileRecords.data.records["2707428411"].objectives[0].complete;
  var enlightened = playerData.profileRecords.data.records["3387213440"].objectives[0].complete;
  var harbinger = playerData.profileRecords.data.records["3793754396"].objectives[0].complete;

  if(wayfarer){ titlesObtained.push({ "displayName": playerInfo.displayName, "membership_id": playerInfo.membership_Id, "title": "Wayfarer" }); }
  if(dredgen){ titlesObtained.push({ "displayName": playerInfo.displayName, "membership_id": playerInfo.membership_Id, "title": "Dredgen" }); }
  if(unbroken){ titlesObtained.push({ "displayName": playerInfo.displayName, "membership_id": playerInfo.membership_Id, "title": "Unbroken" }); }
  if(chronicler){ titlesObtained.push({ "displayName": playerInfo.displayName, "membership_id": playerInfo.membership_Id, "title": "Chronicler" }); }
  if(cursebreaker){ titlesObtained.push({ "displayName": playerInfo.displayName, "membership_id": playerInfo.membership_Id, "title": "Cursebreaker" }); }
  if(rivensbane){ titlesObtained.push({ "displayName": playerInfo.displayName, "membership_id": playerInfo.membership_Id, "title": "Rivensbane" }); }
  if(blacksmith){ titlesObtained.push({ "displayName": playerInfo.displayName, "membership_id": playerInfo.membership_Id, "title": "Blacksmith" }); }
  if(reckoner){ titlesObtained.push({ "displayName": playerInfo.displayName, "membership_id": playerInfo.membership_Id, "title": "Reckoner" }); }
  if(mmxix){ titlesObtained.push({ "displayName": playerInfo.displayName, "membership_id": playerInfo.membership_Id, "title": "MMXIX" }); }
  if(shadow){ titlesObtained.push({ "displayName": playerInfo.displayName, "membership_id": playerInfo.membership_Id, "title": "Shadow" }); }
  if(undying){ titlesObtained.push({ "displayName": playerInfo.displayName, "membership_id": playerInfo.membership_Id, "title": "Undying" }); }
  if(enlightened){ titlesObtained.push({ "displayName": playerInfo.displayName, "membership_id": playerInfo.membership_Id, "title": "Enlightened" }); }
  if(harbinger){ titlesObtained.push({ "displayName": playerInfo.displayName, "membership_id": playerInfo.membership_Id, "title": "Harbinger" }); }

  return { titlesObtained };
}
