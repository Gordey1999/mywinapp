
const { webFrame } = require('electron')
const {exposeInMainWorld} = require("../preload");

exposeInMainWorld(
    [
        'mangaDetailInit', 'mangaDetailClose'
    ],
    [

    ],
    [
        'mangaDetailInitResult'
    ],
    __dirname
)

window.addEventListener('DOMContentLoaded', () => {
    webFrame.setVisualZoomLevelLimits(1, 4);
})