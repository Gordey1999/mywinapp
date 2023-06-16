const fs = require('fs');
const sharp = require('sharp');
const path = require("path");

const settings = require('./settings');
const {cache} = require("sharp");

function getResized(file, win) {
    if (file.type === 'mp4') { return null; }

    const imagePath = path.join(settings.index.rootDir, file.dir, file.name);
    const cacheDir = path.join(settings.index.rootDir, settings.cacheDir, file.id % 50 + '');
    const cachePath = path.join(cacheDir, file.id + '.jpg');

    if (fs.existsSync(cachePath)) return cachePath;

    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir);
    }

    sharp(imagePath).resize({
        width: 150,
        height: 150,
        fit: 'cover'
    }).toFile(cachePath).then(() => {
        win.send('previewResult', {
            id: file.id,
            path: cachePath,
        });
    });

    return null;
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

module.exports = {getResized, getResizedPuzzle};