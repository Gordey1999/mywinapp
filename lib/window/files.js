const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const settings = require("../settings");
const fs = require("fs");
const { getResized, getResizedPath, prepareResizedDir, isCacheDir } = require('../resize');
const { FilesIndexer } = require('../indexFiles');
const {getType, sortByName} = require("../tools");
const {initWindow} = require("../window");


let win = null;

let initialPath = null;

function open(initialAbsPath = null) {

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

    initialPath = initialAbsPath;

    return win;
}

function readFiles(dirPath) {

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

ipcMain.handle('filesInit', async (event) => {
    let relativePath = '';
    const result = [];

    if (initialPath === null) {
        initialPath = settings.rootDir;
    }

    if (initialPath.startsWith(settings.rootDir)) {
        relativePath = initialPath.substring(settings.rootDir.length);

        result.push({
            dirs: [ {
                name: path.basename(settings.rootDir),
                src: settings.rootDir
            } ],
            selected: path.basename(settings.rootDir)
        });

        if (!relativePath.length) {
            return result;
        }
    } else {
        relativePath = initialPath;
    }

    const parts = relativePath.split(path.sep);

    let currentPath = parts.shift() + '\\';

    for (const part of parts) {

        const direntList = fs.readdirSync(currentPath, {
            withFileTypes: true
        });

        const dirs = [];

        direntList.forEach((dirent) => {
            if (dirent.isDirectory()) {
                if (isCacheDir(path.join(currentPath, dirent.name))) { return; }

                dirs.push({
                    name: dirent.name,
                    src: path.join(currentPath, dirent.name)
                });
            }
        })

        result.push({
            dirs: dirs,
            selected: part
        });

        currentPath = path.join(currentPath, part);
    }

    return result;
})

ipcMain.handle('filesItemList', async (event, dirPath) => {

    const [files, dirs] = readFiles(dirPath);
    activeFiles = files;
    indexer = new FilesIndexer(dirPath, activeFiles);

    return { dirs, files };
})

ipcMain.handle('filesMakePreview', async (event, src) => {
    return getResized(src);
})


ipcMain.handle('filesIndexStep', async (event) => {
    return indexer.stepAsync();
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