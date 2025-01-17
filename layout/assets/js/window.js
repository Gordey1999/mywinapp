import {createScrollbar} from "./tools.js";
import {makeContextMenu} from "./contextMenu.js";
import {loadIcon} from "./icons.js";

window.assets.addCss('window.css');

class Menu {
    _$menuBtn = null;
    _$header = null;
    _$container = null;
    _items = [];

    constructor($container, $header) {
        this._$container = $container;
        this._$header = $header;

        this._$menuBtn = $('<div>').addClass('header__menu-small').append(loadIcon('menu'));
        this._$container.append(this._$menuBtn);

        this.#bind();
    }

    addMenuItem(name, callback, sort = 500) {
        this._items.push({
            name: name,
            callback: callback,
            sort: sort,
        });
    }

    addItems(items) {
        this._items = this._items.concat(items);
    }

    #bind() {
        this._$menuBtn.click(this.onMenuClick.bind(this));
    }

    onMenuClick() {
        if (this._$menuBtn.hasClass('--active')) {
            return;
        }
        this._$menuBtn.addClass('--active');
        const rect = this._$menuBtn.get(0).getBoundingClientRect();

        this._items.sort((a, b) => a.sort - b.sort);
        if (this._items[0].type === 'separator') {
            this._items = this._items.slice(1);
        }

        makeContextMenu(this._items, rect.left, rect.bottom, 'header', () => {
            this._$menuBtn.removeClass('--active');
        });
    }
}


const $header = $('.header');
const $window = $('.window');
const $content = $('.content');
let menu = null;
const isSettings = $('body').hasClass('--settings');

function initWindow() {
	if (isSettings) {
		makeBarSettings();
	} else {
		makeBar();
		createScrollbar($content[0]);

        menu && chooseTheme();
        menu && makeMenuOptions();
	}
}

if ($header.length && $window.length && $content.length) {
    initWindow();
}

export function addMenuOption(name, callback) {
    menu.addMenuItem(name, callback);
}

function makeBar() {
    $header.append(makeLogo());

    const $menu = $('<div>').addClass('header__menu');

	if ($header.hasClass('--show-menu')) {
        $header.append($menu);
        menu = new Menu($menu, $header);
	}

    const $title = $('<div>').addClass('header__title').html($('title').text())

    const $minimize = makeMinimize();
    const $close = makeClose();
    const $maximize = makeMaximize();

    $header.append($title, $minimize, $maximize, $close);
}

function chooseTheme() {
    const h = parseInt((Math.random() * 10)) * 22.5;
    const hsl = `hsl(${h}deg 52% 29% / 78%)`;
    $('body').css("--color-accent", hsl);

    const themes = [];
    for (let i = 0; i < 16; i++) {
        themes.push({
            name: '' + i,
            hover: () => {
                const hsl = `hsl(${i * 22.5}deg 52% 29% / 78%)`;
                $('body').css("--color-accent", hsl);
            },
            callback: () => {}
        });
    }

    menu.addItems([
        {
            name: 'Theme',
            children: themes,
            sort: 1100,
        }
    ]);
}

function makeMenuOptions() {
    menu.addItems([
        {
            type: 'separator',
            sort: 1000,
        },
        {
            name: 'Exit',
            sort: 2000,
            callback: () => window.api.send('exit'),
        }
    ]);
}

function makeBarSettings() {
	const $logo = makeLogo();

	const $title = $('<div>').addClass('header__title').html($('title').text());

	const $close = makeClose();

	$header.append($logo, $title, $close);
}

function makeLogo() {
	return $('<div>').addClass('header__logo').append($('<img src="../assets/icons/logo2_64.png" alt="logo" />'));
}

let titleTimeout = null;
export function setTitle(text) {
    $header.find('.header__title').text(text);

    if (titleTimeout !== null) {
        clearTimeout(titleTimeout);
    }

    titleTimeout = setTimeout(() => {
        $('title').text(text);
        titleTimeout = null;
    }, 1000);
}

export function addHeaderBlock($block) {
    $header.append($block);
}

export function makeMinimize() {
    const $button = $('<div>').addClass('header__icon --first').append(loadIcon('minimize'));

    $button.click(() => {
        window.api.send('minimize');
    })

    return $button;
}

export function makeMaximize() {
    const $button = $('<div>').addClass('header__icon').append(loadIcon('maximize'));

    const $iconMaximize = loadIcon('maximize');
    const $iconUnmaximize = loadIcon('unmaximize');
    let maximized = null;

    $button.click(() => {
        window.api.send('maximize');
    })

    window.addEventListener('resize', () => {
        maximizeStatus();
    });

    function maximizeStatus() {
        window.api.invoke('maximizeStatus').then((result) => {
            if (maximized === null || maximized !== result) {
                $button.html(result ? $iconUnmaximize : $iconMaximize);
            }
            maximized = result;
        })
    }
    maximizeStatus();

    return $button;
}

export function makeClose() {
    const $button = $('<div>').addClass('header__icon --close').append(loadIcon('close'));

    $button.click(() => {
        window.api.send('close');
    })

    return $button;
}