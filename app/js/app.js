var fs = require('fs');
var files = fs.readdirSync('../data/logs'); files.reverse();
var isRaw = false;
var isCurrentLogActive = true;
var filter = { 'Info': false, 'Command': false, 'Server': false, 'Account': false, 'Clans': false, 'Warning': false, 'Error': false };
var currentlySelectedFile = files[0];
var previousData = "";

function StartLoading() {
  setInterval(function(one) {
    files = fs.readdirSync('../data/logs');
    files.reverse();
    SetSidebar();
    LoadCurrentLog()
  }, 5000);
  SetSidebar();
  LoadCurrentLog()
}

function SetSidebar() {
  document.getElementById('sidebar').innerHTML = '';
  document.getElementById('sidebar').innerHTML += '<p style="margin:2px;padding:5px;" onclick="LoadTheCurrentLog();">Current Log</p>';
  document.getElementById('sidebar').innerHTML += '<p style="margin:2px;padding:5px;">Others</p>';
  for(i in files) {
    document.getElementById('sidebar').innerHTML += '<p style="margin:2px;" onclick="LoadFile(\'' + files[i] + '\')">' + files[i] + '</p>';
  }
}

function ToggleRawVersion() { if(isRaw == false) { isRaw = true; } else { isRaw = false;  } LoadFile(currentlySelectedFile); }
function Filter(option) { if(filter[option] == true) { filter[option] = false } else { filter[option] = true; } if(isCurrentLogActive) { LoadTheCurrentLog(); } else { LoadFile(currentlySelectedFile); } }
function CheckFilter(option) { return filter[option]; }

function LoadFile(fileName){
  isCurrentLogActive = false;
  if(fileName == 'Default'){ fileName = currentlySelectedFile; }
  if(isRaw == false){ LoadConfiguredFile(fileName); }
  else { LoadRawFile(fileName); }
  document.getElementById('title').innerHTML = 'Marvin Tool - ' + fileName;
}
function LoadRawFile(fileName) {
  if(fileName == 'None'){ $("#browser").html('<pre id="browser-data">Please Select A File First!</pre>'); }
  else {
    readTextFile("../../data/logs/" + fileName, function(text){
      var data = JSON.stringify(JSON.parse(text), null, 2);
      $("#browser").html('<pre id="browser-data">' + data + '</pre>');
    });
    currentlySelectedFile = fileName;
  }
}
function LoadConfiguredFile(fileName) {
  if(fileName == 'None'){ $("#browser").html('<pre id="browser-data">Please Select A File First!</pre>'); }
  else {
    readTextFile("../../data/logs/" + fileName, function(text) {
      var data = JSON.parse(text);
      data.reverse();
      document.getElementById('browser').innerHTML =
      '<div id="browser-table">' +
        '<div class="table-row" id="mainTableRow">' +
          '<div class="date">Date</div>' +
          '<div class="type">Type</div>' +
          '<div class="log">Log</div>' +
        '</div>' +
      '</div>';
      for(i in data){
        var dateTime = JSON.stringify(data[i].DateTime).split('"').join('');
        var type = JSON.stringify(data[i].Type).split('"').join('');
        var log = JSON.stringify(data[i].Log).split('"').join('');
        if(type == 'Info'){ var color = 'black' }
        if(type == 'Command'){ var color = 'cornflowerblue' }
        if(type == 'Server'){ var color = 'blueviolet' }
        if(type == 'Account'){ var color = 'hotpink' }
        if(type == 'Clans'){ var color = 'hotpink' }
        if(type == 'Warning'){ var color = 'Warning' }
        if(type == 'Error'){ var color = 'Tomato' }
        if(CheckFilter(type) == false) {
          document.getElementById('browser-table').innerHTML +=
          '<div class="table-row" style="color:'+ color +'">' +
            '<div class="date">' + dateTime + '</div>' +
            '<div class="type">' + type + '</div>' +
            '<div class="log">' + log + '</div>' +
          '</div>';
        }
      }
    });
    currentlySelectedFile = fileName;
  }
}
function LoadTheCurrentLog() {
  previousData = "";
  LoadCurrentLog();
}
async function LoadCurrentLog() {
  isCurrentLogActive = true;
  var data = await GetCurrentLog();
  data.reverse();
  if(previousData.length < data.length) {
    previousData = data;
    document.getElementById('browser').innerHTML =
    '<div id="browser-table">' +
      '<div class="table-row" id="mainTableRow">' +
        '<div class="date">Date</div>' +
        '<div class="type">Type</div>' +
        '<div class="log">Log</div>' +
      '</div>' +
    '</div>';
    for(i in data) {
      var dateTime = JSON.stringify(data[i].DateTime).split('"').join('');
      var type = JSON.stringify(data[i].Type).split('"').join('');
      var log = JSON.stringify(data[i].Log).split('"').join('');
      if(type == 'Info'){ var color = 'black' }
      if(type == 'Command'){ var color = 'cornflowerblue' }
      if(type == 'Server'){ var color = 'blueviolet' }
      if(type == 'Account'){ var color = 'hotpink' }
      if(type == 'Clans'){ var color = 'hotpink' }
      if(type == 'Warning'){ var color = 'Warning' }
      if(type == 'Error'){ var color = 'Tomato' }
      if(CheckFilter(type) == false) {
        document.getElementById('browser-table').innerHTML +=
        '<div class="table-row" style="color:'+ color +'">' +
          '<div class="date">' + dateTime + '</div>' +
          '<div class="type">' + type + '</div>' +
          '<div class="log">' + log + '</div>' +
        '</div>';
      }
    }
  }
}
async function GetCurrentLog() {
  const headers = { headers: { "Content-Type": "application/json" } };
  const request = await fetch(`https://guardianstats.com/data/marvin/currentLog.json?`, headers);
  const response = await request.json();
  if(!request.ok) { return `Request Not Ok: ${ JSON.stringify(response) }` }
  else if(request.ok) { return response }
  else { return `Request Error: ${ JSON.stringify(response) }`; }
}
