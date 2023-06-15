const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
//const imageinfo = require('imageinfo')

const { getResized } = require('./lib/resize');
const db = require('./lib/db');
const settings = require('./lib/settings');

let win;

// keys: Mousetrap

const createWindow = () => {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        autoHideMenuBar: true,
        // frame: false,
        webPreferences: {
            preload: path.join(__dirname, 'layout/files/preload.js')
        }
    })
    win.maximize();

    win.loadFile('layout/files/index.html');
}

app.whenReady().then(() => {
    createWindow()
})

app.on('window-all-closed', () => {
    db.close();
    if (process.platform !== 'darwin') app.quit()
})




const fs = require('fs')
const indexFiles = require("./lib/indexFiles");
const detail = require("./lib/detail");

function isImage(file) {
    return file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')
}

ipcMain.on('imagePreview', (e, file) => {
    console.log(file);
    return file.id;
});

ipcMain.on('sectionList', (event) => {
    const rows = db.prepare('SELECT dir, count(dir) AS cnt FROM files WHERE dir != ? GROUP BY dir ORDER BY dir ASC').all('');

    const root = { children: [] };
    for (const row of rows) {
        const parts = row.dir.split('\\');
        let current = root;
        let chain = '';
        while (parts.length) {
            const part = parts.shift();
            chain = path.join(chain, part);
            let found = false;
            for (let i = 0; i < current.children.length; i++) {
                if (current.children[i].name === part) {
                    current = current.children[i];
                    found = true;
                }
            }
            if (!found) {
                current.children.push({
                    name: part,
                    chain: chain,
                    children: [],
                })
                current = current.children.at(-1);
            }
        }
    }

    win.webContents.send('sectionListResult', root.children);
})

let activeFiles = [];

ipcMain.on('itemList', (event, section) => {

    const rows = db.prepare('SELECT * FROM files WHERE dir = ?').all(section);

    activeFiles = rows.map((item) => {
        return {
            id: item.id,
            name: item.name,
            type: item.type,
            src: path.join(settings.index.rootDir, item.dir, item.name),
            preview: getResized(item, win),
        }
    });
    win.webContents.send('itemListResult', activeFiles);
})



ipcMain.on("openIndexFiles", (event, dirPath) => {
    const indexFiles = require('./lib/indexFiles');
    indexFiles(win);
});


ipcMain.on('openDetail', (event, selectedId) => {
    const detail = require('./lib/detail');
    detail(win, activeFiles, selectedId);
})
ipcMain.on('openPuzzle', (event) => {
    const detail = require('./lib/puzzle');
    detail(win);
})




ipcMain.on('organizeDir', (event, currentDir) => {
    const files = fs.readdirSync(currentDir);
    const names = {};

    files.forEach(file => {
        const matches = file.match(/(.*?)(\d+)\.\w{1,4}/)
        if (matches && matches[1].length > 0) {
            if (typeof names[matches[1]] === 'undefined')
                names[matches[1]] = []

            names[matches[1]].push(file);
        }
    })

    Object.keys(names).forEach(name => {
        fs.mkdirSync(path.join(currentDir, name))

        names[name].forEach(file => {
            fs.renameSync(path.join(currentDir, file), path.join(currentDir, name, file))
        })
    })

    win.webContents.send('organizeDirResult');
})




