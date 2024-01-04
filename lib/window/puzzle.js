const {BrowserWindow, ipcMain} = require("electron");
const path = require("path");

const { getResizedPuzzle } = require("../resize");
const db = require('../db');

let win = null;
function open(parent) {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        autoHideMenuBar: true,
        fullscreen: true,
        show: false,
        modal: true,
        parent: parent,
        webPreferences: {
            preload: path.join(__dirname, '../../layout/puzzle/preload.js'),
            nodeIntegration: true,
        }
    });

    win.loadFile('layout/puzzle/index.html');

    win.webContents.on('did-finish-load', () => {
        win.show();
    });



    ipcMain.once('closePuzzle', (event, selectedId) => {
        win.close();
    });
}

ipcMain.on('puzzleGetBlock', (event, mapEnd = null, nextBlockY = null) => {
    const pm = new PuzzleMaker(10, 10);
    pm.setWidthPx(1536);

    if (mapEnd !== null) {
        //mapEnd = mapEnd.map((item) => item === true);
        pm.setMapStart(mapEnd);
        pm.setOffsetY(nextBlockY);
    }
    const puzzle = pm.makePuzzle();

    win.send('puzzleGetBlockResult', puzzle, {
        mapEnd: pm.getMapEnd(),
        nextBlockY: pm.getNextBlockY(),
        pieceWidth: pm.getPieceWidth()
    });
});

ipcMain.on('puzzleGetImage', (event, size, pieceWidth, imageIndex, imageId = 0) => {
    const dpr = 1.25;

    const width = Math.floor(size * pieceWidth * dpr);

    const image = imageId
        ? db.prepare('SELECT * FROM files WHERE id = ?').get(imageId)
        : db.prepare('SELECT * FROM files WHERE type IN (?, ?) ORDER BY RANDOM() LIMIT 1').get('png', 'jpg');

    getResizedPuzzle(image, width, (src, origW, origH) => {
        const imw = origW / dpr;
        const imh = origH / dpr;
        const blockW = pieceWidth * size;

        let cl = null;
        let offset = null;
        let initStyles = {};
        if (imw > imh) {
            cl = 'horizontal';
            offset = blockW / 2 - imw / 2;
            // todo offset
            initStyles.left = (Math.random() > 0.5 ? imw : -imw);
        } else {
            cl = 'vertical';
            offset = blockW / 2 - imh / 2;
            initStyles.top = (Math.random() > 0.5 ? imh : -imh);
        }
        const str = `<img class="${cl}" src="${src}" data-id="${image.id}" data-offset="${offset}px"/>`;

        win.send('puzzleGetImageResult', str, initStyles, imageIndex);
    })
});

module.exports = open;


class PuzzleMaker {
    #width = 0;
    #height = 0;
    #map = [];
    #pieces = [];
    #pieceWidth = 0;
    #offsetY = 0;
    #offsetYpx = 0;

    constructor(width, height) {
        this.#width = width;
        this.#height = height;

        for (let i = 0; i < height; i++) {
            this.#map.push(Array(width).fill(false));
        }
    }

    setMapStart(mapStart) {
        this.#map[0] = mapStart;
    }
    getMapEnd() {
        return this.#map[this.#height - 1];
    }
    getNextBlockY() {
        return this.#offsetY + this.#height - 1;
    }
    setOffsetY(offsetY) {
        this.#offsetY = offsetY;
        this.#offsetYpx = offsetY * this.#pieceWidth;
    }
    setWidthPx(width) {
        this.#pieceWidth = width / this.#width;
    }
    getPieceWidth() {
        return this.#pieceWidth;
    }

    fillMap() {
        const w = this.#width;
        const h = this.#height;

        this.putCells(w, h, 4, 1);
        this.putCells(w, h, 3);
        this.putCells(w, h - 1, 2);

        for (let i = 0; i < h - 1; i++) {
            for (let j = 0; j < w; j++) {
                if (!this.#map[i][j]) {
                    this.#map[i][j] = true;
                    this.#pieces.push({
                        x: j,
                        y: i,
                        size: 1
                    });
                }
            }
        }
    }

    putCells(width, height, size, count = 0) {

        let added = 0;
        for (let iter = 0; iter < width * height * 4; iter++) {
            if (count > 0 && added === count) { return }

            const x = Math.floor(Math.random() * (width - size));
            const y = Math.floor(Math.random() * (height - size));

            let canPut = true;
            for (let i = y; i < y + size; i++) {
                for (let j = x; j < x + size; j++) {
                    canPut = canPut && !this.#map[i][j];
                }
            }

            if (canPut) {
                for (let i = y; i < y + size; i++) {
                    for (let j = x; j < x + size; j++) {
                        this.#map[i][j] = true;
                    }
                }
                added++;
                this.#pieces.push({
                    x: x,
                    y: y,
                    size: size
                })
            }
        }
    }

    makePuzzle(widthPx = null) {
        if (widthPx) {
            this.setWidthPx(widthPx);
        }

        this.fillMap();

        const result = {
            mapEnd: this.getMapEnd(),
            cellWidth: {},
            cellHeight: {},
            cells: [],
        }
        for (let i = 1; i <= 4; i++) {
            result.cellWidth[i] = this.#pieceWidth * i;
            result.cellHeight[i] = this.#pieceWidth * i;
        }

        for (const piece of this.#pieces) {
            result.cells.push({
                x: piece.x,
                y: piece.y,
                xPx: piece.x * this.getPieceWidth(),
                yPx: this.#offsetYpx + piece.y * this.getPieceWidth(),
                size: piece.size,
            })
        }

        return result;
    }
}
