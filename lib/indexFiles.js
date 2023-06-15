const { BrowserWindow, ipcMain } = require('electron');
const path = require("path");

const db = require('./db');
const fs = require("fs");
const {getResized} = require("./resize");
const settings = require('./settings').index;


let win = null;

function index(parent) {

    win = new BrowserWindow({
        width: 400,
        height: 150,
        autoHideMenuBar: true,
        resizable: false,
        //transparent: true,
        //alwaysOnTop: true,
        //closable: false,
        //kiosk: true,
        modal: true,
        parent: parent,
        webPreferences: {
            preload: path.join(__dirname, '../layout/indexFiles/preload.js')
        }
    })

    win.loadFile('layout/indexFiles/index.html')

    // todo stop
}
module.exports = index;


let count, added, stop;
let nextDirs = [];

ipcMain.on("indexFilesStep", () => {
    if (!nextDirs.length)
    {
        count = 0;
        added = 0;
        nextDirs.push('');
    }

    setTimeout(() => {
        indexDir(nextDirs.shift());
    }, 1);
});

function indexDir(dirPath = '') {
    send(`read dir \\${dirPath}`);

    const direntList = fs.readdirSync(path.join(settings.rootDir, dirPath), {
        withFileTypes: true
    });
    const files = [];
    const dirs = [];
    direntList.forEach((dirent) => {
        if (dirent.isFile()) {
            files.push(dirent.name);
        } else if (!settings.ignoreDirs.includes(dirent.name)) {
            dirs.push(dirent.name);
        }
    })

    saveFiles(dirPath, files);

    for (const dir of dirs) {
        nextDirs.push(path.join(dirPath, dir));
    }
    send(null, true);
}

function saveFiles(dir, files) {
    const dbFiles = db.prepare('SELECT id, name FROM files WHERE dir = ?').all(dir);
    const dbNames = dbFiles.map((row) => {
        return row.name;
    })
    const newFiles = files.filter(name => !dbNames.includes(name));

    const insert = db.prepare('INSERT INTO files (dir, name, type) VALUES (@dir, @name, @type)');
    for (const name of newFiles) {

        if (stop) { return; }

        const type = getType(name);
        if (type === null) { continue; }

        added++;
        if (added % 100 === 0) {
            send();
        }
        insert.run({
            dir: dir,
            name: name,
            type: type,
        })
    }

    count += files.length;
}

function send(message = null, stepFinished = false) {
    win.webContents.send('indexFilesStepResult', {
        count: count,
        added: added,
        message: message,
        stepFinished: stepFinished,
        finished: stepFinished && nextDirs.length === 0,
    });
}

function getType(name) {
    for (const type of settings.types) {
        if (name.endsWith(type)) {
            return type;
        }
    }
    return null;
}

