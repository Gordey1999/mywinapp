const path = require('path')
const settings = require("../settings");
const fs = require("fs");
const { getResized, prepareResizedDir, isCacheDir } = require('../resize');
const { FilesIndexer } = require('../indexFiles');
const {getType, sortByName} = require("../tools");
const {WindowManager} = require("../window");


const winManager = WindowManager.getInstance('files');


function open(src = null, pointTo = null, win = null) {
    if (win !== null) {
        openPath(win, src, pointTo);
        return win;
    } else {
        return createWindow(src, pointTo);
    }
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
                preview: type === 'mp4' ? absPath : null,
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

function createWindow(initialPath, initialActive) {
    const win = winManager.createWindow({
        minWidth: 400,
        minHeight: 400,
    }, {
        src: initialPath ?? settings.rootDir,
        activeFiles: null,
        pointToInitial: initialActive,
        indexer: null
    })

    win.maximize();

    return win;
}


winManager.handle('filesInit', async (data) => {
    return {
        dirPath: data.src,
        pointTo: data.pointToInitial
    };
});

winManager.handle('dirPathList', async (data, rootDir) => {
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

winManager.handle('filesItemList', async (data, src) => {

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
    data.src = src;
    data.activeFiles = files;
    data.indexer = new FilesIndexer(src, files);

    for (let dir of dirs) {
        let dirFiles = null, dirDirs = null;

        try {
            [dirFiles, dirDirs] = readFiles(dir.src);
        } catch (e) {
            continue;
        }

        dir.filesCount = dirFiles.length;
        dir.dirsCount = dirDirs.length;

        const images = dirFiles.filter(file => settings.imageTypes.includes(file.type));

        if (images.length > 0) {
            dir.preview = images[0].src;
        }
    }

    const info = {
        dirsCount: dirs.length,
        filesCount: files.length,
        name: path.basename(src),
        src: src,
        parentSrc: path.dirname(src),
    }

    return { dirs, files, info };
})

function openPath(win, src, pointTo) {
    win.send('filesOpenPath', src, pointTo);
}

winManager.handle('filesMakePreview', async (data, src) => {
    return getResized(src);
})


winManager.handle('filesIndexStep', async (data) => {
    return data.indexer.stepAsync();
})


winManager.on('openDetail', (data, name) => {
    const detail = require('./detail');
    detail(data.activeFiles, name, data.win, (lastPointed) => {
        openPath(data.win, data.src, lastPointed);
    });
})


winManager.on('openFramePuzzleSettings', (data, src) => {
	const framePuzzleSettings = require('./framePuzzleSettings');
	framePuzzleSettings.open(data.win, src);
})

winManager.on('openFramePuzzle', (data, src) => {
	const framePuzzle = require('./framePuzzle');
	framePuzzle.open(src);
})