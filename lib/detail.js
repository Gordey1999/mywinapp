const { BrowserWindow, ipcMain } = require('electron');
const path = require("path");

const settings = require('./settings').index;


let win = null;

function open(parent, files, selectedId) {

    win = new BrowserWindow({
        width: 800,
        height: 600,
        autoHideMenuBar: true,
        fullscreen: true,
        show: false,
        modal: true,
        parent: parent,
        webPreferences: {
            preload: path.join(__dirname, '../layout/detail/preload.js')
        }
    });

    win.loadFile('layout/detail/index.html');

    win.webContents.on('did-finish-load', () => {
        win.show();
    });



    ipcMain.once('closeDetail', (event, selectedId) => {
        win.close();
        parent.send('setSelected', selectedId);
    });

    ipcMain.once('detailInit', (event) => {
        win.send('detailInitResult', files, selectedId);
    });
}
module.exports = open;