const electron = require('electron');
require('electron-reload')(__dirname, { electron: require(`${__dirname}/node_modules/electron`) })

function createWindow() {
	let win = new electron.BrowserWindow({ width: 1000, height: 600 });
	win.setMenu(null);
	win.webContents.openDevTools();
	win.loadFile('html/index.html');
}

electron.app.on('ready', createWindow);
