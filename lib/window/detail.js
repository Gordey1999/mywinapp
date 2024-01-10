const { BrowserWindow, ipcMain } = require('electron');
const path = require("path");


let win = null;

function open(files, pointTo, parent = null, closeCallback = null) {

    const params = {
        width: 100,
        height: 100,
        autoHideMenuBar: true,
        fullscreen: true,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, '../../layout/detail/preload.js'),
            nodeIntegration: true,
        }
    }

    if (parent) {
        params.parent = parent;
        params.modal = true;
    }

    win = new BrowserWindow(params);

    win.loadFile('layout/detail/index.html');

    win.webContents.on('did-finish-load', () => {
        win.show();
    });



    ipcMain.once('closeDetail', (event, pointTo) => {
        win.close();
        if (closeCallback !== null) {
            closeCallback(pointTo);
        }
    });

    ipcMain.once('detailInit', () => {
        win.send('detailInitResult', files, pointTo);
    });
}

module.exports = open;