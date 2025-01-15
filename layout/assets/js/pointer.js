"use strict"

import {getAbsPosition, scrollToElement} from "./tools.js";


export class PointerController {
    _pointer = null;
    _xCourse = 0;
    _items = [];
    _indexes= new Map();

    constructor() {}

    rebuild(items) {
        const pos = this.getPointerPos();

        this._items = items;
        if (this._items.length === 0) {
            return;
        }

        this._indexes = new Map();
        for (const i in this._items) {
            this._indexes.set(this._items[i], parseInt(i));
        }

        this._fixPointer(pos);
    }

    pointTo(el) {
        const pos = this.getElementPos(el);
        if (pos === null) { return; }

        this._setPointer(pos);
        this._updateXCourse();
    }

    getPointer() {
        return this._pointer;
    }

    clearPointer() {
        this._pointer = null;
        this._xCourse = 0;
    }

    getElementPos(el) {
        return this._indexes.get(el) ?? null;
    }

    getPointerPos() {
        return this.getElementPos(this._pointer);
    }

    move(key) {
        let p = this.getPointerPos();

        if (this._pointer === null || p === null) {
            if (this._items.length === 0) {
                this.clearPointer();
            } else {
                this._setPointer(0);
            }
            return;
        }

        let max = this._items.length - 1;

        if (key === 'left') {
            if (p === 0) { return; }
            this._setPointer(p - 1);
            this._updateXCourse();

        } else if (key === 'right') {
            if (p === max) { return; }
            this._setPointer(p + 1);
            this._updateXCourse();

        } else if (key === 'home') {
            this._setPointer(0);

        } else if (key === 'end') {
            this._setPointer(max);

        } else if (key === 'up') {

            let start = getAbsPosition(this._items[p]);
            while (p > 0) {
                p--;
                const coords = getAbsPosition(this._items[p]);
                if (Math.abs(coords.top - start.top) > 5) {
                    start = coords;
                    break;
                }
            }

            const needX = this._xCourse;
            let bestP = p;
            let minDist = Math.abs(needX - start.left);

            while (p > 0) {
                p--;
                const pos = getAbsPosition(this._items[p]);
                if (Math.abs(pos.top - start.top) > 5) {
                    break;
                }
                const dist = Math.abs(pos.left - needX);
                if (dist < minDist) {
                    bestP = p;
                    minDist = dist;
                }
            }

            this._setPointer(bestP);

        } else if (key === 'down') {

            let start = getAbsPosition(this._items[p]);
            while (p < max) {
                p++;
                const coords = getAbsPosition(this._items[p]);
                if (Math.abs(coords.top - start.top) > 5) {
                    start = coords;
                    break;
                }
            }

            const needX = this._xCourse;
            let bestP = p;
            let minDist = Math.abs(needX - start.left);

            while (p < max) {
                p++;
                const pos = getAbsPosition(this._items[p]);
                if (Math.abs(pos.top - start.top) > 5) {
                    break;
                }
                const dist = Math.abs(pos.left - needX);
                if (dist < minDist) {
                    bestP = p;
                    minDist = dist;
                }
            }

            this._setPointer(bestP);
        }
    }

    getItems() {
        return this._items;
    }

    _setPointer(p) {
        const pos = this.getPointerPos();
        if (pos !== null) {
            this._items[pos].classList.remove('--pointer');
        }

        const el = this._items[p];
        this._pointer = el;
        el.classList.add('--pointer');
        scrollToElement(el, 100);
    }

    _fixPointer(pos) {
        if (pos === null) { return; }
        if (this.getPointerPos() !== null) { return; }

        if (this._items.length === 0) {
            this.clearPointer();
            return;
        }

        if (this._items.length <= pos) {
            pos = this._items.length - 1;
        }

        this._setPointer(pos);
    }

    _updateXCourse() {
        this._xCourse = getAbsPosition(this._pointer).left;
    }
}