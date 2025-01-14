"use strict";

import {addMenuOption, setTitle} from "../assets/js/window.js";
import {getScroll, scrollToTop, setScroll} from "../assets/js/tools.js";
import {KeyboardController} from "../assets/js/keyboard.js";
import {DirectoriesViewer} from "./directoriesViewer.js";
import {DirPath} from "./dirPath.js";
import {FilesController} from "./filesViewer.js";
import {MovementHistory} from "./history.js";
import {DirectoryLoader, PreviewLoader} from "./indexing.js";

window.keyboardController = new KeyboardController();

const dirPath = new DirPath($('.dir-path'));
const dirViewer = new DirectoriesViewer($('.directories-container'));
const filesViewer = new FilesController($('.files-container').get(0));
const movementHistory = new MovementHistory();

window.api.invoke('filesInit').then((result) => {
    movementHistory.add(result.dirPath);
    openPath(result.dirPath, result.pointTo);
});

window.api.receive('filesOnFocus', () => {
    openPath(dirPath.getPath());
});

$(window).on('selectSection', (e, src) => {
    if (dirPath.getPath() !== src) {
        movementHistory.update(getPointer(), getScroll());
        movementHistory.add(src);
    }
    openPath(src);
});

$(window).on('changeSort', (e, newSort) => {
    window.api.invoke('changeSort', newSort).then(() => {
        openPath(dirPath.getPath(), getPointer(), null);
    })
});

async function openPath(src, name = null, scroll = null) {
    const samePath = dirPath.getPath() === src;
    let fullRedraw = true;

    if (samePath) {
        const actual = await window.api.invoke('filesCheckUpdated', src);
        const sameSort = actual.sort === filesViewer.getSort();

        if (sameSort && actual.mtime === dirViewer.getActualTime()) {
            gotoSelected(name, scroll);
            return;
        }

        fullRedraw = !sameSort;
    }

    showLoading(true);
    const result = await window.api.invoke('filesItemList', src);
    showLoading(false);

    if (result.error) { return; }

    if (!samePath) {
        setTitle(`${result.info.name} (${result.files.length})`);
        dirPath.setPath(result.info.src);
    }

    if (fullRedraw) {
        dirViewer.setDirectories(result.dirs, result.info);
        filesViewer.setFiles(result.files);
        filesViewer.setSort(result.info.sort);
    } else {
        dirViewer.setDirectories(result.dirs, result.info);
        filesViewer.updateFiles(result.files);
    }
    runLoaders(result);

    if(name || samePath) {
        gotoSelected(name, scroll);
    } else {
        gotoSelected(result.dirs[0]?.name ?? result.files[0]?.name, 0);
    }
}

function gotoSelected(name = null, scroll = null) {
    if (name !== null) {
        pointTo(name);
    }
    if (scroll !== null) {
        setScroll(scroll);
    }
}

function pointTo(name) {
    if (!dirViewer.setPointer(name)) {
        filesViewer.setPointer(name);
    }
}

function getPointer() {
    const dirPointer = dirViewer.getPointer();
    if (dirPointer !== null) { return dirPointer; }

    return filesViewer.getPointer();
}

const directoryLoader = new DirectoryLoader();
const previewLoader = new PreviewLoader();

async function runLoaders(result) {
    directoryLoader.stop();
    previewLoader.stop();

    try {
        await directoryLoader.start(result.dirs, dirViewer);
        await previewLoader.start(filesViewer.getItems());
    } catch (e) {}
}

window.api.receive('filesOpenPath', (src, name) => {
    openPath(src, name);
});

hotkeys('backspace, q', () => {
    movementHistory.update(getPointer(), getScroll());
    const prev = movementHistory.prev();
    if (prev !== null) {
        openPath(prev.src, prev.pointTo, prev.scroll);
    }
});

hotkeys('=, e', () => {
    movementHistory.update(getPointer(), getScroll());
    const next = movementHistory.next();
    if (next !== null) {
        openPath(next.src, next.pointTo, next.scroll);
    }
});


(function() {
    document.addEventListener('keydown', function (e) {
        if (e.code === 'Digit1') {
            document.body.classList.remove('--border-rounded');
        } else if (e.code === 'Digit2') {
            document.body.classList.add('--border-rounded');
        }
    })
})();

function showLoading(dir) {
    const $loading = $('.loading');
    if (dir) {
        $loading.show();
        $loading.css('opacity', 1);
    } else {
        $loading.hide();
        $loading.css('opacity', 0);
    }
}


//organizeDir, openIndexFiles, openPuzzle

(function() {
    let currentDir = null;

    $(window).on('selectSection', (e, src) => {
        currentDir = src;
    })

    addMenuOption('Puzzle', () => {
        window.api.send('openPuzzle');
    });
    addMenuOption('Search Copies', () => {
        window.api.send('openSearchCopies');
    });
    addMenuOption('Manga Mode', () => {
        window.api.send('openMangaMode', currentDir);
    });
    addMenuOption('New Window', () => {
        window.api.send('openNewWindow', currentDir);
    });
})();