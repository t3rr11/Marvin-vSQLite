var fs = require('fs');
var files = fs.readdirSync('../data/logs'); files.reverse();
var isRaw = false;
var filter = { 'Command': false, 'Server': false, 'Account': false, 'Clans': false, 'Warning': false, 'Error': false };
var currentlySelectedFile = files[0];

function StartLoading() {
  setInterval(function(one) {
    files = fs.readdirSync('../data/logs');
    files.reverse();
    SetSidebar();
    LoadFile(currentlySelectedFile);
  }, 30000);
  SetSidebar();
  LoadFile(currentlySelectedFile);
}

function SetSidebar() {
  document.getElementById('sidebar').innerHTML = '';
  for(i in files){
    document.getElementById('sidebar').innerHTML += '<p style="margin:2px;" onclick="LoadFile(\'' + files[i] + '\')">' + files[i] + '</p>';
  }
}

function ToggleRawVersion() { if(isRaw == false) { isRaw = true; } else { isRaw = false;  } LoadFile(currentlySelectedFile); }
function Filter(option) { if(filter[option] == true) { filter[option] = false } else { filter[option] = true; } LoadFile(currentlySelectedFile); }
function CheckFilter(option) { console.log(option); return filter[option]; }

function LoadFile(fileName){
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
        if(type == 'Command'){ var color = 'cornflowerblue' }
        if(type == 'Server'){ var color = 'blueviolet' }
        if(type == 'Account'){ var color = 'hotpink' }
        if(type == 'Clans'){ var color = 'hotpink' }
        if(type == 'Warning'){ var color = 'Warning' }
        if(type == 'Error'){ var color = 'Tomato' }
        if(CheckFilter(type) == false){
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
