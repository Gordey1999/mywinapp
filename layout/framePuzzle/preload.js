
const {exposeInMainWorld} = require("../preload");

exposeInMainWorld(
    [

    ],
    [
        'framePuzzleInit'
    ],
    [
        'framePuzzleSolved'
    ],
    __dirname
)