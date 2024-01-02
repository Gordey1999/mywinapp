
export class FilesIndexer {
    #items = null;
    #resizedCount = 0;
    #pointer = null;
    #pointerScroll = null;
    #progressEl = null;
    #progressBarEl = null;

    constructor() {
        this.#progressEl = document.querySelector('.progress');
        this.#progressBarEl = this.#progressEl.querySelector('.bar');

        $('.content').on('scroll', this.onScroll.bind(this));
    }

    setFiles(items) {
        this.#items = items;

        this.#hideProgress();

        this.#pointer = 0;
        this.#pointerScroll = null;

        this.#resizedCount = 0;
        for (let item of items) {
            if (item.getFile().preview !== null)
                this.#resizedCount++;
        }

        if (this.#resizedCount !== items.length) {
            this.#showProgress();
            this.#setProgress(this.#resizedCount / items.length * 100);

            this.#resizeNext();
        } else {
            this.#showProgress(true);
            this.#indexNext();
        }
    }

    onScroll(e) {
        if (this.#resizedCount === this.#items.length)
            return;

        const firstRect = this.#items[0].getElement().getBoundingClientRect();

        if (firstRect.top > 0)
            return;

        const itemWidth = firstRect.width + 4; // todo margin
        const itemsInRow = Math.floor(window.innerWidth / itemWidth);
        this.#pointerScroll = Math.floor(-firstRect.top / itemWidth) * itemsInRow;
    }

    #resizeNext() {
        if (this.#pointerScroll !== null) {
            this.#pointer = this.#pointerScroll;
            this.#pointerScroll = null;
        }
        if (this.#resizedCount === this.#items.length) {

            this.#showProgress(true);
            this.#indexNext();

            return;
        }

        while (this.#pointer < this.#items.length && this.#items[this.#pointer].getFile().preview !== null)
            this.#pointer++;

        if (this.#pointer === this.#items.length) {
            this.#pointer = 0;
            this.#resizeNext();
        }

        const file = this.#items[this.#pointer].getFile();

        window.api.invoke('filesMakePreview', file.src)
            .then(this.onMakePreview.bind(this, file.src));
    }

    onMakePreview(src, preview) {
        const item = this.#items[this.#pointer];
        if (item?.getFile().src !== src) return;

        item.setPreview(preview);

        this.#resizedCount++;
        this.#setProgress(this.#resizedCount / this.#items.length * 100);

        this.#resizeNext();
    }

    #showProgress(index = false) {
        this.#progressEl.classList.add('active');
        if (index)
            this.#progressEl.classList.add('blue');
        else
            this.#progressEl.classList.remove('blue');
    }
    #setProgress(percent) {
        this.#progressBarEl.style.width = percent + '%';
    }
    #hideProgress() {
        this.#progressEl.classList.remove('active');
    }

    #indexNext(status) {
        if (status === 'done') {
            this.#hideProgress();
            return;
        }

        this.#setProgress(status / this.#items.length * 100);
        setTimeout(() => {
            window.api.invoke('filesIndexStep')
                .then(this.#indexNext.bind(this));
        }, 10);
    }
}