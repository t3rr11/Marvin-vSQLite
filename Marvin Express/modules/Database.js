const MySQL = require('mysql');
const Misc = require("../js/misc.js");
const Log = require("../js/log.js");
const Config = require('../data/config.json');
const fetch = require("node-fetch");

//MySQL Connection
var db;
var db_config = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'marvin'
};

function handleDisconnect() {
  db = MySQL.createConnection(db_config);
  db.connect(function(err) {
    if(err) {
      console.log('Error when connecting to db: ', err);
      setTimeout(handleDisconnect, 2000);
    }
  });
  db.on('error', function(err) {
    console.log('Database Error: ', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { handleDisconnect(); }
    else { throw err; }
  });
}

handleDisconnect();

module.exports = { db };
