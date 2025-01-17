import {loadIcon} from "./icons.js";

window.assets.addCss('tools.css');

/** @deprecated */
export function createNode(tag, className = null, parent = null) {
    const el = document.createElement(tag);

    if (className)
        el.classList.add(className);

    if (parent)
        parent.append(el);

    return el;
}

const contentContainer = document.querySelector('.content');

export function scrollToElement(el, offset = 0) {
    const view = el.getBoundingClientRect();
    const containerView = contentContainer.getBoundingClientRect();

    const scroll = contentContainer.scrollTop;

    if (offset === 0) {
        offset = view.height / 2;
    }

    const topOffset = view.top - containerView.top - offset;
    const bottomOffset =  view.bottom - containerView.bottom + offset;
    if (topOffset < 0) {
        contentContainer.scrollTo(0, scroll + topOffset);
    } else if (bottomOffset > 0) {
        contentContainer.scrollTo(0, scroll + bottomOffset);
    }
}

export function getScroll() {
    return contentContainer.scrollTop;
}

export function setScroll(scroll) {
    if (!scroll) { return; }
    contentContainer.scrollTo(0, scroll);
}

export function scrollByMouse(e, offset = 200, scrollStep = 30) {
    const containerView = contentContainer.getBoundingClientRect();
    const scroll = contentContainer.scrollTop;

    const topOffset = containerView.top + offset;
    const bottomOffset =  containerView.bottom - offset;

    if (e.clientY < topOffset) {
        contentContainer.scrollTo(0, scroll - scrollStep);
    } else if (e.clientY > bottomOffset) {
        contentContainer.scrollTo(0, scroll + scrollStep);
    }
}

export function scrollToTop() {
    contentContainer.scrollTo(0, 0);
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

/* --- ADAPTIVE GRID --- */

export function calculateAdaptiveGrid($container) {
    const width = $container.data('width');
    const margin = 2 * $container.data('margin');


    const containerWidth = $container.width();
    const elMinWidth = width + margin;

    let count = Math.floor(containerWidth / elMinWidth);

    if (count < 1) { count = 1; }

    const itemWidth = containerWidth / count;

    const el = $container.get(0);
    el.style.setProperty('--grid-item-width', itemWidth - margin + 'px');

    const oldCount = $container.data('count');
    $container.data('count', count);

    $container.trigger('adaptiveWidthChanged', [ itemWidth, count ]);

    if (parseInt(oldCount) !== count) {
        $container.trigger('adaptiveGridChanged', [ count ]);
    }
}

function calculateAdaptiveGridAll() {
    $('.--adaptive-grid').each(function () {
        calculateAdaptiveGrid($(this));
    });
}


$(window).on('resize', () => {
    calculateAdaptiveGridAll();
});

calculateAdaptiveGridAll();


/* --- SCROLLBAR --- */

export function createScrollbar(el) {
    new Scrollbar(el);
}

class Scrollbar {
    #container = null;
    #el = null;
    #line = null;
    #bar = null;
    #timer = null;

    #moveBar = false;
    #moveOptions = null;

    constructor(el) {
        this.#container = el;

        this.#make();

        this.#bind();
    }

    #make() {
        this.#el = createNode('div', 'scrollbar', this.#container.parentElement);
        this.#line = createNode('div', 'scrollbar__line', this.#el);
        this.#bar = createNode('div', 'scrollbar__bar', this.#line);
    }

    #bind() {
        this.#container.addEventListener('scroll', this.#onScroll.bind(this));

        this.#el.addEventListener('mouseover', this.#onScroll.bind(this));
        this.#bar.addEventListener('mousedown', this.#onMouseDown.bind(this));
        document.addEventListener('mousemove', this.#onMouseMove.bind(this));
        document.addEventListener('mouseup', this.#onMouseUp.bind(this));
    }

    #onMouseDown(e) {
        this.#moveBar = true;
        this.#el.classList.add('--active');

        const my = e.clientY;
        const lineHeight = this.#line.offsetHeight;
        const barHeight = this.#bar.offsetHeight;
        const barOffset = this.#bar.offsetTop;

        this.#moveOptions = {
            min: my - barOffset,
            max: my + (lineHeight - barOffset - barHeight),
        }
    }
    #onMouseMove(e) {
        if (!this.#moveBar) return;

        const options = this.#moveOptions;
        const my = e.clientY;


        let pos = (my - options.min) / (options.max - options.min);
        if (my < options.min) pos = 0;
        else if (my > options.max) pos = 1;

        const viewportHeight = this.#container.clientHeight;
        const docHeight = this.#container.scrollHeight;
        const maxScroll = docHeight - viewportHeight;

        this.#container.scrollTo(0, pos * maxScroll);
    }
    #onMouseUp() {
        this.#moveBar = false;
        this.#el.classList.remove('--active');
    }

    #onScroll() {

        const scroll = this.#container.scrollTop;
        const viewportHeight = this.#container.clientHeight; // equals document.documentElement.clientHeight
        const docHeight = this.#container.scrollHeight;
        
        if (viewportHeight >= docHeight) {
            $(this.#el).css('opacity', 0);
        } else {
            $(this.#el).css('opacity', 1);
        }

        const elHeight = this.#line.offsetHeight;
        let barHeight = viewportHeight / docHeight * elHeight;
        let offset = scroll / docHeight * elHeight;

        const minBarHeight = 75;

        if (barHeight < minBarHeight) {
            barHeight = minBarHeight;
            const scrollMax = docHeight - viewportHeight;
            offset = (scroll / scrollMax) * (elHeight - minBarHeight);
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