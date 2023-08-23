const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
//const imageinfo = require('imageinfo')

const db = require('./lib/db');
const settings = require('./lib/settings');

let win;

const winFiles = require('./lib/window/files');
app.whenReady().then(() => {
    win = winFiles();
})

app.on('window-all-closed', () => {
    db.close();
    if (process.platform !== 'darwin') app.quit();
})



ipcMain.on("openIndexFiles", (event, dirPath) => {
});



ipcMain.on('openPuzzle', (event) => {
    const puzzle = require('./lib/window/puzzle');
	puzzle(win);
})
ipcMain.on('openSearchCopies', (event) => {
    const searchCopies = require('./lib/window/searchCopies');
    searchCopies(win);
})




const fs = require('fs');
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




