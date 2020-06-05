const Misc = require('../js/misc');
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

function ToggleDarkmode() {
  if(document.getElementById("darkmodeCheckbox").checked) {
    try { document.getElementById("sidebar").classList.add("dark"); } catch (err) { }
    try { document.getElementById("browser").classList.add("lightDark"); } catch (err) { }
    try { document.getElementById("browserRight").classList.add("removeBorder"); } catch (err) { }
  }
  else {
    try { document.getElementById("sidebar").classList.remove("dark"); } catch (err) { }
    try { document.getElementById("browser").classList.remove("lightDark"); } catch (err) { }
    try { document.getElementById("browserRight").classList.remove("removeBorder"); } catch (err) { }
  }
  previous_backend_log = "";
  previous_frontend_log = "";
  LoadCurrentLog();
}

function ForceUpdate() {
  if(backend_log.includes("????")) { backend_log = backend_log.slice(0, backend_log.length-4); } else { backend_log = backend_log + "?"; }
  if(frontend_log.includes("????")) { frontend_log = frontend_log.slice(0, frontend_log.length-4); } else { frontend_log = frontend_log + "?"; }
  if(backend_status.includes("????")) { backend_status = backend_status.slice(0, backend_status.length-4); } else { backend_status = backend_status + "?"; }
  if(frontend_status.includes("????")) { frontend_status = frontend_status.slice(0, frontend_status.length-4); } else { frontend_status = frontend_status + "?"; }
  if(errorsFile.includes("????")) { errorsFile = errorsFile.slice(0, errorsFile.length-4); } else { errorsFile = errorsFile + "?"; }
  previous_backend_log = "";
  previous_frontend_log = "";
  LoadErrors();
  LoadStatus();
  LoadCurrentLog();
}
async function LoadCurrentLog() {
  //Get data
  var darkmode = document.getElementById("darkmodeCheckbox").checked;
  var frontendLog = await GetCurrentFrontendLog();
  var backendLog = await GetCurrentBackendLog();
  var shownFrontendLog = frontendLog.slice(frontendLog.length > 150 ? frontendLog.length - 150 : 0, frontendLog.length);
  var shownBackendLog = backendLog.slice(backendLog.length > 150 ? backendLog.length - 150 : 0, backendLog.length);
  var tableRowClassName = darkmode ? "table-row dark" : "table-row";

  if(previous_frontend_log.length < frontendLog.length) {
    //Load frontend log
    document.getElementById('browserLeft').innerHTML = `
      <div class="${ tableRowClassName }" id="leftTableRow">
        <div class="type">Type</div>
        <div class="log">Frontend Log</div>
        <div class="date">Date</div>
      </div>
      <div id="browser-table-left"></div>
    `;
    for(i in shownFrontendLog) {
      var type = shownFrontendLog[i].Type;
      var log = shownFrontendLog[i].Log
      var dateTime = shownFrontendLog[i].DateTime;
      if(type == 'Info'){ var color = darkmode ? '#cecece' : 'black' }
      if(type == 'Command'){ var color = darkmode ? 'cornflowerblue' : 'cornflowerblue' }
      if(type == 'Server'){ var color = darkmode ? '#b565ff' : 'blueviolet' }
      if(type == 'Account'){ var color = darkmode ? 'hotpink' : 'hotpink' }
      if(type == 'Clans'){ var color = darkmode ? '#3fb93f' : 'forestgreen' }
      if(type == 'Warning'){ var color = darkmode ? 'darkorange' : 'darkorange' }
      if(type == 'Error'){ var color = darkmode ? 'tomato' : 'tomato' }
      if(CheckFilter(type) == false) {
        document.getElementById('browser-table-left').innerHTML += `
          <div class="table-row" style="color:${ color }">
            <div class="type">${ type }</div>
            <div class="log">${ log }</div>
            <div class="date">${ dateTime }</div>
          </div>
        `;
      }
      previous_frontend_log = frontendLog;
      //Scroll to bottom
      var divLeft = document.getElementById('browser-table-left'); divLeft.scrollTop = divLeft.scrollHeight;
    }
  }
  if(previous_backend_log.length < backendLog.length) {
    //Load backend log
    document.getElementById('browserRight').innerHTML = `
    <div class="${ tableRowClassName }" id="rightTableRow">
      <div class="type">Type</div>
      <div class="log">Backend Log</div>
      <div class="date">Date</div>
    </div>
    <div id="browser-table-right"></div>
    `;
    for(i in shownBackendLog) {
      var type = shownBackendLog[i].Type;
      var log = shownBackendLog[i].Log;
      var dateTime = shownBackendLog[i].DateTime;
      if(type == 'Info'){ color = darkmode ? '#cecece' : 'black' }
      if(type == 'Account'){ color = darkmode ? '#cecece' : 'black' }
      if(type == 'Clans'){ color = darkmode ? '#cecece' : 'black' }
      if(type == 'Warning'){ color = darkmode ? 'darkorange' : 'darkorange' }
      if(type == 'Error'){ color = darkmode ? 'tomato' : 'tomato' }
      if(CheckFilter(type) == false) {
        document.getElementById('browser-table-right').innerHTML += `
          <div class="table-row" style="color:${ color }">
            <div class="type">${ type }</div>
            <div class="log">${ log }</div>
            <div class="date">${ dateTime }</div>
          </div>
        `;
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
  document.getElementById('status').innerHTML += `<div><b>Scans: </b>${ AddCommas(Backend_Status.scans) }</div>`;
  document.getElementById('status').innerHTML += `<div><b>Scan Speed: </b>${ Backend_Status.processingClans > 1 ? (Backend_Status.processingClans + " clans / s") : (Backend_Status.processingClans + " clan / s") }</div>`;
  document.getElementById('status').innerHTML += `<div><b>Frontend: </b>${ Misc.formatTime(Frontend_Status.uptime / 1000) }</div>`;
  document.getElementById('status').innerHTML += `<div><b>Backend: </b>${ Misc.formatTime(Backend_Status.uptime / 1000) }</div>`;
  document.getElementById('status').innerHTML += `<div><b>Scan Time: </b>${ Misc.formatTime(Backend_Status.scanTime / 1000) }</div>`;
  document.getElementById('status').innerHTML += `<div><b>Last Scan: </b>${ Misc.formatTime(Backend_Status.lastScan / 1000) } ago</div>`;
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
