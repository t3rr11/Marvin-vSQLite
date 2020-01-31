//Express
const MySQL = require('mysql');
const Database = require("./Database");
const Misc = require("../js/misc.js");
const Log = require("../js/log.js");
const cors = require("cors")
const express = require('express');
const bodyParser = require('body-parser');
var app = express();

app.use(cors());
app.use(bodyParser.json({ extended: true }));

module.exports = { app };

app.post("/getclan", function(req, res) {
  handlePost(req, res);
});

async function handlePost(req, res) {
  await new Promise(resolve => Database.GetClanDetailsViaAuthor(req.body, async function(isError, isFound, data) {
    if(!isError) {
      if(isFound) { res.status(200).send({ error: null, data }); }
      else { res.status(200).send({ error: "No clan found" }); }
    }
    else { res.status(200).send({ error: "Failed" }); }
    resolve(true);
  }));
}

app.listen(3000, function () { console.log(Misc.GetReadableDateTime() + ' - ' + 'Listening on port 3000'); });
