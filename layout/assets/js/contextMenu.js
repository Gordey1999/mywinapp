import {loadIcon} from "./icons.js";

window.assets.addCss('contextMenu.css');

let contextMenu = null;

export function makeContextMenu(menu, x, y, type = null, onCloseCallback) {
    if (contextMenu !== null) {
        contextMenu.destroy();
    }

    let listClass = ContextMenuList;
    if (type === 'header') {
        listClass = ContextMenuListHeader;
    }

    contextMenu = new ContextMenu(listClass, menu, onCloseCallback, x, y);
}

class ContextMenu {
    _contextMenuList = null;
    _closeCallback = null;

    constructor(listClass, menu, closeCallback = null, ...args) {
        this._contextMenuList = new listClass(menu, this, ...args);
        this._closeCallback = closeCallback;

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
        if (this._closeCallback !== null) { this._closeCallback() }
        this._closeCallback = null;

        this._contextMenuList.destroy();
        this._bind('off');
    }
}

class ContextMenuList {
    _menu = null;
    _$container = null;
    _controller = null
    _direction = null;
    _offsetTop = 40;
    _offsetBottom = 10;
    _loadingChildren = false;

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
        const [$container, $inner] = this._makeContainer();

        for (const item of this._menu) {
            if (item?.type === 'separator') {
                this._makeSeparator($inner);
            } else if (item?.type === 'group') {
                this._makeGroup(item, $inner);
            } else {
                item.type = 'row';
                this._makeRow(item, $inner);
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
        if (this._loadingChildren) { return; }
        const $item = $(e.target).closest('.context-menu__item');
        if (!$item.length) { return; }

        if (this._active.$el?.get(0) === $item.get(0)) { return }

        const item = this._getItem($item);

        if (this._active.childList !== null) {
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

        if (typeof item.children === 'function') {
            this._loadingChildren = true;
            item.children().then(result => {
                this._loadingChildren = false;
                this._active.childList = new ContextMenuList(result, this._controller, left + width, top, this._direction, width);
            });
        } else {
            this._active.childList = new ContextMenuList(item.children, this._controller, left + width, top, this._direction, width);
        }
    }

    _closeChildList() {
        this._active.childList.destroy();
    }

    _handle($item, item) {
        $item.click(this._onItemClick.bind(this, item));
    }

    _makeContainer() {
        const $container = $('<div>').addClass('context-menu');
        const $inner = $('<div>').addClass('context-menu__inner');
        $container.append($inner);
        $('body').append($container);
        return [ $container, $inner ];
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

    _makeScroll() {
        this._$container.addClass('--scroll');

        const $topArrow = loadIcon('arrowFilled')
        $($topArrow).addClass('context-menu__arrow-top');

        const $bottomArrow = loadIcon('arrowFilled')
        $($bottomArrow).addClass('context-menu__arrow-bottom');

        this._$container.append($topArrow, $bottomArrow);
    }

    _calculatePosition(x, y, direction, parentWidth) {
        const winWidth = $(window).width();
        const winHeight = $(window).height();
        const maxHeight = winHeight - this._offsetTop - this._offsetBottom;

        const width = this._$container.outerWidth();
        const height = this._$container.outerHeight();

        y = Math.max(y, this._offsetTop);

        if (height > maxHeight) {
            y = this._offsetTop;
            this._makeScroll();
            const padding = this._$container.outerHeight() - this._$container.height();
            this._$container.height(maxHeight - padding);
        } else if (y + height > winHeight - this._offsetBottom) {
            y = winHeight - height - this._offsetBottom;
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

class ContextMenuListHeader extends ContextMenuList {
    constructor(...args) {
        super(...args);

        this._$container.addClass('--header');
    }
}