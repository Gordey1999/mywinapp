"use strict";

import { KeyboardController } from "../js/keyboard.js";
import { createNode, scrollToElement } from "../js/tools.js";
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
        this.#el.addEventListener("click", this.#onClick.bind(this));
        this.#el.addEventListener("dblclick", this.#onDbClick.bind(this));
        //this.el.addEventListener("mouseover", this.onMouseOver.bind(this));
        //this.el.addEventListener("mouseleave", this.onMouseLeave.bind(this));
    }

    #onDbClick(e) {
        e.preventDefault();
        window.api.send('openDetail', this.#file.id);
    }

    #onClick() {
        window.keyboardController.setActiveBlock(this.#controller);
        this.#controller.select(this);
        if (!this.#preview)
            this.#showPreview();
        else {
            this.#clearPreview();
        }
    }

    #showPreview() {
        if (this.#preview) { return; }
        this.#preview = new FilePreview(this);
    }

    #startPreview() {
        if (this.#preview) { return; }

        this.#clearPreview();
        this.#timer = setTimeout(() => {
            this.#showPreview();
            this.#timer = null;
        }, 800);
    }

    #clearPreview() {
        if (this.#preview) {
            this.#preview.destroy();
            this.#preview = null;
        }
        if (this.#timer) {
            clearTimeout(this.#timer);
            this.#timer = null;
        }
    }

    getXIndex() {
        return controller.getFileIndex(this.#file.id) % itemsInRow;
    }
    getYIndex() {
        return controller.getFileIndex(this.#file.id) / itemsInRow;
    }

    markSelected(b) {
        if (b) {
            this.#startPreview();
            this.#el.classList.add('selected');
            scrollToElement(this.#el);
        } else {
            this.#clearPreview();
            this.#el.classList.remove('selected');
        }
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
    #selected = null;

    constructor(container) {
        this.#el = container;

        this.#items = [];

        this.#bind();
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
    }

    getFileIndex(id) {
        return this.#filesPos[id];
    }

    setItemPreview(id, src) {
        for (const item of this.#items) {
            if (item.getFile().id === id) {
                item.setPreview(src);
            }
        }
    }

    #bind() {
        //document.addEventListener('keydown', this.onKeyDown.bind(this));
    }

    onKeyboardEvent(event, controller) {
        if (!this.#items.length) { /*window.keyboardController.gotoTop(); return;*/ }

        const iSel = this.getSelectedIndex();
        let max = this.#items.length - 1;

        let iNew = null;

        if (event === 'entryTop' || event === 'home') {
            iNew = 0;
        } else if (event === 'entryBottom' || event === 'end') {
            iNew = max;
        } else if (event === 'up') {
            if (iSel < itemsInRow) {
                controller.gotoTop();
                return;
            }
            iNew = iSel - itemsInRow;
        } else if (event === 'down') {
            if (iSel > max - itemsInRow) {
                controller.gotoBottom();
                return;
            }
            iNew = iSel + itemsInRow;
        } else if (event === 'left') {
            iNew = Math.max(0, iSel - 1);
        } else if (event === 'right') {
            iNew = Math.min(max, iSel + 1);
        } else if (event === 'enter') {
            window.api.send('openDetail', this.#items[iSel].getFile().id);
        } else if (event === 'leave') {
            this.select(null);
        }

        if (iNew !== null) {
            this.select(this.#items[iNew]);
        }
    }

    select(item) {
        if (this.#selected) {
            if (this.#selected === item) {
                return;
            }
            this.#selected.markSelected(false);
        }
        if (item === null) {
            this.#selected = null;
            return;
        }

        this.#selected = item;
        item.markSelected(true);
    }

    selectId(id) {
        this.select(this.#items[this.getFileIndex(id)]);
    }

    getSelectedIndex() {
        if (!this.#selected) return null;
        return this.getFileIndex(this.#selected.getFile().id);
    }

    getContainer() {
        return this.#el;
    }
}




window.api.send('sectionList');

const container = document.querySelector('.files-container');
const sectionsContainer = document.querySelector('.sections');

window.api.receive('sectionListResult', (sections) => {
    sectionsContainer.innerHTML = '';

    const sectionList = new SectionList(sectionsContainer, [{ name: 'root', chain: '', children: sections}]);

    const controller = new FilesController(container);
    window.keyboardController = new KeyboardController([sectionList, controller]);


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

    btnOrganize.addEventListener('click', () => {
        if (!confirm('sure?')) return;

        window.api.send('organizeDir', currentDir)
    })
    window.api.receive('organizeDirResult', () => {
        window.api.send("dirList", currentDir);
    })

    btnIndexFiles.addEventListener('click', () => {
        window.api.send('openIndexFiles');
    })
})()