"use strict";

import {KeyboardController} from "../js/keyboard.js";
import {adaptiveGrid, createNode, ContextMenu} from "../js/tools.js";
import {DirTree} from "./dirTree.js";
import {FilesIndexer} from "./indexing.js";
import {addMenuOption} from "../js/window.js";

/*
cntrl + x - для перетаскивания? cntrl уже занять
Можно заменить на m или x.
Лучше просто m, чтобы передвинуть все выбранные элементы в место после указателя
Имитировать contr press and shift press, чтобы не мучиться


 */

let itemsInRow = 10;

adaptiveGrid($('.files-container'), 140, 2, (count) => {
    itemsInRow = count;
});

class FileItem {
    #controller = null;
    #file = null;
    #el = null;
    #img = null;

    #preview = null;
    #timer = null;

	#selected = false;

    constructor(controller, file) {
        this.#controller = controller;
        this.#file = file;
        this.#make();
    }

    #make() {
        this.#el = createNode('div', 'files__item', this.#controller.getContainer());
    }

    createImage() {
        if (this.#file.type === 'mp4') {
            this.#img = createNode('video', 'files__item-img', this.#el);
            this.#img.src = this.#file.src;
        } else {
            this.#img = createNode('img', 'files__item-img', this.#el);

            if (this.#file.preview !== null) {
                this.#img.src = this.#file.preview;
            } else {
                this.#img.src = '../img/image_back.png';
            }

            this.#img.loading = 'lazy';
        }
    }
    removeImage() {
        this.#img.remove();
        this.#img = null;
    }
    imageCreated() {
        return this.#img !== null;
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

	setSelected(b) {
		if (this.#selected === b) { return; }

		this.#selected = b;

		if (b) {
			this.#el.classList.add('selected');
		} else {
			this.#el.classList.remove('selected');
		}
	}
	toggleSelected() {
		this.setSelected(!this.#selected);
	}
	getSelected() {
		return this.#selected;
	}

    getXIndex() {
        return this.#controller.getItemIndex(this.#file.id) % itemsInRow;
    }
    getYIndex() {
        return this.#controller.getItemIndex(this.#file.id) / itemsInRow;
    }

    setPreview(path) {
        this.#file.preview = path;
        if (this.#img)
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

    constructor(fileItem) {
        this.#fileItem = fileItem;
        this.#file = fileItem.getFile();

        this.#make();
    }

    #make() {
        this.#el = createNode('div', 'files__item--preview', this.#fileItem.getElement());

        if (this.#file.type === 'mp4') {
            const video = createNode('video', 'files__item--preview-img', this.#el);
            video.src = this.#file.src;
            video.autoplay = true;
            video.loop = true;
			video.muted = true;

            video.onloadeddata = () => {
                this.#onImageLoad(video.videoWidth, video.videoHeight)
            };

        } else {
            const img = createNode('img', 'files__item--preview-img', this.#el);
            img.src = this.#file.src;

            img.onload = () => {
                this.#onImageLoad(img.naturalWidth, img.naturalHeight);
            };
        }
    }

    #onImageLoad(nw, nh) {
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
	#pointerItem = null;

	#selectMode = false;
	#selectOptions = {
		start: null,
		startToggled: false,
        controlDownI: null,
        controlUpI: null,
	};

    #indexer = null;

    //#lastScroll = 0;

    constructor(container) {
        this.#el = container;

        this.#items = [];
        this.#indexer = new FilesIndexer();

        document.querySelector('.content').addEventListener('scroll', this.optimizeItemsRender.bind(this));
    }

    setFiles(files) {
        this.#el.innerHTML = '';
		this.#selectMode = false;

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

        this.optimizeItemsRender();

        this.#indexer.setFiles(this.#items);
    }

    onKeyboardEvent(event, i, el, evt) {
        if (event === 'enter') {
            this.openDetail(this.#items[i].getFile().id);
        } else if (event === 'click' || event === 'shift') {
	        if (!this.#selectMode)
				this.#pointerItem.togglePreview();
            //if (this.#selectOptions.controlDownI)
        } else if (event === 'dbClick') {
            this.openDetail(this.#items[i].getFile().id);
        } else if (event === 'control') {
			this.#selectOptions.controlDownI = i;
            this.#selectOptions.controlUpI = null;
        } else if (event === 'controlUp') {
            this.#selectOptions.controlUpI = i;
            this.#select(i, false, true);
        } else if (event === 'rightClick') {
            this.#makeContextMenu(evt);
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
        this.#pointerItem.clearPreview();
        window.api.send('openDetail', id);
    }

    onSetPointer(i, el, pressed) {
		this.#select(i, pressed.shift, pressed.control);

        if (this.#pointerItem) {
            this.#pointerItem.clearPreview();
        }

	    if (i === null) {
			this.#pointerItem = null;
			return;
		}
        this.#pointerItem = this.#items[i];
        if (!this.#selectMode)
			this.#pointerItem.startPreview();
    }

	#select(i, shift, control) {
        return;
        const options = this.#selectOptions;

		if (i === null || (!shift && !control)) {
            options.start = i;
            options.startToggled = false;
			return;
		}

		if (!this.#selectMode) {
			this.#selectMode = true;
			this.#el.classList.add('selectMode');
		}

		if (shift) {

		} else if (control) {
            if (options.controlUpI !== null) {
                if (options.controlDownI === options.controlUpI)
                    this.#items[i].toggleSelected();
                options.controlUpI = null;
            } else {
                this.#items[i].toggleSelected();
            }
		}
	}

    setPointer(id) {
        const index = this.getItemIndex(id);
        window.keyboardController.pointTo(this, index);
    }

    getSelected() {
        return this.#pointerItem;
    }

    getContainer() {
        return this.#el;
    }

    optimizeItemsRender() {
        if (!this.#items.length) return;

        const viewportHeight = window.innerHeight;

        const chunkSize = 300;

        // todo вычислять distToNext и скролл первого элемента один раз.
        //  Тогда можно будет получать getBoundingClientRect только при инициализации метода

        let view = this.#items[0].getElement().getBoundingClientRect();

        for (let i = 0; i < this.#items.length; i += chunkSize) {

            const nextChunkI = Math.min(this.#items.length - 1, i + chunkSize);
            const viewNext = this.#items[nextChunkI].getElement().getBoundingClientRect();
            const distToNext = viewNext.top - view.top;

            const maxJ = Math.min(this.#items.length, i + chunkSize);
            if (view.top > -distToNext && view.bottom < viewportHeight + distToNext) {
                if (!this.#items[i].imageCreated()) {
                    for (let j = i; j < maxJ; j++)
                        this.#items[j].createImage();
                }
            } else {
                if (this.#items[i].imageCreated()) {
                    for (let j = i; j < maxJ; j++)
                        this.#items[j].removeImage();
                }
            }
            view = viewNext;
        }
    }

    #makeContextMenu(evt) {
        console.log(evt);

        const menu = [
            {
                name: 'Open in Explorer',
                icon: 'explorer',
            },
            {
                name: 'Mark...'
            },
            {
                name: 'Sort...',
                children: [
                    { name: 'Name', icon: 'point' },
                    { name: 'Date Create' },
                    { name: 'Date Update' },
                    { name: 'Size' },
                    { name: 'Type' },
                    { type: 'separator' },
                    { name: 'Ascending', icon: 'point' },
                    { name: 'Descending' },
                ]
            },
            { type: 'separator' },
            {
                name: 'Frame Mode'
            },
            {
                type: 'group',
                children: [
                    {
                        name: 'Make Puzzle',
                        icon: 'puzzle',
                        grow: true,
                        callback: () => {
                            console.log('run!');
                        }
                    },
                    {
                        icon: 'settings'
                    }
                ]
            },
            { type: 'separator' },
            {
                name: 'Copy',
                icon: 'copy',
            },
            {
                name: 'Paste',
                icon: 'paste',
            },
            {
                name: 'Delete',
                icon: 'delete',
            }
        ];

        new ContextMenu(menu, evt.x, evt.y);
    }
}


const container = document.querySelector('.files-container');
const sectionsContainer = document.querySelector('.sections');

window.keyboardController = new KeyboardController();

let dirTree = new DirTree(sectionsContainer, [{ name: 'root', src: '' }]);

const controller = new FilesController(container);


window.api.receive('filesItemListResult', (dirs, files) => {
    dirTree.setChildDirs(dirs);
    controller.setFiles(files);
    fillDirInfo({ count: files.length });
});

window.api.receive('filesSetSelected', (selectedId) => {
    controller.setPointer(selectedId);
});

window.addEventListener('selectSection', (e) => {
    dirTree = e.detail.dirTree;
    fillDirInfo({ path: e.detail.src });
    window.api.send('filesItemList', e.detail.src);
})

dirTree.initRoot();


$(window).on('keydown', (e) => {
    if (e.code === 'KeyF') {
        const selected = controller.getSelected();
        if (selected === null) { return; }

        window.api.send('openFrameMode', selected.getFile().src);
    }
    else if (e.code === 'KeyP') {
        const selected = controller.getSelected();
        if (selected === null) { return; }

        window.api.send('openFramePuzzle', selected.getFile().src);
    }
});


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