const { app } = require('electron');
const path = require('path');

const home = app.getPath('home');

const settings = {
    types: ['png', 'jpg', 'jpeg', 'webp', 'jfif', 'gif', 'mp4'],
    imageTypes: ['png', 'jpg', 'jpeg', 'webp', 'jfif'],
    homeDir: home,
    rootDir: path.join(home, 'Pictures'),
    cacheDir: path.join(home, 'Pictures/appcache'),
    cacheDirName: 'appcache',
}

module.exports = Object.freeze(settings);