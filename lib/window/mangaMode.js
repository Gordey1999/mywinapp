const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const settings = require("../settings");
const fs = require("fs");
const { getResized, getResizedPath, prepareResizedDir } = require('../resize');
const { FilesIndexer } = require('../indexFiles');
const {getType, sortByName} = require("../tools");
const mangaDetail = require("./mangaDetail");
const {initWindow} = require("../window");


let win = null;

let currentDir = null

function open(parent, dir) {

    win = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 300,
        minHeight: 300,
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, '../../layout/mangaMode/preload.js'),
            nodeIntegration: true,
        }
    })
    win.maximize();

    win.loadFile('layout/mangaMode/index.html');

    initWindow(win);

    currentDir = dir;
    if (!currentDir) {
        currentDir = settings.rootDir;
    }

    return win;
}

module.exports = open;

ipcMain.on('mangaModeInit', (event) => {
    const direntList = fs.readdirSync(currentDir, {
        withFileTypes: true
    });

    const mangaList = [];
    direntList.forEach((dirent) => {
        if (dirent.isFile()) {
            return;
        }

        let dirPath = path.join(currentDir, dirent.name);

        //prepareResizedDir(dirPath);

        const mangaFiles = fs.readdirSync(dirPath, {
            withFileTypes: true
        });

        let files = [];
        mangaFiles.forEach((file) => {
            const type = getType(file.name);
            const filePath = path.join(dirPath, file.name);

            if (file.isFile() && type !== null) {
                files.push({
                    name: file.name,
                    src: filePath
                })
            }
        });

        if (!files.length) {
            return;
        }

        sortByName(files);

        mangaList.push({
            name: dirent.name,
            src: dirPath,
            files: files,
            preview: files[0].src
        });
    });

    sortByName(mangaList);

    win.webContents.send('mangaModeInitResult', mangaList);
});

ipcMain.once('mangaModeClose', (event, selectedId) => {
    win.close();
});

ipcMain.on('openMangaDetail', (event, files) => {
    const mangaDetail = require('./mangaDetail');
    mangaDetail(win, files);
})