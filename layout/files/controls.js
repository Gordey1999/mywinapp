"use strict"

import {PointerController} from "../assets/js/pointer.js";
import {makeContextMenu} from "../assets/js/contextMenu.js";
import {Selector} from "./selector.js";
import {updateFilesContents} from "./renderer.js";

// getElementsSelector, getNode, onTrigger

export class Controls {
    _pointer = null;
    _dirViewer = null;
    _filesViewer = null;
    _dirPath = null
    _selector = null;

    constructor(dirViewer, filesViewer, dirPath) {
        this._pointer = new PointerController();
        this._selector = new Selector(this._pointer);
        this._dirViewer = dirViewer;
        this._filesViewer = filesViewer;
        this._dirPath = dirPath;

        document.addEventListener('keydown', this._onKeyboard);
        document.addEventListener('mousemove', this._showCursor);

        hotkeys('Space, Enter', this._onEnter);
        hotkeys('ctrl+x', this._onCut);
        hotkeys('ctrl+c', this._onCopy);
        hotkeys('ctrl+v', this._onPaste);
        hotkeys('delete', this._onDelete);
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
            this._move('right', e);
        } else if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
            this._move('left', e);
        } else if (e.code === 'KeyW' || e.code === 'ArrowUp') {
            this._move('up', e);
        } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
            this._move('down', e);
        } else if (e.code === 'Home') {
            this._move('home', e);
        } else if (e.code === 'End') {
            this._move('end', e);
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
        this._selector.move(e);
    }

    _onEnter = (e) => {
        e.preventDefault();
        this._trigger('enter');
    }

    _onItemClick = (e) => {
        const el = e.currentTarget;
        this._pointer.pointTo(el);
        this._trigger('select');
        this._selector.move(e);

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
            this._selector.move();
        }
    }

    getPointer() {
        const node = this._pointer.getPointer();

        return node.dataset.name;
    }

    _onCut = () => {
        const selected = this._selector.getSelected();
        if (selected.length === 0) { return; }

        window.api.send('filesCut', this._dirPath.getPath(), selected);
    }

    _onCopy = () => {
        const selected = this._selector.getSelected();
        if (selected.length === 0) { return; }

        window.api.send('filesCopy', this._dirPath.getPath(), selected);
    }

    _onPaste = async () => {
        const res = await window.api.invoke('filesPaste', this._dirPath.getPath());

        if (res === null) { return; }
        if (res.error) { alert(res.error); return; }

        await updateFilesContents();

        const select = this._filesViewer.getNodes(res.files);

        for (const name of res.dirs) {
            const dir = this._dirViewer.getNode(name);
            if (dir !== null) { select.push(dir); }
        }

        this._selector.set(select);
        this._pointToLast(select);
    }

    _onDelete = async () => {
        const selected = this._selector.getSelected();
        if (selected.length === 0) { return; }

        const res = await window.api.invoke('filesDelete', this._dirPath.getPath(), selected);
        if (res.error) { alert(res.error); return; }

        await updateFilesContents();
    }

    _pointToLast(select) {
        const result = select.map((el) => [el, this._pointer.getElementPos(el)]);
        result.sort((a, b) => b[1] - a[1]);
        this._pointer.pointTo(result[0][0]);
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
                callback: this._onCopy,
            },
            {
                name: 'Paste',
                icon: 'paste',
                callback: this._onPaste,
            },
            {
                name: 'Delete',
                icon: 'delete',
                callback: this._onDelete,
            }
        ]);
    }
}