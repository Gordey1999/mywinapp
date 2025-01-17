const { app } = require('electron');
const path = require('path');

const home = app.getPath('home');

const settings = {
    types: {
        image: [ 'png', 'jpg', 'jpeg', 'webp', 'jfif', 'gif' ],
        gif: [ 'gif' ],
        video: [ 'mp4' ],
    },
    homeDir: home,
    rootDir: path.join(home, 'Pictures'),
    cacheDir: path.join(home, 'Pictures\\appcache'),
    trashDirName: 'trash',
    cacheDirName: 'appcache',
    editApp: 'C:\\Program Files\\paint.net\\paintdotnet.exe',
    vlcApp: 'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe',
    dragImage: path.join(__dirname, '../layout/assets/img/drag.png'),
}

module.exports = Object.freeze(settings);