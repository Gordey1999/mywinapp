const { exposeInMainWorld } = require("../preload");

exposeInMainWorld(
    [
        'openDetail', 'organizeDir', 'openIndexFiles', 'openPuzzle', 'openSearchCopies', 'openMangaMode', 'openNewWindow',
        'openFrameMode', 'openFramePuzzle', 'openFramePuzzleSettings', 'openInExplorer', 'openInPaint', 'openInVlc', 'onDragStart',
    ],
    [
        'filesInit', 'filesItemList', 'filesMakePreview', 'filesIndexStep', 'dirPathList', 'changeSort', 'filesCheckUpdated',
    ],
    [
        'filesOpenPath',
        'organizeDirResult'
    ],
    __dirname
)