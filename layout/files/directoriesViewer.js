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

    setPointer(name) {
        const $el = this._getByName(name);
        if ($el.length === 0) { return false; }

        window.keyboardController.pointTo($el.get(0));
        return true;
    }

    setPreview(name, src) {
        const $img = this._getByName(name).find('img');
        if ($img.length === 0) { return false; }

        $img.attr('src', src);
    }

    _getByName(name) {
        return this._$el.find(`.directories__item[data-name="${name}"]`);
    }

    getPointer() {
        const $el = this._$el.find(`.directories__item.--pointer`);
        if ($el.length === 0) { return null; }

        return $el.data('name');
    }

    _make() {
        this._$el.append(this._makeHead(this._currentDir));

        for (const dir of this._dirList) {
            const $block = $('<div>').addClass('directories__item').css('order', 10);


            if (dir.preview) {
                $block.append(this._makeImages(dir));
            }

            $block.append(this._makeInfo(dir));

            $block.attr('data-src', dir.src);
            $block.attr('data-name', dir.name);

            this._$el.append($block);
        }

        window.keyboardController.addBlock(this);
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

        if (dir.dirsCount > 0) {
            $other.append(this._makeOtherItem('explorer', dir.dirsCount));
        }
        if (dir.filesCount > 0) {
            $other.append(this._makeOtherItem('file', dir.filesCount));
        }

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

    _makeImages() {
        const $imagesBlock = $('<div>').addClass('directories__item-images');

        const $image = $('<img>').attr('src', '../assets/img/image_back.png');
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

    onKeyboardEvent(event, i, el) {
        if (event === 'enter' || event === 'dbClick') {
            this._selectItem(el);
        }
    }
}