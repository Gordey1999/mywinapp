const path = require('path')
const settings = require("../settings");
const fs = require("fs");
const { getResized, prepareResizedDir, isCacheDir } = require('../resize');
const { FilesIndexer } = require('../indexFiles');
const {sortByName, getFileType, getFileExt} = require("../tools");
const {WindowManager} = require("../window");
const sharp = require("sharp");


const winManager = WindowManager.getInstance('files');
let sort = 'nameAsc';

let buffer = null;
let draggedFromWindow = null;


function open(src = null, pointTo = null, win = null) {
    if (win !== null) {
        openPath(win, src, pointTo);
        return win;
    } else {
        return createWindow(src, pointTo);
    }
}

function readFiles(dirPath, sort = 'nameAsc', withDates = true) {

    const direntList = fs.readdirSync(dirPath, {
        withFileTypes: true
    });

    prepareResizedDir(dirPath);

    const dirs = [];
    const files = [];
    direntList.forEach((dirent) => {
        const type = getFileType(dirent.name);
        const ext = getFileExt(dirent.name);
        const absPath = path.join(dirPath, dirent.name);

        if (dirent.isFile()) {
            if (!type) { return; }

            const info = {
                id: dirent.name,
                name: dirent.name,
                type: type,
                ext: ext,
                src: absPath,
                preview: type === 'video' ? absPath : null,
            };

            if (withDates) {
                const stats = fs.statSync(absPath);
                info.birthtime = stats.birthtime.getTime();
                info.mtime = stats.mtime.toISOString();
            }

            files.push(info);
        } else {
            if (isCacheDir(path.join(dirPath, dirent.name))) { return; }

            dirs.push({
                name: dirent.name,
                src: path.join(dirPath, dirent.name),
            });
        }
    })

    if (sort === 'nameAsc') {
        sortByName(files);
    } else if (sort === 'nameDesc') {
        sortByName(files, true);
    } else if (sort === 'dateAsc') {
        files.sort((a, b) => a.birthtime - b.birthtime);
    } else if (sort === 'dateDesc') {
        files.sort((a, b) => b.birthtime - a.birthtime);
    }

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

    win.on('focus', () => {
        win.send('filesOnFocus');
    });

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
    normalizePath(src);

    if (data.src === 'C:' || data.src === 'D:') {
        if (src === data.src  && fs.existsSync('D:')) {
            src = src === 'C:' ? 'D:' : 'C:';
        }
    }

    const [files, dirs] = readFiles(src + path.sep, sort);

    data.src = src;
    data.activeFiles = files;

    const info = {
        dirsCount: dirs.length,
        filesCount: files.length,
        name: path.basename(src),
        src: src,
        parentSrc: path.dirname(src),
        sort: sort,
        mtime: fs.statSync(src).mtime.toISOString(),
    }

    return { dirs, files, info };
})

function normalizePath(src) {
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

    if (src.endsWith('.')) {
        src = src.substring(0, src.length - 1); // fix for C:, D:
    }

    return src;
}

function openPath(win, src, pointTo) {
    win.send('filesOpenPath', src, pointTo);
}

function moveFiles(from, to, names, mode) {
    if (mode === 'move' && from === to) { return null; }

    const result = {
        files: [],
        dirs: [],
    }

    for (const name of names) {
        const src = path.join(from, name);

        const isDir = fs.lstatSync(src).isDirectory();

        if (!fs.existsSync(src)) {
            throw new Error('source file not exists ' + name);
        }

        const newName = getUniqueFileName(to, name);
        const dest = path.join(to, getUniqueFileName(to, newName));

        if (isDir) {
            if (mode === 'copy') {
                fs.cpSync(src, dest, {recursive: true});
                result.dirs.push(newName);
            } else if (mode === 'move') {
                fs.renameSync(src, dest);
                result.dirs.push(newName);
            }
        } else {
            if (mode === 'copy') {
                fs.copyFileSync(src, dest);
                result.files.push(newName);
            } else if (mode === 'move') {
                fs.renameSync(src, dest);
                result.files.push(newName);
            }
        }
    }

    return result;
}

function getUniqueFileName(dir, name) {
    if (!fs.existsSync(path.join(dir, name))) { return name; }

    const ext = path.extname(name);
    let basename = path.basename(name, ext);
    let index = 1;

    const match = basename.match(/^(.*) \((\d+)\)$/i);
    if (match) {
        basename = match[1];
        index = parseInt(match[2]) + 1;
    }

    while (true) {
        let newName = `${basename} (${index})${ext}`;

        if (!fs.existsSync(path.join(dir, newName))) {
            return newName;
        }
        index++;
    }
}

function getTrashDirPath(src) {
    const disk = src.substring(0, 1);

    if (settings.homeDir.startsWith(disk)) {
        return path.join(settings.rootDir, settings.trashDirName);
    } else {
        return path.join(disk + ':', settings.trashDirName);
    }
}

winManager.handle('filesMakePreview', async (data, src, mtime) => {
    return await getResized(src, mtime);
})

winManager.handle('filesDirectoryInfo', async (data, src) => {
    try {
        const [files, dirs] = readFiles(src, 'nameAsc', false);

        let firstImage = files.find(file => file.type === 'image' || file.type === 'gif');
        //prepareResizedDir(src);

        return {
            filesCount: files.length,
            dirsCount: dirs.length,
            preview: firstImage ? await getResized(firstImage.src) : null,
        };
    } catch (e) {
        return {}
    }
})

winManager.handle('filesCheckUpdated', async (data, src) => {
    return {
        mtime: fs.statSync(src).mtime.toISOString(),
        sort: sort,
    }
})

// todo remove
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

winManager.handle('changeSort', async (data, newSort) => {
    sort = newSort;
})

winManager.on('filesCut', async (data, src, selected) => {
    buffer = {
        mode: 'move',
        dir: src,
        names: selected,
        updateWin: data.win,
    }
});

winManager.on('filesCopy', async (data, src, selected) => {
    buffer = {
        mode: 'copy',
        dir: src,
        names: selected,
    }
});

winManager.handle('filesPaste', async (data, to) => {
    try {
        if (buffer === null) { return null; }

        const res = moveFiles(buffer.dir, to, buffer.names, buffer.mode);

        if (buffer.updateWin && buffer.updateWin !== data.win && !buffer.updateWin.isDestroyed()) {
            buffer.updateWin.send('filesOnFocus');
        }

        return res;
    } catch (e) {
        return { error: e.message };
    }
})

winManager.handle('filesDelete', async (data, src, selected) => {
    try {
        const dest = getTrashDirPath(src);
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }

        return moveFiles(src, dest, selected, 'move');
    } catch (e) {
        return { error: e.message };
    }
})

winManager.on('filesDragStart', async (data, src, selected) => {
    draggedFromWindow = data.win;

    const images = selected.filter((item) => getFileType(item) === 'image');
    const icon = images.length > 0 ? path.join(src, images[0]) : settings.dragImage;

    data.sender.startDrag({
        files: selected.map((name) => path.join(src, name)),
        icon: await buildDragIcon(icon, selected.length),
    })
})

winManager.handle('filesDrop', async (data, to, paths) => {
    try {
        const names = paths.map((item) => path.basename(item));
        const from = path.dirname(paths[0]);

        const res = moveFiles(from, to, names, 'move');

        if (draggedFromWindow !== null && draggedFromWindow !== data.win && !draggedFromWindow.isDestroyed()) {
            draggedFromWindow.send('filesOnFocus');
        }

        return res;
    } catch (e) {
        return { error: e.message };
    }
})

async function buildDragIcon(src, count, throwOnFail = false) {
    const iconSrc = path.join(settings.cacheDir, 'drag_icon.png');

    try {
        await sharp(src)
            .resize({
                width: 100,
                height: 100,
                fit: 'cover'
            })
            .composite([
                {
                    input: {
                        text: {
                            text: '<span color="white" bgcolor="red">(' + count + ')</span>',
                            font: 'system-ui',
                            width: 100,
                            height: 30,
                            align: 'center',
                            rgba: true,
                        }
                    }
                }
            ]).toFile(iconSrc);
    } catch (e) {
        if (throwOnFail) { throw e; }
        return buildDragIcon(settings.dragImage, count, true);
    }


    return iconSrc;
}