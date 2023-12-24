const { app, ipcMain} = require('electron')
const path = require('path')
//const imageinfo = require('imageinfo')
const util = require('util');
const settings = require('./lib/settings');

const db = require('./lib/db');

let win;

const winFiles = require('./lib/window/files');
app.whenReady().then(() => {
    const file = getSelectedFile(process.argv);
    if (file) {
        const dir = path.dirname(file);
        const name = path.basename(file);
        const [ files, dirs ] = winFiles.readFiles(dir);

        const detail = require('./lib/window/detail');
        detail(null, files, name);
    } else {
        win = winFiles.open();
    }
});

if (app.requestSingleInstanceLock()) {
    app.on('second-instance', (event, argv, workingDirectory, additionalData = null) => {

        if (win) {
            const file = getSelectedFile(argv);
            if (file) {
                const dir = path.dirname(file);
                const name = path.basename(file);
                const [ files, dirs ] = winFiles.readFiles(dir);

                const detail = require('./lib/window/detail');
                detail(win, files, name);
            } else {
                if (win.isMinimized()) {
                    win.restore();
                }
                win.focus();
            }
        }

        // const log_file = fs.createWriteStream(__dirname + '/debug.log', {flags : 'a'});
        // log_file.write(util.format(argv) + "\n");
        // log_file.write(util.format(additionalData) + "\n");
        // log_file.close();
    },);
} else {
    app.quit();
}

function getSelectedFile(args) {
    for (const arg of args) {
        for (const type of settings.types) {
            if (arg.endsWith(`.${type}`)) {
                return arg;
            }
        }
    }
    return null;
}



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

ipcMain.on('openMangaMode', (event, currentDir) => {
    const mangaMode = require('./lib/window/mangaMode');
    mangaMode(win, currentDir);
})

ipcMain.on('openFrameMode', (event, src) => {
    const frameMode = require('./lib/window/frameMode');
    frameMode(src);
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




