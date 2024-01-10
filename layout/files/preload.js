const { exposeInMainWorld } = require("../preload");

exposeInMainWorld(
    [
        'openDetail', 'organizeDir', 'openIndexFiles', 'openPuzzle', 'openSearchCopies', 'openMangaMode',
        'openFrameMode', 'openFramePuzzle', 'openFramePuzzleSettings'
    ],
    [
        'filesInit', 'filesItemList', 'filesMakePreview', 'filesIndexStep', 'dirPathList'
    ],
    [
        'filesOpenPath',
        'organizeDirResult'
    ],
    __dirname
)