import {getAbsPosition, scrollToElement} from "./tools.js";


// controller implements:
// getElementsSelector() : string
// onKeyboardEvent(key, index, el, evt)
// onSetPointer(index, el)

export class KeyboardController {
    _blocks = [];
    _pointer = null;
    _xCourse = 0;

    constructor() {
        document.addEventListener('keydown', this._onKeyboard.bind(this));
        document.addEventListener('mousemove', this._showCursor.bind(this));
    }

    addBlock(controller) {
        let block = this._getBlock(controller);

        if (block === null) {
            block = {
                controller: controller,
                items: [],
                indexes: new Map(),
                yPos: 0,
            }
            this._blocks.push(block);
        }

        const pos = this._getPointerPos();
        this._rebuildBlock(block);
        this._fixPointer(pos);

        this._blocks.sort((a, b) => a.yPos - b.yPos);
    }

    removeBlock(controller) {
        const index = this._getBlockIndex(controller);
        const pos = this._getPointerPos();

        if (index === null) {
            return;
        }

        for (const item of this._blocks[index].items) {
            item.removeEventListener('click', this._onElementClick);
            item.removeEventListener('contextmenu', this._onElementRightClick);
        }

        this._blocks.splice(index, 1);

        this._fixPointer(pos);
    }

    pointTo(el) {
        const pos = this._getElementPos(el);
        if (pos === null) { return; }

        this._setPointer(pos.block, pos.item);
        this._updateXCourse();
    }

    clearPointer() {
        this._pointer = null;
        this._xCourse = 0;
    }

    getPointerIndex(controller) {
        const i = this._getBlockIndex(controller);
        const pos = this._getPointerPos();

        if (i === null || pos === null || i !== pos.block) { return null; }

        return pos.item;
    }

    _rebuildBlock(block) {
        const items = $(block.controller.getElementsSelector()).toArray();
        if (items.length === 0) {
            this.removeBlock(block);
            return;
        }

        const newItems = items.filter(item => !block.items.includes(item));
        for (const item of newItems) {
            item.addEventListener('click', this._onElementClick);
            item.addEventListener('contextmenu', this._onElementRightClick);
        }
        block.items = items;
        block.yPos = getAbsPosition(items[0]).top;

        block.indexes = new Map();
        for (const i in block.items) {
            block.indexes.set(block.items[i], i);
        }
    }

    _onKeyboard = (e) => {
        if (e.target.tagName === 'INPUT') { return; }

        let triggered = true;

        if (e.code === 'KeyD' || e.code === 'ArrowRight') {
            this._move('right');
        } else if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
            this._move('left');
        } else if (e.code === 'KeyW' || e.code === 'ArrowUp') {
            this._move('up');
        } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
            this._move('down');
        } else if (e.code === 'Home') {
            this._move('home');
        } else if (e.code === 'End') {
            this._move('end');
        } else if (e.code === 'Space' || e.code === 'Enter') {
            this._trigger('enter');
        } else if (e.key === 'Shift') {
	        this._trigger('shift');
        } else if (e.key === 'Control') {
	        this._trigger('control');
        } else {
            triggered = false;
        }

        if (triggered) {
            e.preventDefault();
        }
    }

    _onElementClick = (e) => {
        const el = e.currentTarget;

        if (e.detail === 1) {
            this.pointTo(el);
            this._trigger('click');
        }
        else if (e.detail === 2) {
            this._trigger('dbClick');
        }
    }

    _onElementRightClick = (e) => {
        const el = e.currentTarget;

        this.pointTo(el);
        this._trigger('rightClick', e);
    }

    _trigger(key, e = null) {
        const pos = this._getPointerPos();
        if (pos === null) { return; }
        this._blocks[pos.block].controller.onKeyboardEvent(key, pos.item, this._pointer, e);
    }

    _getElementPos(el) {
        for (const i in this._blocks) {
            if (this._blocks[i].indexes.has(el)) {
                return {
                    block: parseInt(i),
                    item: parseInt(this._blocks[i].indexes.get(el)),
                };
            }
        }
        return null;
    }

    _getPointerPos() {
        return this._getElementPos(this._pointer);
    }

    _move(key) {
        this._hideCursor();
        const pos = this._getPointerPos();

        if (this._pointer === null || pos === null) {
            if (this._blocks.length === 0) {
                this.clearPointer();
                return;
            } else {
                this._setPointer(0, 0);
                return;
            }
        }

        let {block: bp, item: p} = pos;

        const bMax = this._blocks.length - 1;
        let max = this._blocks[bp].items.length - 1;

        if (key === 'left') {
            if (p === 0) { return; }
            this._setPointer(bp, p - 1);
            this._updateXCourse();

        } else if (key === 'right') {
            if (p === max) { return; }
            this._setPointer(bp, p + 1);
            this._updateXCourse();

        } else if (key === 'home') {
            this._setPointer(0, 0);

        } else if (key === 'end') {
            this._setPointer(bMax, this._blocks[bMax].items.length - 1);

        } else if (key === 'up') {

            let start = getAbsPosition(this._blocks[bp].items[p]);
            while (true) {
                if (p === 0 && bp === 0) { return; }
                if (p === 0) {
                    bp--;
                    p = this._blocks[bp].items.length - 1;
                    start = getAbsPosition(this._blocks[bp].items[p]);
                    break;
                }
                p--;
                const coords = getAbsPosition(this._blocks[bp].items[p]);
                if (Math.abs(coords.top - start.top) > 5) {
                    start = coords;
                    break;
                }
            }

            const needX = this._xCourse;
            let bestP = p;
            let minDist = Math.abs(needX - start.left);

            while (true) {
                p--;
                if (p < 0) { break; }
                const pos = getAbsPosition(this._blocks[bp].items[p]);
                if (Math.abs(pos.top - start.top) > 5) {
                    break;
                }
                const dist = Math.abs(pos.left - needX);
                if (dist < minDist) {
                    bestP = p;
                    minDist = dist;
                }
            }

            this._setPointer(bp, bestP);

        } else if (key === 'down') {

            let start = getAbsPosition(this._blocks[bp].items[p]);
            while (true) {
                if (p === max && bp === bMax) { return; }
                if (p === max) {
                    bp++;
                    p = 0;
                    start = getAbsPosition(this._blocks[bp].items[p]);
                    max = this._blocks[bp].items.length - 1;
                    break;
                }
                p++;
                const coords = getAbsPosition(this._blocks[bp].items[p]);
                if (Math.abs(coords.top - start.top) > 5) {
                    start = coords;
                    break;
                }
            }

            const needX = this._xCourse;
            let bestP = p;
            let minDist = Math.abs(needX - start.left);

            while (true) {
                p++;
                if (p > max) { break; }
                const pos = getAbsPosition(this._blocks[bp].items[p]);
                if (Math.abs(pos.top - start.top) > 5) {
                    break;
                }
                const dist = Math.abs(pos.left - needX);
                if (dist < minDist) {
                    bestP = p;
                    minDist = dist;
                }
            }

            this._setPointer(bp, bestP);
        }
    }

    _setPointer(bp, p) {
        const pos = this._getPointerPos();
        if (pos !== null) {
            this._blocks[pos.block].items[pos.item].classList.remove('--pointer');
        }

        const block = this._blocks[bp];
        const el = block.items[p];
        this._pointer = el;
        el.classList.add('--pointer');
        scrollToElement(el, 100);

        if (typeof block.controller.onSetPointer !== 'undefined') {
            block.controller.onSetPointer(p, el);
        }
    }

    _fixPointer(pos) {
        if (pos === null) { return; }
        if (this._getPointerPos() !== null) { return; }

        if (this._blocks.length <= pos.block) {
            pos.block = this._blocks.length - 1;
            pos.item = this._blocks[pos.block].items.length - 1;
        }

        if (this._blocks[pos.block].items.length <= pos.item) {
            pos.item = this._blocks[pos.block].items.length - 1;
        }

        this._setPointer(pos.block, pos.item);
    }

    _updateXCourse() {
        this._xCourse = getAbsPosition(this._pointer).left;
    }

    _getBlockIndex(controller) {
        for (const i in this._blocks) {
            if (this._blocks[i].controller === controller) {
                return parseInt(i);
            }
        }
        return null;
    }

    _getBlock(controller) {
        const i = this._getBlockIndex(controller);
        return i === null ? null : this._blocks[i];
    }

    _hideCursor() {
        document.body.classList.add('--hide-cursor');
    }
    _showCursor = () => {
        document.body.classList.remove('--hide-cursor');
    }
}