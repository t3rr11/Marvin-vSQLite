const MySQL = require('mysql');
const Misc = require("../js/misc.js");
const Log = require("../js/log.js");
const Config = require('../data/config.json');
const fetch = require("node-fetch");

//MySQL Connection
const db = MySQL.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'marvin'
});

//Connect to MySQL
db.connect(function(error) { if(!!error) { Log.SaveError("Error connecting to MySQL..."); } else { Log.SaveLog("Normal", "Connected to MySQL."); } });

module.exports = { db };
