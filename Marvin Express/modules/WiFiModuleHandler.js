const fetch = require("node-fetch");

module.exports = { GetPlayerInfo, GetPlayerTitles };

async function GetPlayerInfo(req, res, callback) {
  const apiReq = req.query;
  if(apiReq.type === "1") {
      const headers = { headers: { "X-API-Key": "7ebaed805d274aa78c7c1cdf83c64db5", "Content-Type": "application/json" } };
      const request = await fetch(`https://bungie.net/Platform/Destiny2/${ apiReq.membershipType }/Profile/${ apiReq.membershipId }/?components=100,200,202,204,800,900`, headers);
      const response = await request.json();
      if(request.ok && response.ErrorCode && response.ErrorCode === 1) { callback(response); }
      else if(response.ErrorCode === 5) { res.status(200).send({ error: "SystemDisabled" }); }
      else { res.status(200).send({ error: `Failed: ${ JSON.stringify(response) }`}); }
  }
  else { res.status(200).send({ error: "Unknown type of request" }); }
}

async function GetPlayerTitles(req, res, request) {
  await GetPlayerInfo(req, res, (response) => {
    var titles = [];

    var wayfarer = response.Response.profileRecords.data.records["2757681677"].objectives[0].complete;
    var dredgen = response.Response.profileRecords.data.records["3798931976"].objectives[0].complete;
    var unbroken = response.Response.profileRecords.data.records["3369119720"].objectives[0].complete;
    var chronicler = response.Response.profileRecords.data.records["1754983323"].objectives[0].complete;
    var cursebreaker = response.Response.profileRecords.data.records["1693645129"].objectives[0].complete;
    var rivensbane = response.Response.profileRecords.data.records["2182090828"].objectives[0].complete;
    var blacksmith = response.Response.profileRecords.data.records["2053985130"].objectives[0].complete;
    var reckoner = response.Response.profileRecords.data.records["1313291220"].objectives[0].complete;
    var mmxix = response.Response.profileRecords.data.records["2254764897"].objectives[0].complete;
    var shadow = response.Response.profileRecords.data.records["1883929036"].objectives[0].complete;
    var undying = response.Response.profileRecords.data.records["2707428411"].objectives[0].complete;
    var enlightened = response.Response.profileRecords.data.records["3387213440"].objectives[0].complete;
    var harbinger = response.Response.profileRecords.data.records["3793754396"].objectives[0].complete;
    var savior = response.Response.profileRecords.data.records["2460356851"].objectives[0].complete;
  
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

    res.status(200).send({ error: null, titles });
  });
}