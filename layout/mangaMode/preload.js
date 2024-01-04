
const {exposeInMainWorld} = require("../preload");

exposeInMainWorld(
    [
        'mangaModeInit', 'mangaModeClose', 'openMangaDetail'
    ],
    [

    ],
    [
        'mangaModeInitResult'
    ],
    __dirname
)