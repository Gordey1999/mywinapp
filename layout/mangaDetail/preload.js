
const { contextBridge, webFrame, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
    send: (channel, data) => {
        // whitelist channels
        let validChannels = ['mangaDetailInit', 'mangaDetailClose'];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    receive: (channel, func) => {
        let validChannels = ['mangaDetailInitResult'];
        if (validChannels.includes(channel)) {
            // Deliberately strip event as it includes `sender`
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    }
})

window.addEventListener('DOMContentLoaded', () => {
    webFrame.setVisualZoomLevelLimits(1, 4);
})