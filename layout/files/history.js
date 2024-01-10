
export class MovementHistory {
    _history = [];
    _pointer = -1;

    constructor() {

    }

    add(src, pointTo = null, scroll = 0) {
        this._pointer++;
        this._history = this._history.slice(0, this._pointer);

        this._history.push({ src, pointTo, scroll });
    }

    update(pointTo = null, scroll = 0) {
        if (this._pointer < 0) { return; }
        this._history[this._pointer].pointTo = pointTo;
        this._history[this._pointer].scroll = scroll;
    }

    prev() {
        if (!this.hasPrev()) { return null; }

        return this._history[--this._pointer];
    }

    next() {
        if (!this.hasNext()) { return null; }

        return this._history[++this._pointer];
    }

    hasPrev() {
        return this._pointer > 0;
    }

    hasNext() {
        return this._pointer < this._history.length - 1;
    }

    search(src) {
        const history = this._history.slice().reverse();
        for (const item of history) {
            if (item.src === src) {
                return item;
            }
        }
        for (let i = this._pointer; i > 0; i--) {
            if (this._history[i].src === src) {
                return this._history[i];
            }
        }
    }
}