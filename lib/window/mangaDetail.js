const { BrowserWindow, ipcMain, shell } = require('electron');
const path = require("path");

const settings = require('../settings').index;


let win = null;

function open(parent, files) {

    win = new BrowserWindow({
        width: 800,
        height: 600,
        autoHideMenuBar: true,
        fullscreen: true,
        show: false,
        modal: true,
        parent: parent,
        webPreferences: {
            preload: path.join(__dirname, '../../layout/mangaDetail/preload.js')
        }
    });

    win.loadFile('layout/mangaDetail/index.html');

    win.webContents.on('did-finish-load', () => {
        win.show();
    });

    ipcMain.once('mangaDetailClose', (event, selectedId) => {
        win.close();
    });

    ipcMain.once('mangaDetailInit', () => {
        win.send('mangaDetailInitResult', files);
    });
}

module.exports = open;