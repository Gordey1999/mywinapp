const { ipcMain } = require('electron')
const path = require('path')
const settings = require("../settings");
const fs = require("fs");
const {sortByName, getFileType} = require("../tools");
const {WindowManager} = require("../window");


const winManager = WindowManager.getInstance('mangaMode');

function open(parent, dir = null) {

    win = winManager.createWindow({
        minWidth: 400,
        minHeight: 400,
    }, {
        src: dir ?? settings.rootDir
    });

    win.maximize();

    return win;
}

module.exports = open;

winManager.on('mangaModeInit', (data) => {
    const direntList = fs.readdirSync(data.src, {
        withFileTypes: true
    });

    const mangaList = [];
    direntList.forEach((dirent) => {
        if (dirent.isFile()) {
            return;
        }

        let dirPath = path.join(data.src, dirent.name);

        const mangaFiles = fs.readdirSync(dirPath, {
            withFileTypes: true
        });

        let files = [];
        mangaFiles.forEach((file) => {
            const type = getFileType(file.name);
            const filePath = path.join(dirPath, file.name);

            if (file.isFile() && type === 'image' || type === 'gif') {
                files.push({
                    name: file.name,
                    src: filePath
                })
            }
        });

        if (!files.length) {
            return;
        }

        sortByName(files);

        mangaList.push({
            name: dirent.name,
            src: dirPath,
            files: files,
            preview: files[0].src
        });
    });

    sortByName(mangaList);

    data.win.webContents.send('mangaModeInitResult', mangaList);
});

winManager.on('mangaModeClose', (data) => {
    data.win.close();
});

winManager.on('openMangaDetail', (data, files) => {
    const mangaDetail = require('./mangaDetail');
    mangaDetail(data.win, files);
})