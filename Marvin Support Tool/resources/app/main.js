const electron = require('electron');
const debug = require('electron-debug');

debug();
require('electron-reload')(__dirname, { electron: require(`${__dirname}/node_modules/electron`) })

function createWindow() {
	let win = new electron.BrowserWindow({ width: 1430, height: 836 });
	win.setMenu(null);
	win.webContents.openDevTools();
	win.loadFile('html/index.html');
}

electron.app.on('ready', createWindow);

electron.app.on('window-all-closed', () => {
  electron.app.quit();
});
