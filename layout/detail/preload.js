const { webFrame } = require('electron');
const { exposeInMainWorld } = require("../preload");

exposeInMainWorld(
    [
        'detailInit', 'closeDetail', 'openInExplorer'
    ],
    [
        'delete',
    ],
    [
        'detailInitResult'
    ],
    __dirname
)

window.addEventListener('DOMContentLoaded', () => {
    // webFrame.setVisualZoomLevelLimits(1, 4);
})