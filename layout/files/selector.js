"use strict";

export class Selector {
    _pointer = null;
    _select = [];
    _cursor = null;

    constructor(pointer) {
        this._pointer = pointer;
    }

    move(e = null) {
        if (e === null) {
            this.clear();
            return;
        }

        if (e.shiftKey) {
            this._selectShift();
        } else if (e.ctrlKey) {
            this._selectCtrl();
        } else {
            this.clear();
        }
    }

    clear() {
        this._cursor = this._pointer.getPointer();
        this._clear();
    }

    set(elements) {
        this._clear();
        this._add(elements);
    }

    _selectShift() {
        const from = this._cursor;
        const to = this._pointer.getPointer();

        const list = this._fetchChain(from, to);
        const remove = this._select.filter(item => !list.includes(item));

        this._add(list);
        this._remove(remove);
    }

    _selectCtrl() {
        if (this._select.length === 0) {
            this._add([ this._cursor ]);
        }

        this._cursor = this._pointer.getPointer();

        if (this._cursor !== null) {
            if (this._select.includes(this._cursor)) {
                this._remove([ this._cursor ]);
            } else {
                this._add([ this._cursor ]);
            }
        }
    }

    _fetchChain(from, to) {
        let fromI = this._pointer.getElementPos(from);
        let toI = this._pointer.getElementPos(to);

        if (fromI > toI) {
            [fromI, toI] = [toI, fromI];
        }

        return this._pointer.getItems().slice(fromI, toI + 1);
    }

    _add(items) {
        for (const item of items) {
            if (this._select.includes(item)) { continue; }

            item.classList.add('--select');
            this._select.push(item);
        }
    }

    _remove(items) {
        const result = [];
        for (const item of this._select) {
            if (items.includes(item)) {
                item.classList.remove('--select');
            } else {
                result.push(item);
            }
        }
        this._select = result;
    }

    _clear() {
        for (const item of this._select) {
            item.classList.remove('--select');
        }
        this._select = [];
    }

    getSelected() {
        if (this._select.length === 0) {
            return this._cursor === null ? [] : [ this._cursor.dataset.name ];
        }

        return this._select.map(item => item.dataset.name);
    }
}

// если правая кнопка, то нужно оставить выделение