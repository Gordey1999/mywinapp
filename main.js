const { app, ipcMain, shell} = require('electron')
const path = require('path')
const { exec } = require("child_process")
const settings = require('./lib/settings');

//const db = require('./lib/db');
const {getFileExt} = require("./lib/tools");

const winDetail = require('./lib/window/detail');
const winFiles = require('./lib/window/files');
const fs = require('fs');


// todo сделать деталку синглтоном. Если открывается новая, закрывать старую
// todo если открывается вторая деталка без файлов???

// если окно уже открыто, то после закрытия деталки меняем путь в файлах
// todo package to build exe

app.whenReady().then(() => {
    const file = getSelectedFile(process.argv);

    if (file) {
        openFile(file);
    } else {
        winFiles.open();
    }
});

if (app.requestSingleInstanceLock()) {
    app.on('second-instance', (event, argv, workingDirectory, additionalData = null) => {

        const file = getSelectedFile(argv);
        if (file) {
            openFile(file);
        } else {
            winFiles.open();
        }

        // const log_file = fs.createWriteStream(__dirname + '/debug.log', {flags : 'a'});
        // log_file.write(util.format(argv) + "\n");
        // log_file.write(util.format(additionalData) + "\n");
        // log_file.close();
    },);
} else {
    app.quit();
}

function openFile(file) {
    const dir = path.dirname(file);
    const name = path.basename(file);
    const [ files ] = winFiles.readFiles(dir);

    winDetail(files, name, win, (pointTo) => {
        winFiles.open(dir, pointTo, win);
    });
}

function getSelectedFile(args) {
    for (const arg of args) {
        if (getFileExt(arg)) {
            return arg;
        }
    }
    return null;
}



app.on('window-all-closed', () => {
    //db.close();
    if (process.platform !== 'darwin') app.quit();
})



ipcMain.on("openIndexFiles", (event, dirPath) => {
});



ipcMain.on('openPuzzle', (event) => {
    return;
    const puzzle = require('./lib/window/puzzle');
	puzzle(win);
})
ipcMain.on('openSearchCopies', (event) => {
    return;
    const searchCopies = require('./lib/window/searchCopies');
    searchCopies(win);
})

ipcMain.on('openMangaMode', (event, currentDir) => {
    const mangaMode = require('./lib/window/mangaMode');
    mangaMode(currentDir);
})

ipcMain.on('openFrameMode', (event, src) => {
    const frameMode = require('./lib/window/frameMode');
    frameMode(src);
})

ipcMain.on('openNewWindow', (event, src) => {
    const mangaMode = require('./lib/window/mangaMode');
    winFiles.open(src);
});

ipcMain.on('openInExplorer', (event, src) => {
    shell.showItemInFolder(src);
})

ipcMain.on('openInPaint', (event, src) => {
    if (src.includes('"') || src.includes("'")) { return; }
    exec(`"${settings.editApp}" "${src}"`);
})

ipcMain.on('openInVlc', (event, src) => {
    if (src.includes('"') || src.includes("'")) { return; }
    exec(`"${settings.vlcApp}" "${src}"`);
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




