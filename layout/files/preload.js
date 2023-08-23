
const { contextBridge, webFrame, ipcRenderer } = require('electron')
//const fs = require('fs')

contextBridge.exposeInMainWorld('api', {
    send: (channel, data) => {
        // whitelist channels
        let validChannels = ['filesItemList', 'filesMakePreview', 'filesIndexStep', 'openDetail', 'organizeDir', 'openIndexFiles', 'openPuzzle', 'openSearchCopies'];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    receive: (channel, func) => {
        let validChannels = ['filesItemListResult', 'filesMakePreviewResult', 'filesIndexStepResult', 'filesSetSelected', 'organizeDirResult'];
        if (validChannels.includes(channel)) {
            // Deliberately strip event as it includes `sender`
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    }
    // todo send and receive with id?
})

window.addEventListener('DOMContentLoaded', () => {
    //webFrame.setVisualZoomLevelLimits(1, 4);
})