const fs = require('fs');
const sharp = require('sharp');
const path = require("path");

const settings = require('./settings');

function prepareResizedDir(dir) {
    const cachePath = dir.substring(settings.index.rootDir.length);
    const pathParts = cachePath.split('\\').filter(i => i);
    pathParts.unshift(settings.cacheDir);

    let current = settings.index.rootDir;
    for (const part of pathParts) {
        current = path.join(current, part);
        if (!fs.existsSync(current)) {
            fs.mkdirSync(current);
        }
    }
}

function getResizedPath(absPath) {
    const cachePath = getCachePath(absPath);

    if (fs.existsSync(cachePath)) return cachePath;

    return null;
}

function getResized(absPath, callback) {
    const cachePath = getCachePath(absPath);

    sharp(absPath).resize({
        width: 200,
        height: 200,
        fit: 'cover'
    }).toFile(cachePath).then(() => {
        callback(cachePath);
    });
}

function getCachePath(absPath) {
    const relPath = absPath.substring(settings.index.rootDir.length);
    const cacheDir = path.join(settings.index.rootDir, settings.cacheDir);
    return path.join(cacheDir, relPath + '.jpg');
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

module.exports = {getResized, getResizedPath, getResizedPuzzle, prepareResizedDir};