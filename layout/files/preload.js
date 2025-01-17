const { exposeInMainWorld } = require("../preload");

exposeInMainWorld(
    [
        'openDetail', 'organizeDir', 'openIndexFiles', 'openPuzzle', 'openSearchCopies', 'openMangaMode', 'openNewWindow',
        'openFrameMode', 'openFramePuzzle', 'openFramePuzzleSettings', 'openInExplorer', 'openInPaint', 'openInVlc', 'onDragStart',
        'filesCut', 'filesCopy', 'filesDragStart',
    ],
    [
        'filesInit', 'filesItemList', 'filesMakePreview', 'filesDirectoryInfo',
        'filesIndexStep', 'dirPathList', 'changeSort', 'filesCheckUpdated',
        'filesPaste', 'filesDelete', 'filesDrop',
    ],
    [
        'filesOnFocus',
        'filesOpenPath',
        'organizeDirResult'
    ],
    __dirname
)