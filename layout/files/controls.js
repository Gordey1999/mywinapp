"use strict"

import {PointerController} from "../assets/js/pointer.js";
import {makeContextMenu} from "../assets/js/contextMenu.js";
import {Selector} from "./selector.js";
import {updateFilesContents} from "./renderer.js";
import {scrollByMouse} from "../assets/js/tools.js";

// getElementsSelector, getNode, onTrigger

export class Controls {
    _container = null;
    _pointer = null;
    _selector = null;

    _dirViewer = null;
    _filesViewer = null;
    _dirPath = null

    _dragoverDir = null;

    constructor(container, dirViewer, filesViewer, dirPath) {
        this._container = container;
        this._pointer = new PointerController();
        this._selector = new Selector(this._pointer);
        this._dirViewer = dirViewer;
        this._filesViewer = filesViewer;
        this._dirPath = dirPath;

        this._bind();
    }

    rebuild() {
        const items = $(this._itemsSelector()).toArray();
        this._pointer.rebuild(items);
    }

    _bind() {
        document.addEventListener('keydown', this._onKeyboard);
        this._container.addEventListener('mousemove', this._showCursor);
        this._container.addEventListener('click', this._onClick);
        this._container.addEventListener('contextmenu', this._onRightClick);

        this._container.addEventListener('dragstart', this._onDragStart);
        $(this._container).on('dragenter dragleave', this._onDragPrevent);
        $(this._container).on('dragover', this._onDragover);
        $(this._container).on('drop dragdrop', this._onDrop);

        hotkeys('Space, Enter', this._onEnter);
        hotkeys('ctrl+x', this._onCut);
        hotkeys('ctrl+c', this._onCopy);
        hotkeys('ctrl+v', this._onPaste);
        hotkeys('delete', this._onDelete);
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

    _onClick = (e) => {
        const el = e.target.closest(this._itemsSelector());
        if (el === null) { return; }

        this._pointer.pointTo(el);
        this._trigger('select');
        this._selector.move(e);

        if (e.detail === 2) {
            this._trigger('dbClick');
        }
    }

    _onRightClick = (e) => {
        const el = e.target.closest(this._itemsSelector());
        if (el === null) {
            makeContextMenu([this._makePasteContext()], e.x, e.y);
            return;
        }

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

        await this._afterPaste(res);
    }

    _onDelete = async () => {
        const selected = this._selector.getSelected();
        if (selected.length === 0) { return; }

        const res = await window.api.invoke('filesDelete', this._dirPath.getPath(), selected);
        if (res.error) { alert(res.error); return; }

        await updateFilesContents();
    }

    _onDragStart = (e) => {
        e.preventDefault();
        let selected = this._selector.getSelected();
        const item = $(e.target).closest(this._itemsSelector())[0];
        if (!item) { return; }

        if (!selected.includes(item.dataset.name)) {
            this.pointTo(item.dataset.name);
            this._selector.set([item]);
            selected = this._selector.getSelected();
        }

        window.api.send('filesDragStart', this._dirPath.getPath(), selected);
    }

    _onDragPrevent = (e) => {
        e.stopPropagation();
        e.preventDefault();
        this._clearDragoverDir();
    }

    _onDragover = (e) => {
        e.stopPropagation();
        e.preventDefault();

        const dir = e.originalEvent.target.closest(this._dirViewer.getElementsSelector());

        if (dir === null) {
            this._clearDragoverDir();
        } else if (this._dragoverDir !== dir) {
            this._clearDragoverDir();
            dir.classList.add('--dragover');
            this._dragoverDir = dir;
        }

        scrollByMouse(e.originalEvent);
    }

    _clearDragoverDir() {
        this._dragoverDir?.classList.remove('--dragover');
        this._dragoverDir = null;
    }

    _onDrop = async (e) => {
        e.stopPropagation();
        e.preventDefault();

        const fileInput = e.originalEvent.dataTransfer.files;
        const files = [];
        for (let i = 0; i < fileInput.length; i++) {
            files.push(fileInput.item(i).path);
        }
        if (files.length === 0) { return; }

        let toDir = this._dirPath.getPath();
        if (this._dragoverDir) {
            toDir = this._dragoverDir.dataset.src;
        }
        
        const res = await window.api.invoke('filesDrop', toDir, files);
        await this._afterPaste(res);
    }

    async _afterPaste(res) {
        if (res === null) { return; }
        if (res.error) { alert(res.error); return; }

        await updateFilesContents();
        
        if (this._dragoverDir) {
            this.pointTo(this._dragoverDir.dataset.name);
            this._clearDragoverDir();
        } else {
            const select = this._filesViewer.getNodes(res.files);

            for (const name of res.dirs) {
                const dir = this._dirViewer.getNode(name);
                if (dir !== null) { select.push(dir); }
            }

            this._selector.set(select);
            this._pointToLast(select);
        }
    }

    _pointToLast(select) {
        const result = select.map((el) => [el, this._pointer.getElementPos(el)]);
        result.sort((a, b) => b[1] - a[1]);
        this._pointer.pointTo(result[0][0]);
        this._trigger('select');
    }

    _makePasteContext() {
        return {
            name: 'Paste',
            icon: 'paste',
            callback: this._onPaste,
        };
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
                name: 'Cut',
                icon: 'cut',
                callback: this._onCut,
            },
            this._makePasteContext(),
            {
                name: 'Delete',
                icon: 'delete',
                callback: this._onDelete,
            }
        ]);
    }
}