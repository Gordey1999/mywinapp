
const { contextBridge, webFrame, ipcRenderer } = require('electron')
const {exposeInMainWorld} = require("../preload");

exposeInMainWorld(
    [
        'searchCopiesInit', 'searchCopiesStep', 'searchCopiesOpenFile'
    ],
    [

    ],
    [
        'searchCopiesInitResult', 'searchCopiesStepResult'
    ]
)

window.addEventListener('DOMContentLoaded', () => {
    webFrame.setVisualZoomLevelLimits(1, 4);
})