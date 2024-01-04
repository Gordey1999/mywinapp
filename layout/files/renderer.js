"use strict";

import {KeyboardController} from "../assets/js/keyboard.js";
import {DirTree} from "./dirTree.js";
import {addMenuOption, setTitle} from "../assets/js/window.js";
import {DirPath} from "./dirPath.js";
import {FilesController} from "./filesViewer.js";

/*
cntrl + x - для перетаскивания? cntrl уже занять
Можно заменить на m или x.
Лучше просто m, чтобы передвинуть все выбранные элементы в место после указателя
Имитировать contr press and shift press, чтобы не мучиться


 */


const container = document.querySelector('.files-container');
const $sectionsContainer = $('.sections');

window.keyboardController = new KeyboardController();

const dirTreeRoot = new DirTree($sectionsContainer, []);
let dirTree = dirTreeRoot;

const dirPath = new DirPath($('.dir-path'));

const controller = new FilesController(container);

window.api.invoke('filesInit').then((result) => {
    openSection(result.dirPath, result.dirName);
});

window.api.receive('filesSetSelected', (selectedId) => {
    controller.setPointer(selectedId);
});

$(window).on('selectSection', (e, src) => {
    openSection(src);
});

function openSection(src) {
    window.api.invoke('filesItemList', src).then((result) => {
        if (result.error) { return }

        const dirName = result.src.split('\\').pop();
        setTitle(dirName);
        dirPath.setPath(result.src);

        fillDirInfo({ path: result.src });
        dirTree.setChildDirs(result.dirs);
        controller.setFiles(result.files);
        fillDirInfo({ count: result.files.length });
    });
}


function fillDirInfo(info) {
    const container = document.querySelector('.dir-info');
    if (typeof info.path !== 'undefined') {
        const parts = ('root' + info.path).split('\\');
        document.querySelector('.dir-info__name').textContent = parts.pop();
    }
    if (typeof info.count !== 'undefined') {
        const countEl = container.querySelector('.dir-info__count');
        countEl.textContent = `(${info.count})`;
    }
    if (info.size) {

    }
}


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

    window.addEventListener('selectSection', (e) => {
        currentDir = e.detail.src;
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