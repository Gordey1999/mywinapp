
export class DirTree {
    _$container = null;
    _dirList = null;
    _child = null;
    _$el = null;

    constructor($container, dirList = []) {
        this._$container = $container;
        this._dirList = dirList;
        this._child = null;

        this._make();
    }

    _make() {
        this._$el = $('<div>').addClass('section');
        this._$container.append(this._$el);

        for (const dir of this._dirList) {
            const $inner = $('<div>').addClass('section__item-inner');
            const $block = $('<div>').addClass('section__item').append($inner);

            $inner
                .text(this._cutName(dir.name))
                .attr('data-src', dir.src)
                .attr('data-name', dir.name);

            this._$el.append($block);
        }

        if (this._dirList.length) {
            window.keyboardController.addBlock(this, this._$el.find('.section__item-inner').toArray());
        }
    }

    _cutName(name) {
        if (name.length > 20) {
            return name.substring(0, 17) + '...';
        }
        return name;
    }

    _selectItem(item) {
        this._$el.find('.section__item-inner').removeClass('active');

        this._destroyChild();

        $(item).addClass('active');

        $(window).trigger('selectSection', [this, item.dataset.src]);
    }

    _getItemByName(name) {
        return this._$el.find(`.section__item-inner[data-name=${name}]`);
    }

    onSetPointer() {
        // do nothing
    }


    destroy() {
        this._destroyChild();
        window.keyboardController.removeBlock(this);
        this._$el.remove();
    }

    _destroyChild() {
        if (this._child !== null) {
            this._child.destroy();
        }
    }


    onKeyboardEvent(event, i, el) {
        if (event === 'enter' || event === 'click') {
            this._selectItem(el);
        }
    }

    setChildDirs(dirs) {
        if (dirs.length)
            this._child = new DirTree(this._$container, dirs);
    }

    makeTree(tree) {
        let { dirs, selected } = tree.shift();
        this._dirList = dirs;
        this.destroy();
        this._make();

        const $selectedEl = this._getItemByName(selected);

        if (tree.length) {
            $selectedEl?.addClass('active');

            this._child = new DirTree(this._$container);
            this._child.makeTree(tree);
        } else {
            this._selectItem($selectedEl.get(0));
        }
    }
}