//Express
const { db } = require("./Database");
const Log = require("../js/log.js");
const fetch = require("node-fetch");

async function GetReport(req, res, name) {
  Log.SaveLog("Request", `GET Request; From: ${ req.headers["x-forwarded-for"] } to: ${ name }`);

  //Get statuses.
  let Status = await GetStatus();

  //Build processed datasets.
  Promise.all([await GetOverallReport(), await GetSessionReport(Status.frontend), await GetOverallBroadcasts()]).then(function(data) {
    //Return processed data or error.
    if(data[0] === undefined) { res.status(200).send({ error: "Failed" }); }
    else {
      res.status(200).send({
        error: null,
        data: {
          status: Status,
          overall: {
            commands: data[0],
            broadcasts: data[2]
          },
          session: {
            uptime: Status.frontend.uptime,
            commands: data[1]
          },
        }
      });
    }
  });
}
async function GetStatus() {
  const headers = { headers: { "Content-Type": "application/json" } };
  const request_frontend = await fetch(`https://guardianstats.com/data/marvin/frontend_status.json`, headers);
  const request_backend = await fetch(`https://guardianstats.com/data/marvin/backend_status.json`, headers);
  const frontend = await request_frontend.json();
  const backend = await request_backend.json();
  return { frontend, backend }
}
async function GetOverallReport() {
  //Grab all logs since the beginning of time.
  return new Promise(resolve => { db.query(`SELECT * FROM log`, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error: ${ error }`); return "Failed"; }
    else {
      if(rows.length > 0) { resolve(BuildReport(rows)); }
      else { resolve("No Data"); }
    }
  }) });
}
async function GetSessionReport(currentStatus) {
  //Filter logs based on the uptime to get the logs since the last restart.
  return new Promise(resolve => { db.query(`SELECT * FROM log WHERE date > ${ new Date().getTime() - currentStatus.uptime } AND date <= ${ new Date().getTime() }`, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error: ${ error }`); return "Failed"; }
    else {
      if(rows.length > 0) { resolve(BuildReport(rows)); }
      else { resolve("No Data"); }
    }
  }) });
}
async function GetOverallBroadcasts() {
  //Filter logs based on the uptime to get the logs since the last restart.
  return new Promise(resolve => { db.query(`SELECT * FROM broadcasts`, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error: ${ error }`); return "Failed"; }
    else {
      if(rows.length > 0) { resolve(BuildBroadcastsReport(rows)); }
      else { resolve("No Data"); }
    }
  }) });
}
async function BuildReport(rows) {
  //Logs obtained, processing now.
  let commands = [];
  let commands_count = 0;
  let related_commands_count = 0;
  for(let i in rows) {
    if(rows[i].command !== "") { 
      if(!commands.find(e => e.name === rows[i].command)) { commands.push({ "name": rows[i].command, amount: rows.filter(f => f.command === rows[i].command).length }); }
      commands_count++;
    }
    if(rows[i].related === '1') { related_commands_count++; }
  }

  //Create processed dataset
  return {
    data: commands.sort(function(a, b) { return b.amount - a.amount }),
    total: commands_count,
    related: related_commands_count,
    percentage: `${ ((related_commands_count / commands_count) * 100) }%`
  }
}
async function BuildBroadcastsReport(rows) {
  //Logs obtained, processing now.
  let broadcasts = [];
  let broadcasts_count = 0;
  for(let i in rows) {
    //If seasonal category does not exist create it.
    if(!broadcasts[rows[i].season]) {
      broadcasts[rows[i].season] = { "name": `Season ${ rows[i].season }`, "season": rows[i].season, "items": [], "titles": [] };
    }

    //Check the type of the broacast and check if exists.
    if(rows[i].type === "item") {
      //If item does not exist make a new node for it and set count to 1.
      if(!broadcasts[rows[i].season].items.find(e => e.name === rows[i].broadcast)) { broadcasts[rows[i].season].items.push({ "name": rows[i].broadcast, "amount": 1 }); }
      else {
        //If item does exist then increase the amount.
        for(let j in broadcasts[rows[i].season].items) {
          if(broadcasts[rows[i].season].items[j].name === rows[i].broadcast) {
            broadcasts[rows[i].season].items[j].amount = broadcasts[rows[i].season].items[j].amount + 1;
          }
        }
      }
    }
    else if(rows[i].type === "title") {
      //If title does not exist make a new node for it and set count to 1.
      if(!broadcasts[rows[i].season].titles.find(e => e.name === rows[i].broadcast)) { broadcasts[rows[i].season].titles.push({ "name": rows[i].broadcast, "amount": 1 }); }
      else {
        //If title does exist then increase the amount.
        for(let j in broadcasts[rows[i].season].titles) {
          if(broadcasts[rows[i].season].titles[j].name === rows[i].broadcast) {
            broadcasts[rows[i].season].titles[j].amount = broadcasts[rows[i].season].titles[j].amount + 1;
          }
        }
      }
    }
    broadcasts_count++;
  }

  //Create processed dataset
  return {
    data: broadcasts.filter(n => n),
    total: broadcasts_count
  }
}

module.exports = GetReport;