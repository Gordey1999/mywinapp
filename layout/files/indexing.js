
class AbstractLoader {
    _progressEl = null;
    _progressBarEl = null;
    _resolve = null;
    _reject = null;

    constructor() {
        this._progressEl = document.querySelector('.progress');
        this._progressBarEl = this._progressEl.querySelector('.bar');
    }

    _start(blue = false) {
        this._showProgress(blue);

        return new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
    }

    _showProgress(blue = false) {
        this._progressEl.classList.add('active');
        if (blue)
            this._progressEl.classList.add('blue');
        else
            this._progressEl.classList.remove('blue');
    }
    _setProgress(percent) {
        this._progressBarEl.style.width = percent + '%';
    }
    _hideProgress() {
        this._progressEl.classList.remove('active');
    }

    _done() {
        this._hideProgress();
        this._resolve();
    }
    stop() {
        this._hideProgress();
        if (this._reject !== null) {
            this._reject('stop');
            this._reject = null;
            this._resolve = null;
        }
    }

    _isStopped() {
        return this._resolve === null;
    }
}


export class DirectoryLoader extends AbstractLoader {
    _dirs = null;
    _dirsCount = 0;
    _dirViewer = null;

    start(dirs, dirViewer) {
        const promise = this._start();

        this._dirs = dirs.reverse();
        this._dirsCount = dirs.length;
        this._dirViewer = dirViewer;

        this._processNext();

        return promise;
    }

    _processNext() {
        if (this._dirs.length === 0) {
            this._done();
            return;
        }

        const dir = this._dirs.pop();

        window.api.invoke('filesDirectoryInfo', dir.src)
            .then(this.onInfoLoaded.bind(this, dir.name));
    }

    onInfoLoaded(name, info) {
        this._dirViewer.setInfo(name, info);

        this._setProgress((this._dirsCount - this._dirs.length) / this._dirsCount * 100);

        this._processNext();
    }
}


export class PreviewLoader extends AbstractLoader {
    _items = null;
    _resizedCount = 0;
    _pointer = null;
    _pointerScroll = null;

    constructor() {
        super();
        $('.content').on('scroll', this._onScroll.bind(this));
    }

    start(items) {
        const promise = this._start();

        this._items = items;
        this._pointer = 0;

        this._onScroll();

        this._resizedCount = 0;
        for (let item of items) {
            if (item.getFile().preview !== null)
                this._resizedCount++;
        }

        if (this._resizedCount !== items.length) {
            this._showProgress();
            this._setProgress(this._resizedCount / items.length * 100);

            this._resizeNext();
        } else {
            this._done();
        }

        return promise;
    }

    _onScroll() {
        if (this._resizedCount === this._items.length)
            return;

        const firstRect = this._items[0]?.getElement()?.getBoundingClientRect();
        if (!firstRect) { return; }

        if (firstRect.top > 0)
            return;

        const itemWidth = firstRect.width + 4; // todo margin
        const itemsInRow = Math.floor(window.innerWidth / itemWidth);
        this._pointerScroll = Math.floor(-firstRect.top / itemWidth) * itemsInRow;
    }

    _resizeNext() {
        if (this._isStopped()) { return; }

        if (this._pointerScroll !== null) {
            this._pointer = this._pointerScroll;
            this._pointerScroll = null;
        }
        if (this._resizedCount === this._items.length) {
            this._done();
            return;
        }

        while (this._pointer < this._items.length && this._items[this._pointer].getFile().preview !== null) {
            this._pointer++;
        }

        if (this._pointer === this._items.length) {
            this._pointer = 0;
            this._resizeNext();
        }

        const file = this._items[this._pointer].getFile();

        window.api.invoke('filesMakePreview', file.src, file.mtime )
            .then(this.onMakePreview.bind(this, file.src));
    }

    onMakePreview(src, preview) {
        const item = this._items[this._pointer];
        if (item?.getFile().src !== src) return;

        item.setPreview(preview);

        this._resizedCount++;
        this._setProgress(this._resizedCount / this._items.length * 100);

        this._resizeNext();
    }
}

/** @deprecated */
export class DbIndexer extends AbstractLoader {
    _count = null;

    start(items) {
        this._count = items.length;
        this._indexNext();

        return this._start(true);
    }

    _indexNext(status) {
        if (status === 'done') {
            this._done();
            return;
        }

        this._setProgress(status / this._count * 100);
        setTimeout(() => {
            window.api.invoke('filesIndexStep')
                .then(this._indexNext.bind(this));
        }, 10);
    }
}