//Express
const { db } = require("./Database");
const Log = require("../js/log.js");
const fetch = require("node-fetch");
//Function Files
const GetReport = require("./GetReport");
const GetClanRankings = require("./GetClanRankings");

module.exports = { expressPOSTRequest, expressUpdatePOSTRequest, expressGETRequest, expressGETJSON, GetReport, GetClanRankings };

async function expressPOSTRequest(req, res, name, sql) {
  Log.SaveLog("Request", `POST Request; From: ${ req.headers["x-forwarded-for"] } to: ${ name }`);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error: ${ error }`); res.status(200).send({ error: "Failed" }); }
    else { if(rows.length > 0) { res.status(200).send({ error: null, data: rows }) } else { res.status(200).send({ error: "No data found" }) } }
  });
}

async function expressUpdatePOSTRequest(req, res, name, sql) {
  Log.SaveLog("Request", `UPDATE POST Request; From: ${ req.headers["x-forwarded-for"] } to: ${ name }`);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error: ${ error }`); res.status(200).send({ error: "Failed" }); }
    else { res.status(200).send({ error: null, data: "Successfully updated guild information..." }) }
  });
}

async function expressGETRequest(req, res, name, sql) {
  Log.SaveLog("Request", `GET Request; From: ${ req.headers["x-forwarded-for"] } to: ${ name }`);
  db.query(sql, function(error, rows, fields) {
    if(!!error) { Log.SaveError(`Error: ${ error }`); res.status(200).send({ error: "Failed" }); }
    else { if(rows.length > 0) { res.status(200).send({ error: null, data: rows }) } else { res.status(200).send({ error: "No data found" }) } }
  });
}

async function expressGETJSON(req, res, name, url) {
    Log.SaveLog("Request", `JSON Request; From: ${ req.headers["x-forwarded-for"] } to: ${ name }`);
    const headers = { headers: { "Content-Type": "application/json" } };
    const request = await fetch(url, headers);
    const response = await request.json();
    if(request.ok) { res.status(200).send({ error: null, data: response }) }
    else { res.status(200).send({ error: "No data found" }) }
}