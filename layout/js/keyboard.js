export class KeyboardController {

    #blocks = null;
    #iSel = null;

    constructor(blocks) {
        this.#blocks = blocks;
        this.#iSel = null;

        document.addEventListener('keydown', this.#onKeyboard.bind(this));
    }

    #onKeyboard(e) {
        let triggered = true;

        if (e.code === 'KeyD' || e.code === 'ArrowRight') {
            this.#trigger('right');
        } else if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
            this.#trigger('left');
        } else if (e.code === 'KeyW' || e.code === 'ArrowUp') {
            this.#trigger('up');
        } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
            this.#trigger('down');
        } else if (e.code === 'Home') {
            this.#trigger('home');
        } else if (e.code === 'End') {
            this.#trigger('end');
        } else if (e.code === 'Space' || e.code === 'Enter') {
            this.#trigger('enter');
        } else {
            triggered = false;
        }

        if (triggered) {
            e.preventDefault();
        }
    }

    #trigger(key) {
        if (this.#iSel === null && this.#blocks.length) {
            this.#iSel = 0;
            this.#triggerSelected('entryTop');
        } else {
            this.#triggerSelected(key);
        }
    }

    #triggerSelected(evt) {
        if (this.#iSel === null) { return; }

        return this.#blocks[this.#iSel].onKeyboardEvent(evt, this);
    }

    setActiveBlock(block) {
        const i = this.#blocks.indexOf(block);

        if (this.#iSel !== i) {
            this.#triggerSelected('leave');
            this.#iSel = i;
        }
    }

    addBlock(blockBefore, newBlock) {
        debugger;
        for (let i = 0; i < this.#blocks.length; i++) {
            if (this.#blocks[i] === blockBefore) {
                this.#blocks.splice(i + 1, 0, newBlock);
            }
        }
    }

    removeBlock(block) {
        for (let i = 0; i < this.#blocks.length; i++) {
            if (this.#blocks[i] === block) {
                this.#blocks.splice(i, 1);
            }
        }
    }

    gotoTop(x = 0) {
        if (this.#iSel > 0) {
            this.#trigger('leave');
            this.#iSel--;
            this.#trigger('entryBottom');
        }
    }

    gotoBottom(x = 0) {
        if (this.#iSel < this.#blocks.length - 1) {
            this.#trigger('leave');
            this.#iSel++;
            this.#trigger('entryTop');
        }
    }
}