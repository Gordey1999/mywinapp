
const { webFrame } = require('electron')
const {exposeInMainWorld} = require("../preload");

exposeInMainWorld(
    [
        'searchCopiesInit', 'searchCopiesStep', 'searchCopiesOpenFile'
    ],
    [

    ],
    [
        'searchCopiesInitResult', 'searchCopiesStepResult'
    ],
    __dirname
)

window.addEventListener('DOMContentLoaded', () => {
    webFrame.setVisualZoomLevelLimits(1, 4);
})