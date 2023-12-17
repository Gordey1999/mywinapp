const {ipcMain} = require("electron");

const windows = [];

function initWindow(win) {
    windows.push(win);
}

function findActive() {
    for (const win of windows) {
        if (!win.isDestroyed() && win.isFocused()) {
            return win;
        }
    }
    return null;
}

ipcMain.on('close', (event) => {
    const win = findActive();
    if (win === null) { return; }

    win.close();
})

ipcMain.on('minimize', (event) => {
    const win = findActive();
    if (win === null) { return; }

    win.minimize();
})

ipcMain.on('maximize', (event) => {
    const win = findActive();
    if (win === null) { return; }

    if (win.isMaximized())
        win.unmaximize();
    else
        win.maximize();
})

ipcMain.handle('maximizeStatus', async (event) => {
    const win = findActive();
    if (win === null) { return false; }

    return win.isMaximized();
})

module.exports = { initWindow };