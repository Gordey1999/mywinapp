const { BrowserWindow, ipcMain, shell } = require('electron');
const path = require("path");
const {WindowManager} = require("../window");
const sharp = require("sharp");
const {windowProportionalResize} = require("../windowProportionalResize");

const winManager = WindowManager.getInstance('frameMode');

function open(imageSource) {

    if (!imageSource.includes('\\')) {
        imageSource = path.join(__dirname,'../../layout/assets/img/', imageSource);
    }

    const win = winManager.createWindow({
        width: 100,
        height: 100,
        show: false,
        alwaysOnTop: true,
    }, {
        imageSource: imageSource
    });

    win.webContents.on('did-finish-load', async () => {
        const image = sharp(imageSource);
        const meta = await image.metadata();

        const width = meta.width;
        const height = meta.height;

        const max = 400;

        let resultWidth, resultHeight;
        if (width > height) {
            resultWidth = max;
            resultHeight = max * (height / width);
        } else {
            resultHeight = max;
            resultWidth = max * (width / height);
        }

        win.setContentSize(Math.floor(resultWidth), Math.floor(resultHeight), true);
        win.show();
        windowProportionalResize(win, width / height);
    })
}

winManager.handle('frameModeInit', async(data) => {
    return data.imageSource;
});

module.exports = open;