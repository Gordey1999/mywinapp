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
	    icon: '../../layout/assets/icons/logo2_256.png',
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
    return {
        dirName: path.basename(settings.rootDir),
        dirPath: settings.rootDir
    };
})

ipcMain.handle('dirPathList', async (event, rootDir) => {
    rootDir += path.sep;
    const result = fs.readdirSync(rootDir, { withFileTypes: true })
        .filter(
            dirent => dirent.isDirectory() && !isCacheDir(path.join(rootDir, dirent.name))
        )
        .map((dirent) => {
            return {
                name: dirent.name,
                src: path.join(rootDir, dirent.name)
            }
        });

    for (const dir of result) {
        try {
            dir.hasChildren = fs.readdirSync(dir.src, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory()).length > 0;
        } catch (e) {}
    }

    return sortByName(result);
});

ipcMain.handle('filesItemList', async (event, src) => {

    src = path.normalize(src);
    if (src.endsWith(path.sep)) {
        src = src.substring(0, src.length - 1);
    }

    if (!fs.existsSync(src)) {
        return { error: 'path not found!' }
    }

    if (!fs.lstatSync(src).isDirectory()) {
        src = path.dirname(src);
    }

    const [files, dirs] = readFiles(src);
    activeFiles = files;
    indexer = new FilesIndexer(src, activeFiles);

    return { dirs, files, src };
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