const { app, BrowserWindow, ipcMain, shell } = require('electron');
const fs = require('fs');
const crypto = require('crypto');
const path = require("path");

const db = require("../db")
const {getResizedPath} = require("../resize");
const settings = require('../settings').index;


let win = null;

function open(parent, files, selectedId) {

    win = new BrowserWindow({
        width: 800,
        height: 600,
        autoHideMenuBar: true,
        modal: true,
        parent: parent,
        webPreferences: {
            preload: path.join(__dirname, '../../layout/searchCopies/preload.js')
        }
    });

    win.maximize();

    win.loadFile('layout/searchCopies/index.html');
}

const stepLimit = 20;
let hashChunks = null;
let result = null;
let hashToFile = null;

ipcMain.on('searchCopiesInit', (event, path) => {

    hashChunks = [];
    hashToFile = {};

    const rows = db.prepare('SELECT hash, count(hash) as count FROM files WHERE hash <> ? GROUP BY hash HAVING count(hash) > 1').all('');

    const hashes = rows.map((row) => row.hash);
    for (let i = 0; i < rows.length; i += stepLimit) {
        hashChunks.push(hashes.slice(i, i + stepLimit));
    }
    win.send('searchCopiesInitResult', hashes.length);
});


ipcMain.on('searchCopiesStep', () => {

    if (hashChunks.length === 0) {
        makeResult();
        win.send('searchCopiesStepResult', result);
        return;
    }

    searchStep();

    win.send('searchCopiesStepResult', Object.keys(hashToFile).length);
});

function searchStep() {
    const hashes = hashChunks.shift();
    const params = hashes.map(() => '?').join(',');
    const rows = db.prepare(`SELECT * from files WHERE hash IN (${params})`).all(hashes);

    for (const row of rows) {

        const src = path.join(row.dir, row.name);
        if (!fs.existsSync(src)) continue;

        if (!hashToFile.hasOwnProperty(row.hash))
            hashToFile[row.hash] = [];

        hashToFile[row.hash].push({
            name: row.name,
            dir: row.dir,
            src: src,
            preview: getResizedPath(src),
            hash: row.hash,
        });
    }

    for (const [hash, files] of Object.entries(hashToFile)) {
        if (files.length < 2) {
            delete hashToFile[hash];
        }
    }
}

function update() {
    let changed = false;

    for (const [hash, files] of Object.entries(hashToFile)) {
        const left = [];

        for (const file of files)
            if (!fs.existsSync(file.src)) changed = true;
            else left.push(file);

        if (left.length < 2) {
            delete hashToFile[hash];
        } else {
            hashToFile[hash] = left;
        }
    }

    if (changed) {
        makeResult();
    }
    win.send('searchCopiesStepResult', result);
}

function makeResult() {
    result = {};

    for (const files of Object.values(hashToFile)) {
        for (const file of files) {
            if (!result.hasOwnProperty(file.dir))
                result[file.dir] = {
                    mtime: null, // todo mtime
                    count: 0,
                    copies: {}
                };

            for (const copy of files) {
                if (file === copy) continue;

                if (!result[file.dir].copies.hasOwnProperty(copy.dir))
                    result[file.dir].copies[copy.dir] = {};

                result[file.dir].copies[copy.dir][file.name] = file;
                result[file.dir].count++;
            }
        }
    }
}


app.on('browser-window-focus', () => {
    if (!win.isDestroyed() && hashToFile && result) {
        update();
    }
});

// todo check dirs mtime then check inner files exists

// in renderer delete file if in selected dir, delete self and/or copy dir in list

ipcMain.on('searchCopiesOpenFile', (event, file) => {
    shell.showItemInFolder(file);
});

module.exports = open;