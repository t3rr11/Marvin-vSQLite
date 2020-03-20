const MySQL = require('mysql');
const Misc = require("../js/misc.js");
const Log = require("../js/log.js");
const Config = require('../data/config.json');
const DBConfig = require('../../Combined/configs/db_config.json');
const fetch = require("node-fetch");

//MySQL Connection
var db;
function handleDisconnect() {
  db = MySQL.createConnection(DBConfig);
  db.connect(function(err) {
    if(err) {
      console.log('Error when connecting to db: ', err);
      setTimeout(handleDisconnect, 2000);
    }
  });
  db.on('error', function(err) {
    console.log('Database Error: ', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { Log.SaveError("Express lost connection to MySQL database. Reconnecting now..."); handleDisconnect(); }
    else { throw err; }
  });
}

handleDisconnect();

module.exports = { db };
