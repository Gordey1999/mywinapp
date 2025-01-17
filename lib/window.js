const {ipcMain, BrowserWindow} = require("electron");
const path = require("path");


class WindowManager {
    static _managers = {};

    _type = null;
    _windows = [];

    constructor(type) {
        this._type = type;
    }

    /** @return WindowManager */
    static getInstance(type) {
        if (!this._managers[type]) {
            this._managers[type] = new WindowManager(type);
        }

        return this._managers[type];
    }

    createWindow(params, data) {
        const defaultParams = {
            width: 800,
            height: 600,
            frame: false,
            webPreferences: {
                preload: path.join(__dirname, `../layout/${this._type}/preload.js`),
                nodeIntegration: true,
            }
        };

        const win = new BrowserWindow(Object.assign({}, defaultParams, params));

        win.loadFile(`layout/${this._type}/index.html`);

        data.win = win;
        this._windows.push(data);

        win.on('close', this._onClose.bind(this));

        return win;
    }

    static getWindow(id) {
        for (const [type, manager] of Object.entries(this._managers)) {
            const win = manager._getWindow(id);
            if (win !== null) {
                return win.win;
            }
        }
        return null;
    }

    getData(id) {
        return this._getWindow(id);
    }

    on(channel, handler) {
        ipcMain.on(channel, this._onMessage.bind(this, handler));
    }

    handle(channel, handler) {
        ipcMain.handle(channel, this._onMessage.bind(this, handler));
    }

    _onClose(event) {
        const index = this._getWindowIndex(event.sender.id);

        if (index !== null) {
            this._windows.splice(index, 1);
        }
    }

    async _onMessage(handler, event, ...args) {
        const win = this._getWindow(event.sender.id);

        if (win !== null) {
            win.sender = event.sender;
            return await handler(win, ...args);
        }
    }

    _getWindow(id) {
        const index = this._getWindowIndex(id);
        return index !== null ? this._windows[index] : null;
    }

    _getWindowIndex(id) {
        for (let i = 0; i < this._windows.length; i++) {
            if (this._windows[i].win.id === id) {
                return i;
            }
        }
        return null;
    }
}

ipcMain.on('close', (event) => {
    const win = WindowManager.getWindow(event.sender.id);
    if (win !== null) {
        win.close();
    }
})

ipcMain.on('minimize', (event) => {
    const win = WindowManager.getWindow(event.sender.id);
    if (win !== null) {
        win.minimize();
    }
})

ipcMain.on('maximize', (event) => {
    const win = WindowManager.getWindow(event.sender.id);
    if (win === null) { return; }

    if (win.isMaximized())
        win.unmaximize();
    else
        win.maximize();
})

ipcMain.handle('maximizeStatus', async (event) => {
    const win = WindowManager.getWindow(event.sender.id);
    if (win === null) { return false; }

    return win.isMaximized();
})

module.exports = { WindowManager };