const { BrowserWindow, ipcMain, shell } = require('electron');
const path = require("path");

const settings = require('../settings').index;


let win = null;

function open(parent, files, selectedId) {

    const params = {
        width: 100,
        height: 100,
        autoHideMenuBar: true,
        fullscreen: true,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, '../../layout/detail/preload.js')
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



    ipcMain.once('closeDetail', (event, selectedId) => {
        win.close();
        parent?.send('filesSetSelected', selectedId);
    });

    ipcMain.once('detailInit', () => {
        win.send('detailInitResult', files, selectedId);
    });
}

ipcMain.on('detailOpenInExplorer', (event, file) => {
    shell.showItemInFolder(file.src);
})

module.exports = open;