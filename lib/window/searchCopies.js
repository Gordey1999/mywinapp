const { app, ipcMain, shell } = require('electron');
const fs = require('fs');
const path = require("path");

const db = require("../db")
const {getResizedPath} = require("../resize");
const {WindowManager} = require("../window");

const winManager = WindowManager.getInstance('searchCopies');

const stepLimit = 20;

function open(parent) {

    const win = winManager.createWindow({
        minWidth: 400,
        minHeight: 400,
        modal: true,
        parent: parent,
    }, {
        hashChunks: [],
        result: null,
        hashToFile: {}
    });

    win.maximize();

    win.on('focus', (event) => {
        const data = winManager.getData(event.sender.id);
        if (data.hashToFile && data.result) {
            update(data);
        }
    });
}

winManager.on('searchCopiesInit', (data) => {
    const rows = db.prepare('SELECT hash, count(hash) as count FROM files WHERE hash <> ? GROUP BY hash HAVING count(hash) > 1').all('');

    const hashes = rows.map((row) => row.hash);
    for (let i = 0; i < rows.length; i += stepLimit) {
        data.hashChunks.push(hashes.slice(i, i + stepLimit));
    }
    data.win.send('searchCopiesInitResult', hashes.length);
});


winManager.on('searchCopiesStep', (data) => {

    if (data.hashChunks.length === 0) {
        makeResult(data);
        data.win.send('searchCopiesStepResult', data.result);
        return;
    }

    searchStep(data);

    data.win.send('searchCopiesStepResult', Object.keys(data.hashToFile).length);
});

function searchStep(data) {
    const hashes = data.hashChunks.shift();
    const params = hashes.map(() => '?').join(',');
    const rows = db.prepare(`SELECT * from files WHERE hash IN (${params})`).all(hashes);

    for (const row of rows) {

        const src = path.join(row.dir, row.name);
        if (!fs.existsSync(src)) continue;

        if (!data.hashToFile.hasOwnProperty(row.hash))
            data.hashToFile[row.hash] = [];

        data.hashToFile[row.hash].push({
            name: row.name,
            dir: row.dir,
            src: src,
            preview: getResizedPath(src),
            hash: row.hash,
        });
    }

    for (const [hash, files] of Object.entries(data.hashToFile)) {
        if (files.length < 2) {
            delete data.hashToFile[hash];
        }
    }
}

function update(data) {
    let changed = false;

    for (const [hash, files] of Object.entries(data.hashToFile)) {
        const left = [];

        for (const file of files)
            if (!fs.existsSync(file.src)) changed = true;
            else left.push(file);

        if (left.length < 2) {
            delete data.hashToFile[hash];
        } else {
            data.hashToFile[hash] = left;
        }
    }

    if (changed) {
        makeResult(data);
    }
    data.win.send('searchCopiesStepResult', data.result);
}

function makeResult(data) {
    data.result = {};

    for (const files of Object.values(data.hashToFile)) {
        for (const file of files) {
            if (!data.result.hasOwnProperty(file.dir))
                data.result[file.dir] = {
                    mtime: null, // todo mtime
                    count: 0,
                    copies: {}
                };

            for (const copy of files) {
                if (file === copy) continue;

                if (!data.result[file.dir].copies.hasOwnProperty(copy.dir))
                    data.result[file.dir].copies[copy.dir] = {};

                data.result[file.dir].copies[copy.dir][file.name] = file;
                data.result[file.dir].count++;
            }
        }
    }
}

// todo check dirs mtime then check inner files exists

// in renderer delete file if in selected dir, delete self and/or copy dir in list

winManager.on('searchCopiesOpenFile', (data, file) => {
    shell.showItemInFolder(file);
});

module.exports = open;