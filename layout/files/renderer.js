"use strict";

import { KeyboardController } from "../js/keyboard.js";
import { createScrollbar, createNode, scrollToElement } from "../js/tools.js";
import { SectionList } from "./sections.js";

const itemsInRow = 10;

class FileItem {
    #controller = null;
    #file = null;
    #el = null;
    #img = null;

    #preview = null;
    #timer = null;

    constructor(controller, file) {
        this.#controller = controller;
        this.#file = file;
        this.#make();

        this.#bind();
    }

    #make() {
        this.#el = createNode('div', 'files__item', this.#controller.getContainer());
        this.#img = createNode('img', null, this.#el);

        if (this.#file.preview !== null) {
            this.#img.src = this.#file.preview;
        }

        this.#img.loading = 'lazy';
    }

    #bind() {
        this.#el.addEventListener("click", this.#onClick.bind(this))
    }

    #onClick(e) {
		if (e.detail === 1)
            this.#controller.onItemClick(this.#file.id);
		else
			this.#controller.onItemDbClick(this.#file.id);
    }

    showPreview() {
        if (this.#preview) { return; }
        this.#preview = new FilePreview(this);
    }

    startPreview() {
        if (this.#preview) { return; }

        this.clearPreview();
        this.#timer = setTimeout(() => {
            this.showPreview();
            this.#timer = null;
        }, 800);
    }

    clearPreview() {
        if (this.#preview) {
            this.#preview.destroy();
            this.#preview = null;
        }
        if (this.#timer) {
            clearTimeout(this.#timer);
            this.#timer = null;
        }
    }
    togglePreview() {
        this.#preview ? this.clearPreview() : this.showPreview();
    }

    getXIndex() {
        return this.#controller.getItemIndex(this.#file.id) % itemsInRow;
    }
    getYIndex() {
        return this.#controller.getItemIndex(this.#file.id) / itemsInRow;
    }

    setPreview(path) {
        this.#img.src = path;
    }
    getElement() {
        return this.#el;
    }
    getFile() {
        return this.#file;
    }
}


class FilePreview {
    #fileItem = null;
    #file = null;
    #el = null;
    #img = null;

    constructor(fileItem) {
        this.#fileItem = fileItem;
        this.#file = fileItem.getFile();

        this.#make();
        this.#bind();
    }

    #make() {
        this.#el = createNode('div', 'files__item--preview', this.#fileItem.getElement());
        this.#img = createNode('img', null, this.#el);
        this.#img.src = this.#file.src;
    }

    #bind() {
        this.#img.onload = this.#onImageLoad.bind(this);
    }

    #onImageLoad() {
        const nw = this.#img.naturalWidth;
        const nh = this.#img.naturalHeight;
        const scale = 1.5;

        setTimeout(() => {
            if (nw > nh) {
                const aspect = nw / nh;
                this.#el.style.width = scale * aspect * 100 + '%';
                this.#el.style.height = scale * 100 + '%';
            } else {
                const aspect = nh / nw;
                this.#el.style.width = scale * 100 + '%';
                this.#el.style.height = scale * aspect * 100 + '%';
            }
            const x = this.#fileItem.getXIndex();

            if (x === 0) {
                this.#el.style.transform = 'translate(0, -50%)';
                this.#el.style.left = 0;
            } else if (x === itemsInRow - 1) {
                this.#el.style.transform = 'translate(-100%, -50%)';
                this.#el.style.left = '100%';
            }
        }, 10);
    }

    destroy() {
        this.#el.style.removeProperty('width');
        this.#el.style.removeProperty('height');
        this.#el.style.removeProperty('transform');
        this.#el.style.removeProperty('left');

        setTimeout(() => {
            this.#el.remove();
        }, 500);
    }
}

class FilesController {

    #el = null;
    #items = null;
    #filesPos = null;
    #pointer = null;

    constructor(container) {
        this.#el = container;

        this.#items = [];
    }

    setFiles(files) {
        this.#el.innerHTML = '';

        this.#items = [];

        let index = 0;

        this.#filesPos = {};
        files.forEach(file => {
            file.index = index;
            this.#items.push(new FileItem(this, file));
            this.#filesPos[file.id] = index;
            index++;
        })

        if (files.length) {
            window.keyboardController.addBlock(this, this.#el.querySelectorAll('.files__item'))
        } else {
            window.keyboardController.removeBlock(this);
        }
    }

    onItemClick(id) {
        const index = this.getItemIndex(id);
        window.keyboardController.pointTo(this, index);
        this.#pointer.togglePreview();
    }
    onItemDbClick(id) {
        this.openDetail(id);
    }
    onKeyboardEvent(event, i) {
        if (event === 'enter') {
            this.openDetail(this.#items[i].getFile().id);
        }
    }

    getItemIndex(id) {
        return this.#filesPos[id];
    }

    setItemPreview(id, src) {
        for (const item of this.#items) {
            if (item.getFile().id === id) {
                item.setPreview(src);
            }
        }
    }

    openDetail(id) {
        window.api.send('openDetail', id);
    }

    onSetPointer(i) {
        if (this.#pointer) {
            this.#pointer.clearPreview();
        }
        if (i === null) { return; }
        this.#pointer = this.#items[i];
        this.#pointer.startPreview();
    }

    selectId(id) {
        const index = this.getItemIndex(id);
        window.keyboardController.pointTo(this, index);
    }

    getContainer() {
        return this.#el;
    }
}

createScrollbar(document.body);


window.api.send('sectionList');

const container = document.querySelector('.files-container');
const sectionsContainer = document.querySelector('.sections');

window.api.receive('sectionListResult', (sections) => {
    sectionsContainer.innerHTML = '';

    window.keyboardController = new KeyboardController();

    const sectionList = new SectionList(sectionsContainer, [{ name: 'root', chain: '', children: sections}]);

    const controller = new FilesController(container);


    window.api.receive('itemListResult', (files) => {
        controller.setFiles(files);
    });

    window.api.receive('previewResult', (res) => {
        controller.setItemPreview(res.id, res.path);
    });

    window.api.receive('setSelected', (selectedId) => {
        controller.selectId(selectedId);
    });

    window.selectSection = (section) => {
        window.api.send('itemList', section);
    }
});




(function() {
    const btnOrganize = document.querySelector('.js-organize-dir');
    const btnIndexFiles = document.querySelector('.js-index-files');
    const btnPuzzle = document.querySelector('.js-puzzle');

    btnOrganize.addEventListener('click', () => {
        if (!confirm('sure?')) return;

        return;
        window.api.send('organizeDir', currentDir)
    })
    window.api.receive('organizeDirResult', () => {
        window.api.send("dirList", currentDir);
    })

    btnIndexFiles.addEventListener('click', () => {
        window.api.send('openIndexFiles');
    })
    btnPuzzle.addEventListener('click', () => {
        window.api.send('openPuzzle');
    })
})()