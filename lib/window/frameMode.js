const { BrowserWindow, ipcMain, shell } = require('electron');
const path = require("path");
const {initWindow} = require("../window");
const sharp = require("sharp");
const {windowProportionalResize} = require("../windowProportionalResize");


let win = null;
let imageSource = null;

function open(imageSrc) {

    win = new BrowserWindow({
        width: 100,
        height: 100,
        frame: false,
        show: false,
        alwaysOnTop: true,
        webPreferences: {
            preload: path.join(__dirname, '../../layout/frameMode/preload.js'),
            nodeIntegration: true
        }
    });

    win.loadFile('layout/frameMode/index.html');

    initWindow(win);

	if (!imageSrc.includes('\\')) {
		imageSrc = path.join(__dirname,'../../layout/img/', imageSrc);
	}

    imageSource = imageSrc;

    win.webContents.on('did-finish-load', async () => {
        const image = sharp(imageSrc);
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

ipcMain.handle('frameModeInit', async() => {
    return imageSource;
});

module.exports = open;