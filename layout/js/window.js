import {createNode, createScrollbar} from "./tools.js";
import {loadIcon} from "./icons.js";


class Menu {
    #$menuBtn = null;
    #$header = null;
    #$container = null;
    #items = [];

    constructor($container, $header) {
        this.#$container = $container;
        this.#$header = $header;

        this.#$menuBtn = $('<div>').addClass('header__menu-small').append(loadIcon('menu'));
        this.#$container.append(this.#$menuBtn);

        this.#bind();
        this.#onResize();
    }

    addMenuItem(name, callback) {
        const $item = $('<div>').addClass('header__menu-button').html(name);

        $item.click(callback);

        this.#$container.append($item);

        this.#items.push({
            $el: $item,
            name: name,
            callback: callback
        });
    }

    #bind() {
        window.addEventListener('resize', this.#onResize.bind(this));
    }

    #onResize() {
        this.#$container.css('position', 'absolute');
        this.#$menuBtn.hide();
        let hided = 0;
        const widthReserved = 300;

        this.#items.forEach((item) => {
            item.$el.show();
        })

        const itemsReversed = this.#items.slice().reverse();
        for (const item of itemsReversed) {
            if (this.#$container.width() + widthReserved < this.#$header.width()) {
                break;
            }
            hided++;
            item.$el.hide();
        }

        this.#$container.css('position', 'relative');
        if (hided > 0) {
            this.#$menuBtn.show();
        }
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
	}
}

if ($header.length && $window.length && $content.length) {
    initWindow();
}

export function addMenuOption(name, callback) {
    menu.addMenuItem(name, callback);
}

function makeBar() {
    const $logo = makeLogo();

	let $title;
	if ($header.hasClass('--show-menu')) {
		$title = $('<div>').addClass('header__menu');
		menu = new Menu($title, $header);
	} else {
		$title = $('<div>').addClass('header__title').html($('title').html());
	}

    const $dragArea = $('<div>').addClass('header__drag_area');

    const $minimize = makeMinimize();
    const $close = makeClose();
    const $maximize = makeMaximize();

    $header.append($logo, $title, $dragArea, $minimize, $maximize, $close);
}

function makeBarSettings() {
	const $logo = makeLogo();

	const $title = $('<div>').addClass('header__title').html($('title').html());

	const $dragArea = $('<div>').addClass('header__drag_area');

	const $close = makeClose();

	$header.append($logo, $title, $dragArea, $close);
}

function makeLogo() {
	return $('<div>').addClass('header__logo').append($('<img src="../icons/logo2_64.png" alt="logo" />'));
}

export function makeMinimize() {
    const $button = $('<div>').addClass('header__icon').append(loadIcon('minimize'));

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
    const $button = $('<div>').addClass('header__icon').append(loadIcon('close'));

    $button.click(() => {
        window.api.send('close');
    })

    return $button;
}