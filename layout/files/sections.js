import {createNode, scrollToElement} from "../js/tools.js";

export class SectionList {
    #items = [];
    #pointer = null;

    constructor(container, sections) {
        this.container = container;
        this.sections = sections;
        this.child = null;

        this.make();
    }

    make() {
        this.el = createNode('div', 'section', this.container);

        for (const section of this.sections) {
            const block = createNode('div', 'section__item', this.el);
            const el = createNode('div', 'section__item-inner', block);

            el.textContent = this.cutName(section.name);
            el.dataset.chain = section.chain;
            el.addEventListener('click', this.onSectionClick.bind(this));

            this.#items.push(el);
        }
    }

    cutName(name) {
        if (name.length > 20) {
            return name.substring(0, 17) + '...';
        }
        return name;
    }

    onSectionClick(e) {
        window.keyboardController.setActiveBlock(this);
        this.setPointer(this.#items.indexOf(e.target));

        this.el.querySelectorAll('.section__item-inner').forEach((el) => {
            el.classList.remove('active');
        })

        this.selectItem(e.target);
    }

    selectItem(item) {
        this.destroyChild();

        item.classList.add('active');

        const chain = item.dataset.chain;

        window.selectSection(chain);

        for (const section of this.sections) {
            if (section.chain === chain) {
                this.child = new SectionList(this.container, section.children);
                window.keyboardController.addBlock(this, this.child);
            }
        }
    }

    setPointer(i) {
        if (this.#pointer !== null)
            this.#items[this.#pointer].classList.remove('pointer');

        if (i === null) {
            this.#pointer = null;
            return;
        }

        this.#pointer = i;
        this.#items[i].classList.add('pointer');

        scrollToElement(this.#items[this.#pointer], 100);
    }


    destroy() {
        this.destroyChild();
        window.keyboardController.removeBlock(this);
        this.el.remove();
    }

    destroyChild() {
        if (this.child !== null) {
            this.child.destroy();
        }
    }


    onKeyboardEvent(event, controller) {
        //if (!this.#items.length) { return; }

        const iSel = this.#pointer;
        const max = this.#items.length - 1;

        let iNew = null;

        if (event === 'entryTop' || event === 'home') {
            iNew = 0;
        } else if (event === 'entryBottom' || event === 'end') {
            iNew = max;
        } else if (event === 'up') {
            // if (iSel < itemsInRow) {
            //     controller.gotoTop();
            //     return;
            // }
            // iNew = iSel - itemsInRow;
            window.keyboardController.gotoTop();
        } else if (event === 'down') {
            // if (iSel > max - itemsInRow) {
            //     controller.gotoBottom();
            //     return;
            // }
            // iNew = iSel + itemsInRow;
            window.keyboardController.gotoBottom();
        } else if (event === 'left') {
            iNew = Math.max(0, iSel - 1);
        } else if (event === 'right') {
            iNew = Math.min(max, iSel + 1);
        } else if (event === 'enter') {
            this.selectItem(this.#items[iSel]);
        } else if (event === 'leave') {
            this.setPointer(null);
        }

        if (iNew !== null) {
            this.setPointer(iNew);
        }
    }
}