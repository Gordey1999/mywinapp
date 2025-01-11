"use strict";

import {addMenuOption, setTitle} from "../assets/js/window.js";
import {getScroll, scrollToTop, setScroll} from "../assets/js/tools.js";
import {KeyboardController} from "../assets/js/keyboard.js";
import {DirectoriesViewer} from "./directoriesViewer.js";
import {DirPath} from "./dirPath.js";
import {FilesController} from "./filesViewer.js";
import {MovementHistory} from "./history.js";
import {DirectoryLoader, PreviewLoader} from "./indexing.js";

/*
cntrl + x - для перетаскивания? cntrl уже занять
Можно заменить на m или x.
Лучше просто m, чтобы передвинуть все выбранные элементы в место после указателя
Имитировать contr press and shift press, чтобы не мучиться


 */

window.keyboardController = new KeyboardController();

const dirPath = new DirPath($('.dir-path'));
const dirViewer = new DirectoriesViewer($('.directories-container'));
const filesViewer = new FilesController($('.files-container').get(0));
const movementHistory = new MovementHistory();

window.api.invoke('filesInit').then((result) => {
    openPath(result.dirPath, result.pointTo);
});

$(window).on('selectSection', (e, src) => {
    openPath(src);
});

$(window).on('changeSort', (e, newSort) => {
    window.api.invoke('changeSort', newSort).then(() => {
        openPath(dirPath.getPath(), getPointer(), null, false, true);
    })
});

function openPath(src, name = null, scroll = null, saveToHistory = true, reloadRequired = false) {
    if (dirPath.getPath() === src && name && !reloadRequired) {
        pointTo(name);
        return;
    }

    if (saveToHistory) {
        movementHistory.update(getPointer(), getScroll());
    }

    window.api.invoke('filesItemList', src).then((result) => {
        if (result.error) { return }

        scrollToTop();

        setTitle(`${result.info.name} (${result.files.length})`);
        dirPath.setPath(result.info.src);

        dirViewer.setDirectories(result.dirs, result.info);
        filesViewer.setFiles(result.files);
        filesViewer.setSort(result.info.sort);
        keyboardController.clearPointer();

        // noinspection JSIgnoredPromiseFromCall
        runLoaders(result);

        if(name) {
            pointTo(name);
            setScroll(scroll);
        } else {
            pointTo(result.dirs[0]?.name ?? result.files[0]?.name);
        }

        if (saveToHistory) {
            movementHistory.add(dirPath.getPath(), name, getScroll());
        }
    });
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
        openPath(prev.src, prev.pointTo, prev.scroll, false);
    }
});

hotkeys('=, e', () => {
    movementHistory.update(getPointer(), getScroll());
    const next = movementHistory.next();
    if (next !== null) {
        openPath(next.src, next.pointTo, next.scroll, false);
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
})();