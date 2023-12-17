const { BrowserWindow, ipcMain, screen } = require('electron');
const path = require("path");
const sharp = require("sharp");


let windows = [];
let positions = [];
let imageSource = null;
let puzzleSize = 4;
const maxOffset = 20;

async function open(imageSrc) {
    if (windows.length) { return; }

    imageSource = imageSrc;

    const image = sharp(imageSrc);
    const meta = await image.metadata();

    const [winWidth, winHeight] = calculatePuzzleSize(meta.width, meta.height);

    const count = puzzleSize * puzzleSize;

    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            [posX, posY] = getRandomPosition(winWidth, winHeight);

            const win = makeWindow(winWidth, winHeight, posX, posY);

            windows.push(win);
            positions.push([posX, posY]);
        }, i * 100)
    }
}

function calculatePuzzleSize(width, height) {
    const max = 900 / puzzleSize;

    let winWidth, winHeight;
    if (width > height) {
        winWidth = max;
        winHeight = Math.floor(max * (height / width));
    } else {
        winHeight = max;
        winWidth = Math.floor(max * (width / height));
    }

    return [winWidth, winHeight];
}

function getRandomPosition(winWidth, winHeight) {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    return [
        Math.floor(Math.random() * (width - winWidth)),
        Math.floor(Math.random() * (height - winHeight)),
    ]
}

function makeWindow(width, height, posX, posY) {
    const win = new BrowserWindow({
        width: width,
        height: height,
        x: posX,
        y: posY,
        minimizable: false,
        maximizable: false,
        fullscreenable: false,
        roundedCorners: false,
        resizable: false,
        frame: false,
        show: false,
        alwaysOnTop: true,
        webPreferences: {
            preload: path.join(__dirname, '../../layout/framePuzzle/preload.js'),
            nodeIntegration: true
        }
    });

    win.loadFile('layout/framePuzzle/index.html');

    win.webContents.on('did-finish-load', async () => {
        win.show();
    })

    win.on('moved', () => {
        // console.log('moved');
        // console.log(event);
        // console.log(sizes);

        concatWithNearest(win, width, height);
        if (checkResolved(width, height)) {
            playSolved();
            windows = [];
            puzzleSize++;
        }
    })

    return win;
}

function getWindowIndex(winId) {
    for (let i = 0; i < windows.length; i++) {
        if (windows[i].id === winId) {
            return i;
        }
    }
    return 0;
}

function getWindowPosition(i) {
    return [
        i % puzzleSize,
        Math.floor(i / puzzleSize)
    ]
}

ipcMain.handle('framePuzzleInit', async(event) => {
    [x, y] = getWindowPosition(getWindowIndex(event.sender.id));
    return {
        src: imageSource,
        x: x,
        y: y,
        size: puzzleSize,
    };
});

module.exports = open;

function concatWithNearest(win, width, height) {
    const i = getWindowIndex(win.id);
    positions[i] = win.getPosition();

    let minDist = 1000;
    let offsetX = 0;
    let offsetY = 0;

    for (let j = 0; j < windows.length; j++) {
        if (windows[j] === win) { continue; }

        const xDist = positions[j][0] - positions[i][0];
        const yDist = positions[j][1] - positions[i][1];

        if (Math.abs(xDist) - width < Math.abs(minDist) && Math.abs(yDist) < maxOffset) {
            offsetY = yDist;
            offsetX = Math.abs(xDist) - width;
            if (xDist < 0) offsetX = -offsetX;

            minDist = Math.abs(offsetX);
        }
        if (Math.abs(yDist) - height < Math.abs(minDist) && Math.abs(xDist) < maxOffset) {
            offsetX = xDist;
            offsetY = Math.abs(yDist) - height;
            if (yDist < 0) offsetY = -offsetY;

            minDist = Math.abs(offsetY);
        }
    }

    if (minDist < maxOffset) {
        positions[i][0] += offsetX;
        positions[i][1] += offsetY;

        win.setBounds({
            width: width,
            height: height,
            x: positions[i][0],
            y: positions[i][1]
        })
    }
}

function checkResolved(width, height) {
    let [xStart, yStart] = positions[0];

    for (let i = 1; i < windows.length; i++) {
        let [xp, yp] = getWindowPosition(i);
        let [x, y] = positions[i];

        const needX = xStart + (width * xp);
        const needY = yStart + (height * yp);

        if (Math.abs(x - needX) > maxOffset || Math.abs(y - needY) > maxOffset) {
            return false;
        }
    }

    return true;
}

function playSolved() {
    const winList = windows.slice();

    winList.sort(() => Math.random() - 0.5); // shuffle

    windowSolved(winList[0]);

    for (let i = 1; i < winList.length; i++) {
        setTimeout(() => {
            windowSolved(winList[i]);
        }, 2000 + i * 150)
    }
}

function windowSolved(win) {
    win.webContents.send('framePuzzleSolved');

    setTimeout(() => {
        win.close();
    }, 3000);
}