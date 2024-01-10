"use strict";

import {addMenuOption, setTitle} from "../assets/js/window.js";
import {scrollToTop} from "../assets/js/tools.js";
import {KeyboardController} from "../assets/js/keyboard.js";
import {DirectoriesViewer} from "./directoriesViewer.js";
import {DirPath} from "./dirPath.js";
import {FilesController} from "./filesViewer.js";
import {MovementHistory} from "./history.js";

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

function openPath(src, name = null, fromHistory = false) {
    if (dirPath.getPath() === src && name) {
        pointTo(name);
        return;
    }

    if (!fromHistory) {
        const saved = movementHistory.search(src);
        if (saved?.pointTo) {
            name = saved.pointTo;
        }
        movementHistory.update(getPointer());
    }

    window.api.invoke('filesItemList', src).then((result) => {
        if (result.error) { return }

        scrollToTop();

        setTitle(`${result.info.name} (${result.files.length})`);
        dirPath.setPath(result.info.src);

        dirViewer.setDirectories(result.dirs, result.info);
        filesViewer.setFiles(result.files);
        keyboardController.clearPointer();

        if(name) {
            pointTo(name);
        } else {
            pointTo(result.dirs[0]?.name ?? result.files[0]?.name);
        }

        if (!fromHistory) {
            movementHistory.add(dirPath.getPath(), name);
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

window.api.receive('filesOpenPath', (src, name) => {
    openPath(src, name);
});

hotkeys('backspace, q', () => {
    movementHistory.update(getPointer());
    const prev = movementHistory.prev();
    if (prev !== null) {
        openPath(prev.src, prev.pointTo, true);
    }
});

hotkeys('=, e', () => {
    movementHistory.update(getPointer());
    const next = movementHistory.next();
    if (next !== null) {
        openPath(next.src, next.pointTo, true);
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