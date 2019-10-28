//Required Libraraies
const fs = require('fs');
const Config = require("../data/config.json");
const fetch = require("node-fetch");
let Misc = require("../js/misc.js");
let Log = require("../js/log.js");

//Modules
module.exports = UpdateClanData;

//Functions
flagEnum = (state, value) => !!(state & value);
function GetItemState(state) { return { none: flagEnum(state, 0), notAcquired: flagEnum(state, 1), obscured: flagEnum(state, 2), invisible: flagEnum(state, 4), cannotAffordMaterialRequirements: flagEnum(state, 8), inventorySpaceUnavailable: flagEnum(state, 16), uniquenessViolation: flagEnum(state, 32), purchaseDisabled: flagEnum(state, 64) }; }
function playerExists(username) { return playersInClan.some(function(el) { return el.member_name === username }); }
function extend(obj, src) {
    for (var key in src) {
        if (src.hasOwnProperty(key)) obj[key] = src[key];
    }
    return obj;
}
function UpdateClanData(clan_id, ClanMembers) {
  //Set Variables
  var playerId = -1;
  var processedAccounts = 0;
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
      privatePlayers: []
    }
  }

  //GrabPlayerData
  var GrabPlayerData = setInterval(async function() {
    playerId++;
    if(playerId < ClanMembers.length-1) { //
      var processedData = processPlayerData(ClanMembers[playerId], await GrabClanMemberCharacterData(ClanMembers[playerId], playerId, "false"));
      processedAccounts++;

      //Store Data in Clan Data
      if(processedData === "Private") { ClanData.Others.privatePlayers.push(ClanMembers[playerId]); }
      else if(processedData === "Failed") {  }
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
      }
    }
    else {
      //This will run after all the clan info has been grabbed. It will clear the interval and then write all the data to file.
      if(processedAccounts === ClanMembers.length-1) {
        clearInterval(GrabPlayerData);
        SaveToFile(clan_id, ClanData);
      }
    }
  }, 200);
}
async function GrabClanMemberCharacterData(playerInfo, playerId, retried) {
  try {
    const headers = { headers: { "X-API-Key": Config.apiKey, "Content-Type": "application/json" } };
    const request = await fetch(`https://bungie.net/Platform/Destiny2/${ playerInfo.membershipType }/Profile/${ playerInfo.membership_Id }/?components=100,200,202,204,800,900`, headers);
    const response = await request.json();
    if(request.ok && response.ErrorCode && response.ErrorCode !== 1) {
      //Error with bungie, might have sent bad headers.
      if(retried == "false") { GrabClanMemberCharacterData(playerInfo, playerId, "true"); }
      else if(retried == "true") { return "Failed"; }
    }
    else if(request.ok) {
      //Data was obtained.
      return response.Response;
    }
    else {
      console.log(`${ ClanMembers[playerId].displayName }: ${ response.ErrorStatus }`);
      return "Failed";
    }
  }
  catch (err) { return "Failed"; }
}

function processPlayerData(playerInfo, playerData) {
  if(playerData !== "Failed") {
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
          menageire: {}
        }
      }

      ProcessedData.Rankings = GetRankings(playerInfo, playerData, characterIds);
      ProcessedData.Raids = GetRaids(playerInfo, playerData, characterIds);
      ProcessedData.Items = GetObtainedItems(playerInfo, playerData);
      ProcessedData.Titles = GetObtainedTitles(playerInfo, playerData);
      ProcessedData.Others = GetOthers(playerInfo, playerData, characterIds);

      return ProcessedData;
    }
    else { return "Private" }
  }
  else { return "Failed" }
}

function GetRankings(playerInfo, playerData, characterIds) {
  //PvP
  var infamy = playerData.characterProgressions.data[characterIds[0]].progressions["2772425241"].currentProgress;
  var valor = playerData.characterProgressions.data[characterIds[0]].progressions["3882308435"].currentProgress;
  var glory = playerData.characterProgressions.data[characterIds[0]].progressions["2679551909"].currentProgress;
  var infamyResets = playerData.profileRecords.data.records["3901785488"].objectives[0].progress;
  var valorResets = playerData.characterRecords.data[characterIds[0]].records["510151900"].objectives[1].progress;
  var totalInfamy = parseInt(infamy) + (parseInt('15000') * parseInt(infamyResets));
  var totalValor = parseInt(valor) + (parseInt('2000') * parseInt(valorResets));
  var ibKills = playerData.profileRecords.data.records["2023796284"].intervalObjectives[2].progress;
  var ibWins = playerData.profileRecords.data.records["759958308"].intervalObjectives[2].progress;
  var motesCollected = playerData.profileRecords.data.records["1767590660"].intervalObjectives[2].progress;

  return {
    infamyRankings: { "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "infamy": totalInfamy, "resets": infamyResets, "motesCollected": motesCollected, "lastScan": new Date() },
    valorRankings: { "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "valor": totalValor, "resets": valorResets, "lastScan": new Date() },
    gloryRankings: { "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "glory": glory, "lastScan": new Date() },
    ibRankings: { "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "ibKills": ibKills, "ibWins": ibWins, "lastScan": new Date() }
  }
}
function GetRaids(playerInfo, playerData, characterIds) {
  var lastWishCompletions = playerData.profileRecords.data.records["2195455623"].objectives[0].progress;
  var scourgeCompletions = playerData.profileRecords.data.records["4060320345"].objectives[0].progress;
  var sorrowsCompletions = playerData.profileRecords.data.records["1558682421"].objectives[0].progress;
  var gardenCompletions = playerData.characterRecords.data[characterIds[0]].records["1120290476"].objectives[0].progress;

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
  var seasonRank = "0"; try { var seasonRank = playerData.characterRecords.data[characterIds[0]].records["684525211"].intervalObjectives[3].progress; } catch (err) {  }
  var finishers = "0"; try { var finishers = playerData.characterRecords.data[characterIds[0]].records["630510424"].objectives[0].progress; } catch (err) {  }

  return {
    menageire: { "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_Id, "encounters": encounters, "runes": runes, "lastScan": new Date() },
    triumphRankings: { "displayName": playerInfo.displayName, "membership_id": playerInfo.membership_Id, "triumphScore": triumphScore, "lastScan": new Date() },
    seasonRankings: { "displayName": playerInfo.displayName, "membership_id": playerInfo.membership_Id, "seasonRank": seasonRank, "finishers": finishers, "lastScan": new Date() },
    wellsRankings: { "displayName": playerInfo.displayName, "membership_id": playerInfo.membership_Id, "wellsCompleted": wellsCompleted, "lastScan": new Date() },
    epRankings: { "displayName": playerInfo.displayName, "membership_id": playerInfo.membership_Id, "epsCompleted": epsCompleted, "lastScan": new Date() },
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

  if(GetItemState(voicesState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_id, "item": "1000 Voices" }); }
  if(GetItemState(cerberusState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_id, "item": "Cerberus +1" }); }
  if(GetItemState(malfeasanceState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_id, "item": "Malfeasance" }); }
  if(GetItemState(lunaState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_id, "item": "Luna Howl" }); }
  if(GetItemState(notForgottenState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_id, "item": "Not Forgotten" }); }
  if(GetItemState(broadswordState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_id, "item": "Redrix Broadsword" }); }
  if(GetItemState(claymoreState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_id, "item": "Redrix Claymore" }); }
  if(GetItemState(breakneckState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_id, "item": "Breakneck" }); }
  if(GetItemState(mountainTopState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_id, "item": "Mountain Top" }); }
  if(GetItemState(leMonarqueState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_id, "item": "Le Monarque" }); }
  if(GetItemState(anarchyState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_id, "item": "Anarchy" }); }
  if(GetItemState(thornState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_id, "item": "Thorn" }); }
  if(GetItemState(jotunnState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_id, "item": "Jötunn" }); }
  if(GetItemState(recluseState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_id, "item": "Recluse" }); }
  if(GetItemState(lastWordState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_id, "item": "Last Word" }); }
  if(GetItemState(izanagiState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_id, "item": "Izanagis Burden" }); }
  if(GetItemState(huckleberryState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_id, "item": "The Huckleberry" }); }
  if(GetItemState(arbalestState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_id, "item": "Arbalest" }); }
  if(GetItemState(hushState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_id, "item": "Hush" }); }
  if(GetItemState(wendigoState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_id, "item": "Wendigo GL3" }); }
  if(GetItemState(tarrabahState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_id, "item": "Tarrabah" }); }
  if(GetItemState(revokerState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_id, "item": "Revoker" }); }
  if(GetItemState(luminaState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_id, "item": "Lumina" }); }
  if(GetItemState(badjujuState).notAcquired == false){ itemsObtained.push({ "displayName": playerInfo.displayName, "membership_Id": playerInfo.membership_id, "item": "Bad Juju" }); }

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

  if(wayfarer){ titlesObtained.push({ "displayName": playerInfo.displayName, "membership_id": playerInfo.membership_Id, "title": "Wayfarer" }); }
  if(dredgen){ titlesObtained.push({ "displayName": playerInfo.displayName, "membership_id": playerInfo.membership_Id, "title": "Dredgen" }); }
  if(unbroken){ titlesObtained.push({ "displayName": playerInfo.displayName, "membership_id": playerInfo.membership_Id, "title": "Unbroken" }); }
  if(chronicler){ titlesObtained.push({ "displayName": playerInfo.displayName, "membership_id": playerInfo.membership_Id, "title": "Chronicler" }); }
  if(cursebreaker){ titlesObtained.push({ "displayName": playerInfo.displayName, "membership_id": playerInfo.membership_Id, "title": "Cursebreaker" }); }
  if(rivensbane){ titlesObtained.push({ "displayName": playerInfo.displayName, "membership_id": playerInfo.membership_Id, "title": "Rivensbane" }); }
  if(blacksmith){ titlesObtained.push({ "displayName": playerInfo.displayName, "membership_id": playerInfo.membership_Id, "title": "Blacksmith" }); }
  if(reckoner){ titlesObtained.push({ "displayName": playerInfo.displayName, "membership_id": playerInfo.membership_Id, "title": "Reckoner" }); }

  return { titlesObtained };
}

function SaveToFile(clan_id, ClanData) {
  fs.writeFile("./data/clans/" + clan_id + "/Rankings.json", JSON.stringify(ClanData.Rankings), (err) => { if (err) console.error(err) });
  fs.writeFile("./data/clans/" + clan_id + "/Raids.json", JSON.stringify(ClanData.Raids), (err) => { if (err) console.error(err) });
  fs.writeFile("./data/clans/" + clan_id + "/Items.json", JSON.stringify(ClanData.Items), (err) => { if (err) console.error(err) });
  fs.writeFile("./data/clans/" + clan_id + "/Titles.json", JSON.stringify(ClanData.Titles), (err) => { if (err) console.error(err) });
  fs.writeFile("./data/clans/" + clan_id + "/Others.json", JSON.stringify(ClanData.Others), (err) => { if (err) console.error(err) });
}

//Not used yet.
function CheckForChanges(file, array) {
  if(file == 'ClanMembers'){
    var Clannies_Prev = JSON.parse(fs.readFileSync('./data/clans/' + clanID + '/ClanMembers.json', 'utf8'));
    var Clannies_Curr = array;
    var Clannies_Changed = Clannies_Curr.filter(({membership_id:a, highestPower:x}) => Clannies_Prev.some(({membership_id:b, highestPower:y}) => a === b && x > y));
    for(i in Clannies_Changed){
      for(j in Clannies_Prev){
        if(Clannies_Prev[j].membership_id == Clannies_Changed[i].membership_id){
          Clannies_Prev[j].highestPower = Clannies_Changed[i].highestPower;
          console.log('Updated: ' + Clannies_Prev[j].member_name + ', HighestPower: ' + Clannies_Prev[j].highestPower);
        }
      }
    }
    playersInClan = Clannies_Prev;
    SortClanMembers();
  }
  if(file == 'Items'){
    var Items_Prev = JSON.parse(fs.readFileSync('./data/clans/' + clanID + '/Items.json', 'utf8'));
    var Items_Curr = array;
    if(Items_Curr.length !== Items_Prev.length){
      var NewItems = Items_Curr.filter(({member_name:a, item:x}) => !Items_Prev.some(({member_name:b, item:y}) => a === b && x === y));
      if(NewItems.length < 4){
        for(i in NewItems){
          Misc.WriteAnnoucement('Item', NewItems[i]);
          Log.SaveLog('Annoucement', 'New Item: ' + NewItems[i].member_name + ' has obtained: ' + NewItems[i].item);
        }
      }
      else {
        Log.SaveLog('Warning', 'Max Limit Reached - Items');
      }
    }
  }
  if(file == 'Titles'){
    var Titles_Prev = JSON.parse(fs.readFileSync('./data/clans/' + clanID + '/Titles.json', 'utf8'));
    var Titles_Curr = array;
    if(Titles_Curr.length !== Titles_Prev.length){
      var NewTitles = Titles_Curr.filter(({member_name:a, title:x}) => !Titles_Prev.some(({member_name:b, title:y}) => a === b && x === y));
      for(i in NewTitles){
        Misc.WriteAnnoucement('Titles', NewTitles[i]);
        Log.SaveLog('Annoucement', 'New Title: ' + NewTitles[i].member_name + ' has achieved the ' + NewTitles[i].title + ' title!');
      }
    }
  }
}
