
const { contextBridge, webFrame, ipcRenderer } = require('electron');
const { exposeInMainWorld } = require("../preload");

exposeInMainWorld(
    [
        'filesItemList', 'filesMakePreview', 'filesIndexStep',
        'openDetail', 'organizeDir', 'openIndexFiles', 'openPuzzle', 'openSearchCopies', 'openMangaMode',
        'openFrameMode', 'openFramePuzzle'
    ],
    [

    ],
    [
        'filesItemListResult', 'filesMakePreviewResult', 'filesIndexStepResult', 'filesSetSelected',
        'organizeDirResult'
    ]
)