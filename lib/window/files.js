const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const settings = require("../settings");
const fs = require("fs");
const { getResized, getResizedPath, prepareResizedDir, isCacheDir } = require('../resize');
const { FilesIndexer } = require('../indexFiles');
const {getType, sortByName} = require("../tools");
const {initWindow} = require("../window");


let win = null;



function open(parent, files, selectedId) {

    win = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 400,
        minHeight: 400,
        frame: false,
	    icon: '../../layout/icons/logo2_256.png',
        webPreferences: {
            preload: path.join(__dirname, '../../layout/files/preload.js'),
            nodeIntegration: true,
        }
    })
    win.maximize();

    win.loadFile('layout/files/index.html');

    initWindow(win);

    return win;
}

function readFiles(dirPath) {
    let checkForCache = false;
    if (!dirPath) {
        dirPath = settings.rootDir;
        checkForCache = true;
    }

    const direntList = fs.readdirSync(dirPath, {
        withFileTypes: true
    });

    prepareResizedDir(dirPath);

    const dirs = [];
    const files = [];
    direntList.forEach((dirent) => {
        const type = getType(dirent.name);
        const absPath = path.join(dirPath, dirent.name);

        if (dirent.isFile()) {
            if (!type) { return; }

            files.push({
                id: dirent.name,
                name: dirent.name,
                type: type,
                src: absPath,
                preview: type === 'mp4' ? absPath : getResizedPath(absPath),
            });
        } else {
            if (isCacheDir(path.join(dirPath, dirent.name))) { return; }

            dirs.push({
                name: dirent.name,
                src: path.join(dirPath, dirent.name)
            });
        }


    })

    sortByName(files);
    sortByName(dirs);

    return [files, dirs];
}

module.exports = { open, readFiles };

let activeFiles = [];
let indexer = null;

ipcMain.on('filesItemList', (event, dirPath) => {

    const [files, dirs] = readFiles(dirPath);

    activeFiles = files;
    indexer = new FilesIndexer(dirPath, activeFiles);

    win.webContents.send('filesItemListResult', dirs, files);
})

ipcMain.on('filesMakePreview', (event, src) => {
    getResized(src, function(result) {
        win.webContents.send('filesMakePreviewResult', src, result);
    })
})


ipcMain.on('filesIndexStep', () => {
    indexer.stepAsync().then(function(result) {
        win.webContents.send('filesIndexStepResult', result);
    });
})


ipcMain.on('openDetail', (event, selectedId) => {
    const detail = require('./detail');
    detail(win, activeFiles, selectedId);
})


ipcMain.on('openFramePuzzleSettings', (event, src) => {
	const framePuzzleSettings = require('./framePuzzleSettings');
	framePuzzleSettings.open(win, src);
})

ipcMain.on('openFramePuzzle', (event, src) => {
	const framePuzzle = require('./framePuzzle');
	framePuzzle.open(src);
})