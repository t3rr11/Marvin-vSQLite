const fs = require('fs');

var isRaw = false;
var filter = { 'Info': false, 'Command': false, 'Server': false, 'Account': false, 'Clans': false, 'Warning': false, 'Error': false };
var previous_backend_log = "";
var previous_frontend_log = "";
var backend_log = "https://guardianstats.com/data/marvin/backend_log.json";
var frontend_log = "https://guardianstats.com/data/marvin/frontend_log.json";
var backend_status = "https://guardianstats.com/data/marvin/backend_status.json";
var frontend_status = "https://guardianstats.com/data/marvin/frontend_status.json";
var errorsFile = "https://guardianstats.com/data/marvin/errors.json";

function StartLoading() {
  setInterval(function(one) {
    LoadErrors();
    LoadStatus();
    LoadCurrentLog();
  }, 5000);
  LoadErrors();
  LoadStatus();
  LoadCurrentLog();
}

function AddCommas(x) { try { return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") } catch (err) { return x } }
function ToggleRawVersion() { if(isRaw == false) { isRaw = true; } else { isRaw = false;  } LoadCurrentLog(); }
function Filter(option) { if(filter[option] == true) { filter[option] = false } else { filter[option] = true; } LoadCurrentLog(); }
function CheckFilter(option) { return filter[option]; }

function ForceUpdate() {
  if(backend_log.includes("????")) { backend_log = backend_log.slice(0, backend_log.length-4); } else { backend_log = backend_log + "?"; }
  if(frontend_log.includes("????")) { frontend_log = frontend_log.slice(0, frontend_log.length-4); } else { frontend_log = frontend_log + "?"; }
  if(backend_status.includes("????")) { backend_status = backend_status.slice(0, backend_status.length-4); } else { backend_status = backend_status + "?"; }
  if(frontend_status.includes("????")) { frontend_status = frontend_status.slice(0, frontend_status.length-4); } else { frontend_status = frontend_status + "?"; }
  if(errorsFile.includes("????")) { errorsFile = errorsFile.slice(0, errorsFile.length-4); } else { errorsFile = errorsFile + "?"; }
  LoadErrors();
  LoadStatus();
  LoadCurrentLog();
}
async function LoadCurrentLog() {
  //Get data
  var frontendLog = await GetCurrentFrontendLog();
  var backendLog = await GetCurrentBackendLog();

  if(previous_frontend_log.length < frontendLog.length) {
    //Load frontend log
    document.getElementById('browserLeft').innerHTML =
    '<div class="table-row" id="mainTableRow">' +
      '<div class="type">Type</div>' +
      '<div class="log">Frontend Log</div>' +
      '<div class="date">Date</div>' +
    '</div>' +
    '<div id="browser-table-left">' +
    '</div>';
    for(i in frontendLog) {
      var type = JSON.stringify(frontendLog[i].Type).split('"').join('');
      var log = JSON.stringify(frontendLog[i].Log).split('"').join('');
      var dateTime = JSON.stringify(frontendLog[i].DateTime).split('"').join('');
      if(type == 'Info'){ var color = 'black' }
      if(type == 'Command'){ var color = 'cornflowerblue' }
      if(type == 'Server'){ var color = 'blueviolet' }
      if(type == 'Account'){ var color = 'hotpink' }
      if(type == 'Clans'){ var color = 'hotpink' }
      if(type == 'Warning'){ var color = 'Warning' }
      if(type == 'Error'){ var color = 'Tomato' }
      if(CheckFilter(type) == false) {
        document.getElementById('browser-table-left').innerHTML +=
        '<div class="table-row" style="color:'+ color +'">' +
          '<div class="type">' + type + '</div>' +
          '<div class="log">' + log + '</div>' +
          '<div class="date">' + dateTime + '</div>' +
        '</div>';
      }
      previous_frontend_log = frontendLog;
      //Scroll to bottom
      var divLeft = document.getElementById('browser-table-left'); divLeft.scrollTop = divLeft.scrollHeight;
    }
  }
  if(previous_backend_log.length < backendLog.length) {
    //Load backend log
    document.getElementById('browserRight').innerHTML =
    '<div class="table-row" id="mainTableRow">' +
      '<div class="type">Type</div>' +
      '<div class="log">Backend Log</div>' +
      '<div class="date">Date</div>' +
    '</div>' +
    '<div id="browser-table-right">' +
    '</div>';
    for(i in backendLog) {
      var type = JSON.stringify(backendLog[i].Type).split('"').join('');
      var log = JSON.stringify(backendLog[i].Log).split('"').join('');
      var dateTime = JSON.stringify(backendLog[i].DateTime).split('"').join('');
      if(type == 'Info'){ var color = 'black' }
      if(type == 'Command'){ var color = 'cornflowerblue' }
      if(type == 'Server'){ var color = 'blueviolet' }
      if(type == 'Account'){ var color = 'hotpink' }
      if(type == 'Clans'){ var color = 'hotpink' }
      if(type == 'Warning'){ var color = 'Warning' }
      if(type == 'Error'){ var color = 'Tomato' }
      if(CheckFilter(type) == false) {
        document.getElementById('browser-table-right').innerHTML +=
        '<div class="table-row" style="color:'+ color +'">' +
          '<div class="type">' + type + '</div>' +
          '<div class="log">' + log + '</div>' +
          '<div class="date">' + dateTime + '</div>' +
        '</div>';
      }
      previous_backend_log = backendLog;
      //Scroll to bottom
      var divRight = document.getElementById('browser-table-right'); divRight.scrollTop = divRight.scrollHeight;
    }
  }
}
async function LoadErrors() {
  const Errors = await GetErrors();
  const Status = await GetBackendStatus();
  document.getElementById('errors').innerHTML = '';
  document.getElementById('errors').innerHTML += `<div><b>Shard Errors: </b>${ AddCommas(Errors.shardErrors) } (${ ((Errors.shardErrors / Status.scans) * 100).toFixed(1) < 100 ? ((Errors.shardErrors / Status.scans) * 100).toFixed(1) : 100 }%)</div>`;
  document.getElementById('errors').innerHTML += `<div><b>Other Errors: </b>${ AddCommas(Errors.otherErrors) } (${ ((Errors.otherErrors / Status.scans) * 100).toFixed(1) < 100 ? ((Errors.otherErrors / Status.scans) * 100).toFixed(1) : 100 }%)</div>`;
}
async function LoadStatus() {
  const Frontend_Status = await GetFrontendStatus();
  const Backend_Status = await GetBackendStatus();
  document.getElementById('status').innerHTML = '';
  document.getElementById('status').innerHTML += `<div><b>Users: </b>${ AddCommas(Frontend_Status.users) }</div>`;
  document.getElementById('status').innerHTML += `<div><b>Servers: </b>${ AddCommas(Frontend_Status.servers) }</div>`;
  document.getElementById('status').innerHTML += `<div><b>Clans: </b>${ AddCommas(Frontend_Status.clans) }</div>`;
  document.getElementById('status').innerHTML += `<div><b>Players: </b>${ AddCommas(Frontend_Status.players) }</div>`;
  document.getElementById('status').innerHTML += `<div><b>Scans: </b>${ AddCommas(Backend_Status.scans) }</div>`;
  document.getElementById('status').innerHTML += `<div><b>Scan Speed: </b>${ Backend_Status.processingClans > 1 ? (Backend_Status.processingClans + " clans / s") : (Backend_Status.processingClans + " clan / s") }</div>`;
  document.getElementById('status').innerHTML += `<div><b>Frontend: </b>${ Frontend_Status.uptime }</div>`;
  document.getElementById('status').innerHTML += `<div><b>Backend: </b>${ Backend_Status.uptime }</div>`;
  document.getElementById('status').innerHTML += `<div><b>Scan Time: </b>${ Backend_Status.scanTime }</div>`;
  document.getElementById('status').innerHTML += `<div><b>Last Scan: </b>${ Backend_Status.lastScan } ago</div>`;
  document.getElementById('status').innerHTML += `<div><b>Bungie API: </b>${ Backend_Status.apiDisabled === true ? "Disabled" : "Online" }</div>`;
}
async function GetCurrentFrontendLog() {
  const headers = { headers: { "Content-Type": "application/json" } };
  const request = await fetch(`${ frontend_log }`, headers);
  const response = await request.json();
  if(!request.ok) { return `Request Not Ok: ${ JSON.stringify(response) }` }
  else if(request.ok) { return response }
  else { return `Request Error: ${ JSON.stringify(response) }`; }
}
async function GetCurrentBackendLog() {
  const headers = { headers: { "Content-Type": "application/json" } };
  const request = await fetch(`${ backend_log }`, headers);
  const response = await request.json();
  if(!request.ok) { return `Request Not Ok: ${ JSON.stringify(response) }` }
  else if(request.ok) { return response }
  else { return `Request Error: ${ JSON.stringify(response) }`; }
}
async function GetFrontendStatus() {
  const headers = { headers: { "Content-Type": "application/json" } };
  const request = await fetch(`${ frontend_status }`, headers);
  const response = await request.json();
  if(!request.ok) { return `Request Not Ok: ${ JSON.stringify(response) }` }
  else if(request.ok) { return response }
  else { return `Request Error: ${ JSON.stringify(response) }`; }
}
async function GetBackendStatus() {
  const headers = { headers: { "Content-Type": "application/json" } };
  const request = await fetch(`${ backend_status }`, headers);
  const response = await request.json();
  if(!request.ok) { return `Request Not Ok: ${ JSON.stringify(response) }` }
  else if(request.ok) { return response }
  else { return `Request Error: ${ JSON.stringify(response) }`; }
}
async function GetErrors() {
  const headers = { headers: { "Content-Type": "application/json" } };
  const request = await fetch(`${ errorsFile }`, headers);
  const response = await request.json();
  if(!request.ok) { return `Request Not Ok: ${ JSON.stringify(response) }` }
  else if(request.ok) { return response }
  else { return `Request Error: ${ JSON.stringify(response) }`; }
}