module.exports = { readTextFile, formatTime }

function readTextFile(file, callback) {
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4 && rawFile.status == "200") {
            callback(rawFile.responseText);
        }
    }
    rawFile.send(null);
}
function formatTime(TimeinSeconds) {
    var days, hours, minutes, seconds;
  
    seconds = Math.floor(Number(TimeinSeconds));
    days     = Math.floor(seconds / (24*60*60));
    seconds -= Math.floor(days    * (24*60*60));
    hours    = Math.floor(seconds / (60*60));
    seconds -= Math.floor(hours   * (60*60));
    minutes  = Math.floor(seconds / (60));
    seconds -= Math.floor(minutes * (60));
  
    var dDisplay, hDisplay, mDisplay, sDisplay;
  
    dDisplay = days > 0 ? days + (days == 1 ? 'd ' : 'd ') : '';
    hDisplay = hours > 0 ? hours + (hours == 1 ? 'h ' : 'h ') : '';
    mDisplay = minutes > 0 ? minutes + (minutes == 1 ? 'm ' : 'm ') : '';
    sDisplay = seconds > 0 ? seconds + (seconds == 1 ? 's ' : 's ') : '';
  
    if (TimeinSeconds < 60) { return sDisplay; }
    if (TimeinSeconds >= 60 && TimeinSeconds < 3600) { return mDisplay + sDisplay; }
    if (TimeinSeconds >= 3600 && TimeinSeconds < 86400) { return hDisplay + mDisplay; }
    if (TimeinSeconds >= 86400 && TimeinSeconds !== Infinity) { return dDisplay + hDisplay; }
    return dDisplay + hDisplay + mDisplay + sDisplay;
  }