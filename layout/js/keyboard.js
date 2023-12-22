import {getAbsPosition, scrollToElement} from "./tools.js";

export class KeyboardController {

    #blocks = [];

    #pointer = null;
    #blockPointer = null;
    #xCourse = 0;

	#pressed = {
		shift: false,
		control: false,
	};

    constructor() {
        document.addEventListener('keydown', this.#onKeyboard.bind(this));
        document.addEventListener('keyup', this.#onKeyboardUp.bind(this));
        document.addEventListener('mousemove', this.#showCursor.bind(this));
    }

    #onKeyboard(e) {
        let triggered = true;

		this.#pressed.shift = e.shiftKey;
		this.#pressed.control = e.ctrlKey;

        if (e.code === 'KeyD' || e.code === 'ArrowRight') {
            this.#move('right');
        } else if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
            this.#move('left');
        } else if (e.code === 'KeyW' || e.code === 'ArrowUp') {
            this.#move('up');
        } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
            this.#move('down');
        } else if (e.code === 'Home') {
            this.#move('home');
        } else if (e.code === 'End') {
            this.#move('end');
        } else if (e.code === 'Space' || e.code === 'Enter') {
            this.#trigger('enter');
        } else if (e.key === 'Shift') {
	        this.#trigger('shift');
        } else if (e.key === 'Control') {
	        this.#trigger('control');
        } else {
            triggered = false;
        }

        if (triggered) {
            e.preventDefault();
        }
    }

    #onKeyboardUp(e) {
        let triggered = true;

        if (e.key === 'Shift') {
            this.#trigger('shiftUp');
        } else if (e.key === 'Control') {
            this.#trigger('controlUp');
        } else {
            triggered = false;
        }

        if (triggered) {
            e.preventDefault();
        }
    }

    #onElementClick(controller, i, e) {
        if (e.detail === 1) {
            this.pointTo(controller, i);
            this.#trigger('click');
        }
        else if (e.detail === 2) {
            this.#trigger('dbClick');
        }
    }

    #onElementRightClick(controller, i, e) {
        this.pointTo(controller, i);
        this.#trigger('rightClick', e);
    }

    #trigger(key, e = null) {
        if (this.#blockPointer !== null) {
            this.#blocks[this.#blockPointer].controller.onKeyboardEvent(key, this.#pointer, this.#getPointedElement(), e);
        }
    }

    #move(key) {
        this.#hideCursor();

        if (this.#blockPointer === null) {
            if (this.#blocks.length === 0) {
                return;
            } else {
                this.#setPointer(0, 0);
                return;
            }
        }


        let bp = this.#blockPointer;
        const bMax = this.#blocks.length - 1;
        let p = this.#pointer;
        let max = this.#blocks[bp].items.length - 1;

        if (key === 'left') {
            if (p === 0) { return; }
            this.#setPointer(bp, p - 1);
            this.#updateXCourse();

        } else if (key === 'right') {
            if (p === max) { return; }
            this.#setPointer(bp, p + 1);
            this.#updateXCourse();

        } else if (key === 'home') {
            if (p === 0 && bp > 0) {
                this.#setPointer(bp - 1, 0);
            } else {
                this.#setPointer(bp, 0);
            }
        } else if (key === 'end') {
            if (p === max && bp < bMax) {
                this.#setPointer(bp + 1, this.#blocks[bp + 1].items.length - 1);
            } else {
                this.#setPointer(bp, max);
            }

        } else if (key === 'up') {

            let start = getAbsPosition(this.#blocks[bp].items[p]);
            while (true) {
                if (p === 0 && bp === 0) { return; }
                if (p === 0) {
                    bp--;
                    p = this.#blocks[bp].items.length - 1;
                    start = getAbsPosition(this.#blocks[bp].items[p]);
                    break;
                }
                p--;
                const coords = getAbsPosition(this.#blocks[bp].items[p]);
                if (Math.abs(coords.top - start.top) > 5) {
                    start = coords;
                    break;
                }
            }

            const needX = this.#xCourse;
            let bestP = p;
            let minDist = Math.abs(needX - start.left);

            while (true) {
                p--;
                if (p < 0) { break; }
                const pos = getAbsPosition(this.#blocks[bp].items[p]);
                if (Math.abs(pos.top - start.top) > 5) {
                    break;
                }
                const dist = Math.abs(pos.left - needX);
                if (dist < minDist) {
                    bestP = p;
                    minDist = dist;
                }
            }

            this.#setPointer(bp, bestP);

        } else if (key === 'down') {

            let start = getAbsPosition(this.#blocks[bp].items[p]);
            while (true) {
                if (p === max && bp === bMax) { return; }
                if (p === max) {
                    bp++;
                    p = 0;
                    start = getAbsPosition(this.#blocks[bp].items[p]);
                    max = this.#blocks[bp].items.length - 1;
                    break;
                }
                p++;
                const coords = getAbsPosition(this.#blocks[bp].items[p]);
                if (Math.abs(coords.top - start.top) > 5) {
                    start = coords;
                    break;
                }
            }

            const needX = this.#xCourse;
            let bestP = p;
            let minDist = Math.abs(needX - start.left);

            while (true) {
                p++;
                if (p > max) { break; }
                const pos = getAbsPosition(this.#blocks[bp].items[p]);
                if (Math.abs(pos.top - start.top) > 5) {
                    break;
                }
                const dist = Math.abs(pos.left - needX);
                if (dist < minDist) {
                    bestP = p;
                    minDist = dist;
                }
            }

            this.#setPointer(bp, bestP);
        }
    }

    #setPointer(bp, p) {
        if (this.#blockPointer !== null && this.#pointer !== null) {
            this.#blocks[this.#blockPointer].items[this.#pointer].classList.remove('pointer');
            if (bp !== this.#blockPointer) {
                this.#blocks[this.#blockPointer].controller.onSetPointer(null, null, this.#pressed);
            }
        }
        this.#blockPointer = bp;
        this.#pointer = p;

        this.#blocks[bp].items[p].classList.add('pointer');
        scrollToElement(this.#blocks[bp].items[p], 150);
        this.#blocks[bp].controller.onSetPointer(p, this.#getPointedElement(), this.#pressed);
    }
    #updateXCourse() {
        this.#xCourse = getAbsPosition(this.#getPointedElement()).left;
    }

    #getPointedElement() {
        return this.#blocks[this.#blockPointer].items[this.#pointer];
    }

    #getElement(bp, p) {
        return this.#blocks[bp].items[p];
    }

    #getBlockIndex(controller) {
        for (let i = 0; i < this.#blocks.length; i++) {
            if (this.#blocks[i].controller === controller) {
                return i;
            }
        }
        return null;
    }

    #hideCursor() {
        document.body.classList.add('--hide-cursor');
    }
    #showCursor() {
        document.body.classList.remove('--hide-cursor');
    }

    addBlock(controller, items) {
        const block = {
            controller: controller,
            items: items,
        }

        const index = this.#getBlockIndex(controller);
        if (index !== null) {
            this.#blocks[index] = block;
        } else {
            this.#blocks.push(block);
        }

        for (let i = 0; i < items.length; i++) {
            items[i].addEventListener('click', this.#onElementClick.bind(this, controller, i));
            items[i].addEventListener('contextmenu', this.#onElementRightClick.bind(this, controller, i));
        }

        for (const block of this.#blocks) {
            block.top = getAbsPosition(block.items[0]).top;
        }

        this.#blocks.sort((a, b) => a.top - b.top);
    }

    removeBlock(controller) {
        const index = this.#getBlockIndex(controller);
        if (index !== null) {
            this.#blocks.splice(index, 1);
        }
    }

    pointTo(controller, elOrIndex) {
        const index = this.#getBlockIndex(controller);

        if (index !== null) {
            if (!Number.isInteger(elOrIndex)) {
                elOrIndex = Array.prototype.indexOf.call(this.#blocks[index].items, elOrIndex) ?? 0;
            }

            if (index !== this.#blockPointer || elOrIndex !== this.#pointer) {
                this.#setPointer(index, elOrIndex);
                this.#updateXCourse();
            }
        }
    }
}