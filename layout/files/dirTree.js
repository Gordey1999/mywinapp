import {createNode, scrollToElement} from "../js/tools.js";

export class DirTree {
    #container = null;
    #dirList = null;
    #child = null;
    #el = null;

    constructor(container, dirList) {
        this.#container = container;
        this.#dirList = dirList;
        this.#child = null;

        this.#make();
        window.keyboardController.addBlock(this, this.#el.querySelectorAll('.section__item-inner'));
    }

    #make() {
        this.#el = createNode('div', 'section', this.#container);

        for (const dir of this.#dirList) {
            const block = createNode('div', 'section__item', this.#el);
            const el = createNode('div', 'section__item-inner', block);

            el.textContent = this.#cutName(dir.name);
            el.dataset.src = dir.src;
        }
    }

    #cutName(name) {
        if (name.length > 20) {
            return name.substring(0, 17) + '...';
        }
        return name;
    }

    #selectItem(item) {
        this.#el.querySelectorAll('.section__item-inner').forEach((el) => {
            el.classList.remove('active');
        })

        this.destroyChild();

        item.classList.add('active');

        window.selectSection(this, item.dataset.src);
    }
    initRoot() {
        this.#selectItem(document.querySelector('.section__item-inner'));
    }
    setChildDirs(dirs) {
        if (dirs.length)
            this.#child = new DirTree(this.#container, dirs);
    }

    onSetPointer() {
        // do nothing
    }


    destroy() {
        this.destroyChild();
        window.keyboardController.removeBlock(this);
        this.#el.remove();
    }

    destroyChild() {
        if (this.#child !== null) {
            this.#child.destroy();
        }
    }


    onKeyboardEvent(event, i, el) {
        if (event === 'enter' || event === 'click') {
            this.#selectItem(el);
        }
    }
}