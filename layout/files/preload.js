const { exposeInMainWorld } = require("../preload");

exposeInMainWorld(
    [
        'openDetail', 'organizeDir', 'openIndexFiles', 'openPuzzle', 'openSearchCopies', 'openMangaMode',
        'openFrameMode', 'openFramePuzzle', 'openFramePuzzleSettings', 'openInExplorer', 'openInPaint'
    ],
    [
        'filesInit', 'filesItemList', 'filesMakePreview', 'filesIndexStep', 'dirPathList', 'changeSort'
    ],
    [
        'filesOpenPath',
        'organizeDirResult'
    ],
    __dirname
)