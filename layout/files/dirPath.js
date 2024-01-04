import {loadIcon} from "../js/icons.js";
import {makeContextMenu} from "../js/tools.js";

export class DirPath {
    _$container = null;
    _separator = "\\";
    _editModeActive = false;
    _path = null;

    constructor($container) {
        this._$container = $container;

        this._bind();
    }

    setPath(path) {
        this._path = path;
        this._editMode(false);
        this._make();
    }

    _make() {
        this._$container.html('');

        const parts = this._path.split(this._separator);

        let currentPath = '';

        const maxWidth = this._$container.width();

        this._$container.addClass('--calculate');

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];

            currentPath += part;

            this._$container.append(
                this._makeItem(part, 'dir', currentPath, part),
                this._makeItem(loadIcon('arrow'), 'dirList', currentPath)
            );

            currentPath += this._separator;
        }

        this._$container.find('.dir-path__item').last().addClass('--hidden');

        if (this._$container.width() > maxWidth) {
            const $container = this._$container;
            const $dots = this._makeItem('. . .', 'dots', currentPath, '...');
            const $arrow = this._makeItem(loadIcon('arrow'), 'dirList', currentPath);
            $container.prepend($dots, $arrow);

            const deleted = [];
            this._$container.find('.dir-path__item').each(function (index) {
                if (index < 2) {
                    // do nothing...
                } else if (index % 2 === 1) {
                    $(this).remove();
                } else if ($container.width() > maxWidth) {
                    deleted.push($(this).data('src'));
                    $(this).remove();
                } else {
                    return false;
                }
            })
            $dots.data('src', deleted);
            $arrow.data('src', deleted.at(-1));
        }

        this._$container.removeClass('--calculate');


        const $input = $('<input type="text">').addClass('dir-path__input').val(this._path);
        $input.on('keydown', this._onInputKeyboard.bind(this));
        this._$container.append($input);
    }

    _makeItem(html, type, src) {
        const $item = $('<div>').addClass('dir-path__item').html(html);
        $item
            .data('type', type)
            .data('src', src)

        return $item;
    }

    _bind() {
        const $body = $('body');

        $body.on('click', this._onClickEvent);
        $body.on('contextmenu', this._onClickEvent);
        $(window).resize(this._make.bind(this));
    }

    _onClickEvent = (e) =>  {
        if ($(e.target).closest(this._$container).length === 0) {
            this._editMode(false);
            return;
        }

        const $el = $(e.target).closest('.dir-path__item');
        if ($el.length > 0) {
            this._onElementClick($el);
        } else {
            this._editMode(true);
        }
    }

    _onElementClick($el) {
        const type = $el.data('type');
        const src = $el.data('src');

        switch (type) {
            case 'dir':
                $(window).trigger('selectSection', [src]);
                break;
            case 'dirList':
                this._buildContextChildren(src).then(this._buildContextMenu.bind(this, $el));
                break;
            case 'dots':
                const items = this._buildDotsChildren(src);
                this._buildContextMenu($el, items);
        }
    }

    _onContextClose() {
        this._$container.find('.dir-path__item.--active').removeClass('--active');
    }

    async _buildContextChildren(src) {
        const result = await window.api.invoke('dirPathList', src);

        return result.map(item => {
            return {
                name: item.name,
                callback: this._onContextItemClick.bind(this, item.src),
                children: item?.hasChildren ? this._buildContextChildren.bind(this, item.src) : null,
            }
        });
    }

    _buildDotsChildren(sources) {
        return sources.map(src => {
            return {
                name: src.split(this._separator).pop(),
                callback: this._onContextItemClick.bind(this, src),
                children: this._buildContextChildren.bind(this, src),
            };
        });
    }

    _buildContextMenu($el, items) {
        if (!items.length) { return; }
        $el.addClass('--active');

        const rect = $el.get(0).getBoundingClientRect();
        makeContextMenu(items, rect.left, rect.bottom + 8, 'header', this._onContextClose.bind(this));
    }

    _onContextItemClick(src) {
        $(window).trigger('selectSection', [src]);
    }

    _editMode(activate) {
        if (activate) {
            if (this._editModeActive) { return; }

            this._editModeActive = true;
            this._$container.addClass('--edit-mode');
            this._$container.find('.dir-path__input').val(this._path).focus().select();
        } else {
            if (!this._editModeActive) { return; }

            this._editModeActive = false;
            this._$container.removeClass('--edit-mode');
        }
    }

    _onInputKeyboard(e) {
        if (e.key !== 'Enter') { return; }

        $(window).trigger('selectSection', [e.currentTarget.value]);
    }
}