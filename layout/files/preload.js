const { exposeInMainWorld } = require("../preload");

exposeInMainWorld(
    [
        'openDetail', 'organizeDir', 'openIndexFiles', 'openPuzzle', 'openSearchCopies', 'openMangaMode', 'openNewWindow',
        'openFrameMode', 'openFramePuzzle', 'openFramePuzzleSettings', 'openInExplorer', 'openInPaint', 'openInVlc', 'onDragStart',
    ],
    [
        'filesInit', 'filesItemList', 'filesMakePreview', 'filesDirectoryInfo',
        'filesIndexStep', 'dirPathList', 'changeSort', 'filesCheckUpdated',
    ],
    [
        'filesOnFocus',
        'filesOpenPath',
        'organizeDirResult'
    ],
    __dirname
)