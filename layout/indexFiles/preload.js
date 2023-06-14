
const { contextBridge, webFrame, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
    send: (channel, data) => {
        // whitelist channels
        let validChannels = ['imagesList'];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    receive: (channel, func) => {
        let validChannels = ['imagesListResult'];
        if (validChannels.includes(channel)) {
            // Deliberately strip event as it includes `sender`
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    }
})

window.addEventListener('DOMContentLoaded', () => {
    webFrame.setVisualZoomLevelLimits(1, 4)

    document.addEventListener('keydown', (e) => {
        if (e.code !== 'Escape') return

        ipcRenderer.send('closeDetail')
    })
})