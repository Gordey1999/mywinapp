import {loadIcon} from "./icons.js";

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
    const scroll = contentContainer.scrollTop;
    const winHeight = contentContainer.clientHeight;

    if (offset === 0) {
        offset = view.height / 2;
    }
    const top = view.top - offset;
    const bottom = winHeight - (view.top + view.height + offset);

    if (top < 0) {
        contentContainer.scrollTo(0, scroll + top);
    } else if (bottom < 0) {
        contentContainer.scrollTo(0, scroll - bottom);
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


export function adaptiveGrid($container, width, margin, fallback = null) {
    $(window).on('resize', () => {
        calculate();
    });

    $container.addClass('--adaptive-grid');

    function calculate() {
        const containerWidth = $container.width();
        const elMinWidth = width + margin * 2;

        let count = Math.floor(containerWidth / elMinWidth);

        if (count < 1) { count = 1; }

        const resultWidth = (containerWidth / count) - (margin * 2);

        $container[0].style.setProperty('--grid-item-width', resultWidth + 'px');

        if (fallback !== null) {
            fallback(count);
        }
    }
    calculate();
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
    }

    #onScroll() {

        const scroll = this.#container.scrollTop;
        const viewportHeight = this.#container.clientHeight; // equals document.documentElement.clientHeight
        const docHeight = this.#container.scrollHeight;

        const elHeight = this.#line.offsetHeight;
        let barHeight = viewportHeight / docHeight * elHeight;
        let offset = scroll / docHeight * elHeight;

        const minBarHeight = 50;

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


export class ContextMenu {
    _contextMenuList = null;
    closeTimeout = 200;

    constructor(menu, x, y) {
        this._contextMenuList = new ContextMenuList(menu, this, x, y);

		setTimeout(() => {
			this._bind('on');
		}, 10);
    }

	_bind(dir) {
		const $body = $('body');
		$body[dir]('keydown', this._onKeyboardEvent);
		$body[dir]('click', this._onClickEvent);
		$body[dir]('contextmenu', this._onClickEvent);
	}

	_onKeyboardEvent = () => {
		this.destroy();
	}

	_onClickEvent = (e) =>  {
		if ($(e.target).closest('.context-menu').length === 0) {
			this.destroy();
		}
	}

    destroy() {
        this._contextMenuList.destroy();
	    this._bind('off');
    }
}

class ContextMenuList {
    _menu = null;
    _$container = null;
    _controller = null
	_direction = null;

	_itemMap = [];

	_active = {
		$el: null,
		childList: null,
		mouseX: 0,
		mouseY: 0,
	};

    constructor(menu, controller, x, y, direction = 'right', parentWidth = 0) {
        this._menu = menu;
        this._controller = controller;

        this._$container = this._make();

        this._calculatePosition(x, y, direction, parentWidth);

		this._$container.on('mousemove', this._onMouseMove.bind(this));
	    this._$container.on('mouseleave', this._onMouseLeave.bind(this));
    }

    _make() {
        const $container = this._makeContainer();

        for (const item of this._menu) {
            if (item?.type === 'separator') {
                this._makeSeparator($container);
            } else if (item?.type === 'group') {
                this._makeGroup(item, $container);
            } else {
                item.type = 'row';
                this._makeRow(item, $container);
            }
        }
        return $container;
    }

    _onItemClick(item) {
        if (item?.callback) {
            this._controller.destroy();
            item.callback(item);
        }
    }

	_onMouseMove(e) {
		const $item = $(e.target).closest('.context-menu__item');
		if (!$item.length) { return; }

		if (this._active.$el === $item) { return }

		const item = this._getItem($item);

		if (this._active.childList) {
			const mx = e.screenX;
			const my = e.screenY;

			if (
				this._active.childList._direction === 'right' && mx - this._active.mouseX > 2
				|| this._active.childList._direction === 'left' && this._active.mouseX - mx > 2
			) {
				this._active.mouseX = mx;
				this._active.mouseY = my;
				return;
			}

			this._closeChildList();
		}

		this._active.$el?.removeClass('active');
		$item.addClass('active');
		this._active.$el = $item;
		this._active.childList = null;

		if (item?.children) {
			this._openChildList($item, item);
			this._active.mouseX = e.screenX;
			this._active.mouseY = e.screenY;
		}
	}

	_onMouseLeave(e) {
		if (this._active.$el !== null && this._active.childList === null) {
			this._active.$el?.removeClass('active');
			this._active.$el = null;
		}
	}

	_getItem($el) {
		for (const el of this._itemMap) {
			if (el.$el.get(0) === $el.get(0)) { return el.item; }
		}
	}

	_openChildList($item, item) {
		const { left, top } = $item.offset();
		const width = $item.outerWidth();

		this._active.childList = new ContextMenuList(item.children, this._controller, left + width, top, this._direction, width);
	}

	_closeChildList() {
		this._active.childList.destroy();
    }

    _handle($item, item) {
        $item.click(this._onItemClick.bind(this, item));
    }

    _makeContainer() {
        const $container = $('<div>').addClass('context-menu');
        $('body').append($container);
        return $container;
    }

    _makeRow(item, $container) {
        const $row = $('<div>').addClass('context-menu__item');
        const $icon = this._makeIcon(item.icon ?? null);
        const $name = $('<div>').addClass('context-menu__item-name').text(item.name);
        const $icon2 = this._makeIcon(item?.children ? 'arrow' : null);

        $row.append($icon, $name, $icon2);
        this._handle($row, item);

		this._itemMap.push({ item: item, $el: $row });

        $container.append($row);
    }

    _makeSeparator($container) {
        const $separator = $('<div>').addClass('context-menu__separator');
        $container.append($separator);
    }

    _makeGroup(group, $container) {
        const $row = $('<div>').addClass('context-menu__item-group');

        for (const item of group.children) {
            const $item = $('<div>').addClass('context-menu__item');

            if (item?.icon) {
                $item.append(this._makeIcon(item.icon))
            }
            if (item?.name) {
                $item.append($('<div>').addClass('context-menu__item-name').text(item.name))
            }
            if (item?.grow) {
                $item.addClass('--grow');
            }
            this._handle($item, item);

	        this._itemMap.push({ item: item, $el: $item });

            $row.append($item);
        }
        $container.append($row);
    }

    _makeIcon(icon = null) {
        const $icon = $('<div>').addClass('context-menu__item-icon');
        if (icon !== null) {
            $icon.html(loadIcon(icon));
        }
        return $icon;
    }

    _calculatePosition(x, y, direction, parentWidth) {
        const winWidth = $(window).width();
        const winHeight = $(window).height();

        const width = this._$container.outerWidth();
        const height = this._$container.outerHeight();

        if (y + height > winHeight) {
            y = winHeight - height - 10;
        }

		if (direction === 'left') {
			x -= parentWidth + width;
		}

        if (direction === 'right' && x + width > winWidth) {
            x -= width + parentWidth;
			direction = 'left';
        } else if (direction === 'left' && x < 0) {
	        x += width + parentWidth;
	        direction = 'right';
        }

        this._$container.css('left', x + 'px');
        this._$container.css('top', y + 'px');
		this._direction = direction;
    }

    destroy() {
	    this._active.childList?.destroy();
	    this._active.childList = null;
        this._$container.remove();
    }
}