import {createNode, scrollToElement} from "../js/tools.js";

export class SectionList {
    #container = null;
    #sections = null;
    #child = null
    #el = null;

    #selected = null;

    constructor(container, sections) {
        this.#container = container;
        this.#sections = sections;
        this.#child = null;

        this.#make();
        window.keyboardController.addBlock(this, this.#el.querySelectorAll('.section__item-inner'));
    }

    #make() {
        this.#el = createNode('div', 'section', this.#container);

        for (const section of this.#sections) {
            const block = createNode('div', 'section__item', this.#el);
            const el = createNode('div', 'section__item-inner', block);

            el.textContent = this.#cutName(section.name);
            el.dataset.chain = section.chain;

            el.addEventListener('click', this.#onSectionClick.bind(this));
        }
    }

    #cutName(name) {
        if (name.length > 20) {
            return name.substring(0, 17) + '...';
        }
        return name;
    }

    #onSectionClick(e) {
        this.#selectItem(e.target);

        window.keyboardController.pointTo(this, e.target);
    }

    #selectItem(item) {
        this.#el.querySelectorAll('.section__item-inner').forEach((el) => {
            el.classList.remove('active');
        })

        this.destroyChild();

        item.classList.add('active');

        const chain = item.dataset.chain;

        window.selectSection(chain);

        for (const section of this.#sections) {
            if (section.chain === chain && section.children.length) {
                this.#child = new SectionList(this.#container, section.children);
            }
        }
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
        if (event === 'enter') {
            this.#selectItem(el);
        }
    }
}