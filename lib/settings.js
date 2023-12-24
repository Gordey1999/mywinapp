const { app } = require('electron');
const path = require('path');

const settings = {
    types: ['png', 'jpg', 'jpeg', 'webp', 'jfif', 'gif', 'mp4'],
    imageTypes: ['png', 'jpg', 'jpeg', 'webp', 'jfif'],
    homeDir: app.getPath('home'),
    rootDir: path.join(app.getPath('home'), 'Pictures'),
    cacheDir: path.join(app.getPath('home'), 'Pictures/appcache'),
    cacheDirName: 'appcache',
}

module.exports = Object.freeze(settings);