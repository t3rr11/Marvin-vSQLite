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
async function CheckClanMembers(guild_id, client) {
  await new Promise(resolve => Database.GetClanDetails(guild_id, false, async function(isError, isFound, data) {
    if(!isError) {
      if(isFound) {
        var server_clan_ids = data.server_clan_ids.split(",");
        for(var i in server_clan_ids) {
          //Get members needed to scan based on if the first scan value is true.
          var CurrentClanMembers = await GetClanMembers(server_clan_ids[i]);
          var ClanMembers = [];
          if(CurrentClanMembers === "SystemDisabled") { }
          else if(CurrentClanMembers === "Error") { Log.SaveErrorCounter("unknown"); }
          else if(CurrentClanMembers === "DestinyShardRelayProxyTimeout") { Log.SaveErrorCounter("DestinyShardRelayProxyTimeout"); }
          else {
            for(var j in CurrentClanMembers) {
              ClanMembers.push({
                "displayName": CurrentClanMembers[j].destinyUserInfo.displayName,
                "membership_Id": CurrentClanMembers[j].destinyUserInfo.membershipId,
                "membershipType": CurrentClanMembers[j].destinyUserInfo.membershipType,
                "membershipTypes": CurrentClanMembers[j].destinyUserInfo.applicableMembershipTypes,
                "memberType": CurrentClanMembers[j].memberType,
                "isOnline": CurrentClanMembers[j].isOnline,
                "lastOnlineStatusChange": CurrentClanMembers[j].lastOnlineStatusChange,
                "joinDate": CurrentClanMembers[j].joinDate,
                "clanId": server_clan_ids[i]
              });
            }
          }
          var MembersToScan = null;
          if(data.firstScan === "true") { MembersToScan = ClanMembers; }
          else { MembersToScan = ClanMembers.filter(e => e.isOnline === true || (new Date() - new Date(e.lastOnlineStatusChange * 1000)) < 900000); }
          //Get each players data
          for(var j in MembersToScan) {
            await GetClanMemberData(MembersToScan[j], false).then(function(response) {
              if(response.failed) {
                if(response.reason === "DestinyAccountNotFound") { } //This means the account used to be a bnet account that never transfered over. Recommend kicking these players.
                else {
                  //if(Config.enableDebug){ console.log('\x1b[31m%s\x1b[0m', `${ response.playerInfo.displayName }: Failed, ${ response.reason }`); }
                }
              }
              else if(response.private) {
                if(Config.enableDebug) {
                  //console.log('\x1b[34m%s\x1b[0m', `${ response.playerData.profile.data.userInfo.displayName }: Private`); }
                }
              }
              else {
                if(Config.enableDebug) {
                  //console.log('\x1b[32m%s\x1b[0m', `${ response.playerData.profile.data.userInfo.displayName }: Successful`);
                }
                ProcessPlayerData(response, MembersToScan[j].clanId, client);
              }
            });
          }
          if(ClanMembers.length !== 0) { Database.UpdateClanMembers(ClanMembers, server_clan_ids[i]); }
        }
        //If that was the first time to scan, change the value to false as we only want to scan online players after the first scan to save on requests.
        if(data.firstScan === "true") {
          Database.UpdateClanFirstScan(guild_id, async function(isError, displayName) {
            if(!isError) {
              if(new Date() - new Date(parseInt(data.joinedOn)) < 1800000) {
                const embed = new Discord.RichEmbed().setColor(0xFFE000).setAuthor("Clan Broadcast").setDescription("Your clan has finished loading! If this is the first time you are free to use commands now, If not then i most likely pushed an update that required me to force a rescan of every clan.").setFooter(Config.defaultFooter, Config.defaultLogoURL).setTimestamp();
                try { var guild = client.guilds.get(data.guild_id); Misc.getDefaultChannel(guild).send({embed}); } catch(err) { console.log(`Failed to broadcast to ${ data.guild_id } because of ${ err }`); }
                Log.SaveLog("Info", `${ guild_id } has finished loading for the first time!`);
              }
              else { Log.SaveLog("Info", `${ guild_id } has finished re-scanning!`); }
            }
            else { Log.SaveError(`Failed to update clan details for ${ guild_id }`); }
          });
        }
      } else { Log.SaveError("Failed to find clan details - non-existant"); }
    } else { Log.SaveError("Failed to get clan details"); }
    resolve(true);
  }));
  //id++;
  //if(clan_id.length === 6) { console.log(`Finished scanning clan: ${ clan_id }  (${ id })`); }
  //else { console.log(`Finished scanning clan: ${ clan_id } (${ id })`); }
}
async function GetClanMembers(clan_id) {
  const headers = { headers: { "X-API-Key": Config.apiKey, "Content-Type": "application/json" } };
  const request = await fetch(`https://www.bungie.net/Platform/GroupV2/${ clan_id }/Members/?currentPage=1`, headers);
  const response = await request.json();
  if(request.ok && response.ErrorCode && response.ErrorCode === 1) { return response.Response.results; }
  else if(response.ErrorCode === 5) { return "SystemDisabled"; }
  else if(response.ErrorCode === 1652) { return "DestinyShardRelayProxyTimeout"; }
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
      if(playerData.profileRecords.data) { return { playerInfo, playerData, private: false, failed: false }; }
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
function ProcessPlayerData(response, clanId, client) {
  //Rankings
  const AccountInfo = GetAccountInfo(response, clanId);
  const Rankings = GetRankings(response);
  const Raids = GetRaids(response);
  const Items = GetItems(response);
  const Titles = GetTitles(response);
  const Seasonal = GetSeasonal(response);
  const Others = GetOthers(response);

  //Compare data
  Database.GetPlayerDetails(AccountInfo, function(isError, isFound, data) {
    if(!isError) {
      if(isFound) {
        if(data.firstLoad !== "true") {
          //Account has been found compare results and find changes, broadcast them.
          CheckForBroadcasts({ AccountInfo, Rankings, Raids, Items, Titles, Seasonal, Others }, client);
        }
        else {
          //If an account is found but results are default, then update them here without broadcasting, this usually happen if the bot crashes and never finished the creation process.
          UpdateAccountDetails(AccountInfo, Rankings, Raids, Items, Titles, Seasonal, Others);
        }
      }
      else {
        //If no account is found it will create a default account, this is where you update the details.
        UpdateAccountDetails(AccountInfo, Rankings, Raids, Items, Titles, Seasonal, Others);
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
  var lastWishCompletions = response.playerData.profileRecords.data.records["2195455623"].objectives[0].progress;
  var scourgeCompletions = response.playerData.profileRecords.data.records["4060320345"].objectives[0].progress;
  var sorrowsCompletions = response.playerData.profileRecords.data.records["1558682421"].objectives[0].progress;
  var gardenCompletions = response.playerData.profileRecords.data.records["1120290476"].objectives[0].progress;

  return {
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
  var anarchyState = response.playerData.profileCollectibles.data.collectibles["2220014607"].state;
  var thornState = response.playerData.profileCollectibles.data.collectibles["4009683574"].state;
  var jotunnState = response.playerData.profileCollectibles.data.collectibles["3584311877"].state;
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

  //Sundial
  var sundialCompletions = response.playerData.profileRecords.data.records["3801239892"].objectives[0].progress;

  return {
    "seasonRank": season9Rank,
    "sundial": sundialCompletions
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

function CheckForBroadcasts(Data, client) {
  //Grab old data
  Database.GetPlayerDetails(Data.AccountInfo, function(isError, isFound, SQLData) {
    if(!isError) {
      //Do broadcast checks
      CheckItems(Data, SQLData, client);
      CheckTitles(Data, SQLData, client);
      //Update details after announcing broadcasts. Toggle this is test broadcasts as they will stop updating.
      UpdateAccountDetails(Data.AccountInfo, Data.Rankings, Data.Raids, Data.Items, Data.Titles, Data.Seasonal, Data.Others);
    }
    else { var text = `Error in grabbing account information for ${ Data.AccountInfo.displayName } (${ Data.AccountInfo.membershipId })`; console.log(text); Log.SaveError(text); }
  });
}

function UpdateAccountDetails(AccountInfo, Rankings, Raids, Items, Titles, Seasonal, Others) {
  Database.UpdatePlayerDetails({ AccountInfo, Rankings, Raids, Items, Titles, Seasonal, Others }, function(isError) {
    if(isError) { var text = `Error in grabbing account information for ${ AccountInfo.displayName } (${ AccountInfo.membershipId })`; console.log(text); Log.SaveError(text); }
  });
}

//Clan Updates
function CheckClanName(Data, SQLData, client) {
  var oldName = SQLData.clan_name;
  var currName = Data.name;
  if(currName !== oldName) { console.log(`${ oldName } has changed their clan name to ${ currName }`); }
}
function CheckClanLevel(Data, SQLData, client) {
  console.log(Data);
  var oldLevel = SQLData.clan_level;
  var currLevel = Data.clanInfo.d2ClanProgressions["584850370"].level;
  if(currLevel > oldLevel) { console.log(`${ Data.name } has hit clan level: ${ currLevel }`); }
}

//Player Updates
function CheckItems(Data, SQLData, client) {
  if(Data.Items.items.length > 0) {
    var prevData = SQLData.items.split(',');
    var newData = Data.Items.items;
    var foundData = newData.filter(item => !prevData.includes(item));

    if(foundData.length !== 0) {
      for(var i = 0; i < foundData.length; i++) {
        if(foundData[i] === "1000 Voices") { SendBroadcast(Data, "item", foundData[i], Data.Raids.lastWish, client); }
        else if(foundData[i] === "Anarchy" || foundData[i] === "Always on Time") { SendBroadcast(Data, "item", foundData[i], Data.Raids.scourge, client); }
        else if(foundData[i] === "Tarrabah") { SendBroadcast(Data, "item", foundData[i], Data.Raids.sorrows, client); }
        else {
          SendBroadcast(Data, "item", foundData[i], -1, client);
        }
      }
    }
  }
}
function CheckTitles(Data, SQLData, client) {
  if(Data.Titles.titles.length > 0) {
    var prevData = SQLData.titles.split(',');
    var newData = Data.Titles.titles;
    var foundData = newData.filter(item => !prevData.includes(item));
    if(foundData.length !== 0) {
      for(var i = 0; i < foundData.length; i++) {
        SendBroadcast(Data, "title", foundData[i], -1, client);
      }
    }
  }
}

//Send Broadcast
function SendBroadcast(data, type, broadcast, count, client) {
  if(Config.enableBroadcasts) {
    Database.CheckNewBroadcast(data, Config.currentSeason, type, broadcast, count, new Date().getTime(), function(isError, isFound) {
      if(!isError) {
        if(!isFound) {
          var message = null;
          if(type === "item") {
            if(count === -1) { message = `${ data.AccountInfo.displayName } has obtained ${ broadcast }`; }
            else { message = `${ data.AccountInfo.displayName } has obtained ${ broadcast } in ${ count } ${ count > 1 ? "raids!" : "raid!" }` }
          }
          else if(type === "title") { message = `${ data.AccountInfo.displayName } has obtained the ${ broadcast } title!` }
          Database.GetRegisteredClansFromDB(function(isError, Clans) {
            if(!isError) {
              for(var i in Clans) {
                var clan_ids = Clans[i].server_clan_ids.split(',');
                for(var j in clan_ids) {
                  if(clan_ids[j] === data.AccountInfo.clanId) {
                    if(Clans[i].enable_whitelist === "true") {
                      var whitelistItems = Clans[i].whitelist.split(',');
                      if(whitelistItems.find(e => e === broadcast)) {
                        if(Clans[i].broadcasts_channel !== "null") {
                          const thisDate = new Date();
                          const embed = new Discord.RichEmbed().setColor(0xFFE000).setAuthor("Clan Broadcast").setDescription(message).setFooter(Config.defaultFooter, Config.defaultLogoURL).setTimestamp();
                          try { client.guilds.get(Clans[i].guild_id).channels.get(Clans[i].broadcasts_channel).send({embed}); }
                          catch(err) { console.log(`Failed to broadcast to ${ Clans[i].guild_id } because of ${ err }`); }
                        }
                      }
                    }
                    else {
                      var blacklistItems = Clans[i].blacklist.split(",");
                      if(!blacklistItems.find(e => e === broadcast)) {
                        if(Clans[i].broadcasts_channel !== "null") {
                          const thisDate = new Date();
                          const embed = new Discord.RichEmbed().setColor(0xFFE000).setAuthor("Clan Broadcast").setDescription(message).setFooter(Config.defaultFooter, Config.defaultLogoURL).setTimestamp();
                          try { client.guilds.get(Clans[i].guild_id).channels.get(Clans[i].broadcasts_channel).send({embed}); }
                          catch(err) { console.log(`Failed to broadcast to ${ Clans[i].guild_id } because of ${ err }`); }
                        }
                      }
                    }
                  }
                }
              }
              Database.AddNewBroadcast(data, Config.currentSeason, type, broadcast, count, new Date().getTime(), function(isError) { if(isError) { console.log("There was an error saving broadcast."); } });
              Log.SaveLog("Clans", `New Broadcast: (${ data.AccountInfo.clanId }) ${ message }`);
            }
            else { console.log(`Error trying to add this broadcast: ${ message }, Could not find registered clan.`); }
          });
        }
        else { console.log(`Tried to duplicate entry this broadcast: (${ data.AccountInfo.clanId }) ${ data.AccountInfo.displayName } has obtained ${ broadcast }`); }
      }
      else { console.log(`Error trying to add this broadcast: (${ data.AccountInfo.clanId }) ${ data.AccountInfo.displayName } has obtained ${ broadcast }, Error checking for broadcast.`); }
    });
  }
}
