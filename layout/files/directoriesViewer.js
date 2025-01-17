import {loadIcon} from "../assets/js/icons.js";
import {calculateAdaptiveGrid} from "../assets/js/tools.js";

const separator = '\\';

export class DirectoriesViewer {
    _$el = null;
    _dirList = null;
    _currentDir = null;

    constructor($container) {
        this._$el = $container;
    }

    setDirectories(dirs, currentDir) {
        this._dirList = dirs;
        this._currentDir = currentDir;
        this.destroy();
        this._make();

        calculateAdaptiveGrid(this._$el);
    }

    getActualTime() {
        return this._currentDir.mtime;
    }

    setInfo(name, info) {
        const $block = this._getByName(name);
        if ($block.length === 0) { return false; }

        const $other = $block.find('.directories__item-other');

        if (info.preview) {
            $block.prepend(this._makeImage(info.preview));
        }

        if (info.dirsCount > 0) {
            $other.append(this._makeOtherItem('explorer', info.dirsCount));
        }
        if (info.filesCount > 0) {
            $other.append(this._makeOtherItem('file', info.filesCount));
        }
    }

    getNode(name) {
        return this._getByName(name)[0] ?? null;
    }

    _getByName(name) {
        return this._$el.find(`.directories__item[data-name="${name}"]`);
    }

    _make() {
        this._$el.append(this._makeHead(this._currentDir));

        for (const dir of this._dirList) {
            const $block = $('<div class="directories__item" draggable="true">').css('order', 10);

            $block.append(this._makeInfo(dir));

            $block.attr('data-src', dir.src);
            $block.attr('data-name', dir.name);

            this._$el.append($block);
        }
    }

    _makeHead(dir) {
        const $head = $('<div>').addClass('directories__head');
        $head.append(this._makeBackItem(dir));
        $head.append(this._makeHomeItem(dir));

        return $head;
    }

    _makeBackItem(dir) {
        const $name = $('<div>').addClass('directories__item-name')
            .append(loadIcon('arrow'))
            .append($('<span>').text(dir.parentSrc.split(separator).pop()));
        const $info = $('<div>').addClass('directories__item-info').append($name);
        const $block = $('<div>').addClass('directories__item --back').append($info);
        $block.attr('data-src', dir.parentSrc);
        $block.attr('data-name', '..');

        return $block;
    }

    _makeHomeItem(dir) {
        const $block = $('<div>').addClass('directories__item --home');
        $block.append(this._makeInfo(dir));

        return $block;
    }

    _makeInfo(dir) {
        const $info = $('<div>').addClass('directories__item-info');

        const $name = $('<div>').addClass('directories__item-name').text(dir.name);
        const $other = $('<div>').addClass('directories__item-other');

        $info.append($name, $other);

        return $info;
    }

    _makeOtherItem(iconName, value) {
        const $el = $('<div>').addClass('directories__item-other-item');
        const $icon = $('<svg>').html(loadIcon(iconName));
        const $value = $('<span>').text(value);
        $el.append($icon, $value);

        return $el;
    }

    _makeImage(src) {
        const $imagesBlock = $('<div>').addClass('directories__item-images');

        const $image = $('<img>').attr('src', src);
        $imagesBlock.append($image);

        return $imagesBlock;
    }

    _selectItem(item) {
        $(window).trigger('selectSection', [item.dataset.src]);
    }

    destroy() {
        this._$el.html('');
    }

    getElementsSelector() {
        return '.directories__item:not(.--home)';
    }

    onControl(event, el) {
        if (event === 'enter' || event === 'dbClick') {
            this._selectItem(el);
        }
    }

    makeContextOptions(el) {
        const src = $(el).attr('data-src');
        return [
            {
                name: 'Open in New Window',
                callback: () => {
                    window.api.send('openNewWindow', src);
                },
            },
            {
                type: 'separator'
            },
            {
                name: 'Manga Mode',
                callback: () => {
                    window.api.send('openMangaMode', src);
                },
            }
        ];
    }
}