
export function createNode(tag, className = null, parent = null) {
    const el = document.createElement(tag);

    if (className)
        el.classList.add(className);

    if (parent)
        parent.append(el);

    return el;
}

export function scrollToElement(el, offset = 0) {
    const view = el.getBoundingClientRect();
    const scroll = document.documentElement.scrollTop;
    const winHeight = window.innerHeight;

    if (offset === 0) {
        offset = view.height / 2;
    }
    const top = view.top - offset;
    const bottom = winHeight - (view.top + view.height + offset);

    if (top < 0) {
        window.scrollTo(0, scroll + top);
    } else if (bottom < 0) {
        window.scrollTo(0, scroll - bottom);
    }
}

export function getAbsPosition(el) {
    const rect = el.getBoundingClientRect();
    const halfW = (rect.right - rect.left) / 2;
    const halfH = (rect.bottom - rect.top) / 2;
    return {
        left: rect.left + halfW + window.scrollX,
        top: rect.top + halfH + window.scrollY
    };
}

export function createScrollbar(el) {
    new Scrollbar(el);
}

class Scrollbar {
    #container = null;
    #el = null;
    #line = null;
    #bar = null;
    #timer = null;

    constructor(el) {
        this.#container = el;

        this.#make();

        this.#bind();
    }

    #make() {
        this.#el = createNode('div', 'scrollbar', this.#container);
        this.#line = createNode('div', 'scrollbar__line', this.#el);
        this.#bar = createNode('div', 'scrollbar__bar', this.#line);
    }

    #bind() {
        if (this.#container === document.body) {
            document.addEventListener('scroll', this.#onScroll.bind(this));
        } else {
            this.#container.addEventListener('scroll', this.#onScroll.bind(this));
        }
    }

    #onScroll(e) {

        const scroll = document.documentElement.scrollTop;
        const viewportHeight = window.innerHeight; // equals document.documentElement.clientHeight
        const docHeight = document.documentElement.scrollHeight;

        const elHeight = this.#line.offsetHeight;
        let barHeight = viewportHeight / docHeight * elHeight;
        let offset = scroll / docHeight * elHeight;

        const minBarHeight = 50;

        if (barHeight < minBarHeight) {
            barHeight = minBarHeight;
            offset = (scroll + viewportHeight / 2) / docHeight * (elHeight - minBarHeight);
        }

        this.#bar.style.height = barHeight + 'px';
        this.#bar.style.top = offset + 'px';
        this.#bar.style.opacity = 1;

        this.#startTimer();
    }

    #startTimer() {
        if (this.#timer) {
            clearTimeout(this.#timer);
        }
        this.#timer = setTimeout(this.#onTimer.bind(this), 1000);
    }

    #onTimer() {
        this.#bar.style.removeProperty('opacity');
    }
}