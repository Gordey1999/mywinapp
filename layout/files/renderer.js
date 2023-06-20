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

	#selected = false;

    constructor(controller, file) {
        this.#controller = controller;
        this.#file = file;
        this.#make();
    }

    #make() {
        this.#el = createNode('div', 'files__item', this.#controller.getContainer());

        if (this.#file.type === 'mp4') {
            const video = createNode('video', null, this.#el);
            video.src = this.#file.src;
        } else {
            this.#img = createNode('img', null, this.#el);

            if (this.#file.preview !== null) {
                this.#img.src = this.#file.preview;
            }

            this.#img.loading = 'lazy';
        }
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
            const video = createNode('video', null, this.#el);
            video.src = this.#file.src;
            video.autoplay = true;
            video.loop = true;
			video.muted = true;

            video.onloadeddata = () => {
                this.#onImageLoad(video.videoWidth, video.videoHeight)
            };

        } else {
            const img = createNode('img', null, this.#el);
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
	};

    constructor(container) {
        this.#el = container;

        this.#items = [];
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
    }

    onKeyboardEvent(event, i) {
        if (event === 'enter') {
            this.openDetail(this.#items[i].getFile().id);
        } else if (event === 'click' || event === 'shift') {
	        if (!this.#selectMode)
				this.#pointerItem.togglePreview();
        } else if (event === 'dbClick') {
            this.openDetail(this.#items[i].getFile().id);
        } else if (event === 'controlUp') {
			console.log('control!');
			this.#select(i, false, true);
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
        if (this.#pointerItem.getFile().type === 'mp4') {
            this.#pointerItem.clearPreview();
        }
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
		if (i === null || (!shift && !control)) {
			this.#selectOptions.start = i;
			this.#selectOptions.startToggled = false;
			return;
		}

		if (!this.#selectMode) {
			this.#selectMode = true;
			this.#el.classList.add('selectMode');
		}

		if (shift) {

		} else if (control) {
			// if (this.#selectOptions.start === i) {
			// 	this.#items[i].toggleSelected();
			// 	return;
			// }
			// if (!this.#selectOptions.startToggled) {
			// 	this.#items[this.#selectOptions.start].toggleSelected();
			// 	this.#selectOptions.startToggled = true;
			// }
			this.#items[i].toggleSelected();
		}
	}

    setPointer(id) {
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
        controller.setPointer(selectedId);
    });

    window.selectSection = (section) => {
        window.api.send('itemList', section);
    }
});


// background animation
(function() {
    let paused = false;
    let time = Date.now();
    const back = document.querySelector('.background');

    document.addEventListener('keydown', () => {
        pauseAnimation();
    });
    document.addEventListener('click', () => {
        pauseAnimation();
    });
    document.addEventListener('scroll', () => {
        pauseAnimation();
    });

    function pauseAnimation() {
        if (paused) {
            time = Date.now();
            return;
        }
        paused = true;
        back.classList.add('pause');
    }

    function startAnimation() {
        if (Date.now() - time > 5000) {
            paused = false;
            back.classList.remove('pause');
        }
    }

    setInterval(startAnimation, 5000);
})();

(function() {
    document.addEventListener('keydown', function (e) {
        if (e.code === 'Digit1') {
            document.body.classList.remove('border-rounded');
        } else if (e.code === 'Digit2') {
            document.body.classList.add('border-rounded');
        }
    })
})();



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