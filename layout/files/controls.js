"use strict"

import {PointerController} from "../assets/js/pointer.js";
import {makeContextMenu} from "../assets/js/contextMenu.js";

// getElementsSelector, getNode, onTrigger

export class Controls {
    _pointer = null;
    _dirViewer = null;
    _filesViewer = null;
    _dirPath = null

    constructor(dirViewer, filesViewer, dirPath) {
        this._pointer = new PointerController();
        this._dirViewer = dirViewer;
        this._filesViewer = filesViewer;
        this._dirPath = dirPath;

        document.addEventListener('keydown', this._onKeyboard);
        document.addEventListener('mousemove', this._showCursor);

        hotkeys('Space, Enter', this._onEnter);
    }

    rebuild() {
        const items = $(this._itemsSelector()).toArray();

        const oldItems = this._pointer.getItems();
        const newItems = items.filter(item => !oldItems.includes(item));
        for (const item of newItems) {
            item.addEventListener('click', this._onItemClick);
            item.addEventListener('contextmenu', this._onItemRightClick);
        }

        this._pointer.rebuild(items);
    }

    _itemsSelector() {
        return this._dirViewer.getElementsSelector() + ', ' + this._filesViewer.getElementsSelector();
    }

    _onKeyboard = (e) => {
        if (e.target.tagName === 'INPUT') { return; }

        let triggered = true;

        if (e.code === 'KeyD' || e.code === 'ArrowRight') {
            this._move('right');
        } else if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
            this._move('left');
        } else if (e.code === 'KeyW' || e.code === 'ArrowUp') {
            this._move('up');
        } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
            this._move('down');
        } else if (e.code === 'Home') {
            this._move('home');
        } else if (e.code === 'End') {
            this._move('end');
        } else {
            triggered = false;
        }

        if (triggered) {
            e.preventDefault();
        }
    }

    _move(direction, e) {
        this._hideCursor();
        this._pointer.move(direction);
        this._trigger('select');
    }

    _onEnter = (e) => {
        e.preventDefault();
        this._trigger('enter');
    }

    _onItemClick = (e) => {
        const el = e.currentTarget;
        this._pointer.pointTo(el);
        this._trigger('select');

        if (e.detail === 2) {
            this._trigger('dbClick');
        }
    }

    _onItemRightClick = (e) => {
        const el = e.currentTarget;
        this._pointer.pointTo(el);
        this._trigger('select');

        if (el.dataset.name === '..') { return null; }

        makeContextMenu(this._makeContext(el), e.x, e.y);
    }

    _trigger(key) {
        const el = this._pointer.getPointer();
        if (el === null) { return; }

        if (this._isFile(el)) {
            this._filesViewer.onControl(key, el);
        } else {
            this._dirViewer.onControl(key, el);
        }
    }

    _isFile(el) {
        return $(el).filter(this._filesViewer.getElementsSelector()).length > 0;
    }

    _hideCursor() {
        document.body.classList.add('--hide-cursor');
    }
    _showCursor = () => {
        document.body.classList.remove('--hide-cursor');
    }

    pointTo(name) {
        const el = this._dirViewer.getNode(name) ?? this._filesViewer.getNode(name);
        if (el !== null) {
            this._pointer.pointTo(el);
            this._trigger('select');
        }
    }

    getPointer() {
        const node = this._pointer.getPointer();

        return node.dataset.name;
    }

    _makeContext(el) {
        const src = this._dirPath.getFullPath(el.dataset.name);

        let menu = [
            {
                name: 'Open in Explorer',
                icon: 'explorer',
                callback: () => {
                    window.api.send('openInExplorer', src);
                },
            },
        ];

        if (this._isFile(el)) {
            menu = menu.concat(this._filesViewer.makeContextOptions(el));
        } else {
            menu = menu.concat(this._dirViewer.makeContextOptions(el));
        }

        return menu.concat([
            { type: 'separator' },
            {
                name: 'Copy',
                icon: 'copy',
            },
            {
                name: 'Paste',
                icon: 'paste',
            },
            {
                name: 'Delete',
                icon: 'delete',
            }
        ]);
    }
}