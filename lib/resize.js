const fs = require('fs');
const sharp = require('sharp');
const path = require("path");

const settings = require('./settings');

function prepareResizedDir(dir) {
    const [ cachePath, parts ] = getCachePathParts(dir);

    if (!fs.existsSync(cachePath)) {
        fs.mkdirSync(cachePath);
    }

    let current = cachePath;
    for (const part of parts) {
        current = path.join(current, part);
        if (!fs.existsSync(current)) {
            fs.mkdirSync(current);
        }
    }
}

function getResizedPath(absPath) {
    const cachePath = getFileCachePath(absPath);

    if (fs.existsSync(cachePath)) return cachePath;

    return null;
}

function getResized(absPath, callback) {
    const cachePath = getFileCachePath(absPath);

    sharp(absPath).resize({
        width: 200,
        height: 200,
        fit: 'cover'
    }).toFile(cachePath).then(() => {
        callback(cachePath);
    });
}

function getResizedPuzzle(file, size, callback) {
    const absPath = path.join(settings.index.rootDir, file.dir, file.name);

    const cachePath = path.join(settings.index.rootDir, settings.cacheDir, 'puzzle', `${file.id}_${size}.jpg`);

    const image = sharp(absPath);
    image.resize({
        width: size,
        height: size,
        fit: 'outside'
    }).toFile(cachePath).then(() => {
        return sharp(cachePath).metadata();
    }).then((meta) => {
        callback(cachePath, meta.width, meta.height);
    })
}

function isCacheDir(dirAbsPath) {
    const [ cachePath, parts ] = getCachePathParts(dirAbsPath);
    return cachePath === dirAbsPath;
}

function getCachePathParts(absPath) {
    const parts = absPath.split(path.sep);
    const disk = parts.shift().substring(0, 1);

    if (settings.homeDir.startsWith(disk)) {
        return [ settings.cacheDir, parts ];
    } else {
        return [ path.join(disk + ':', settings.cacheDirName), parts ];
    }
}

function getFileCachePath(absPath) {
    absPath += '.jpg';
    const [ cachePath, parts ] = getCachePathParts(absPath);
    return path.join(cachePath, ...parts);
}

module.exports = {getResized, getResizedPath, getResizedPuzzle, prepareResizedDir, isCacheDir};