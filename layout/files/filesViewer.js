import {createNode} from "../assets/js/tools.js";
import {setTitle} from "../assets/js/window.js";

let itemsInRow = 9;

$('.files-container').on('adaptiveGridChanged', (e, adaptiveGridChanged) => {
    itemsInRow = adaptiveGridChanged;
});

export class FileItem {
    #controller = null;
    #file = null;
    #el = null;
    #img = null;

    constructor(controller, container, file) {
        this.#controller = controller;
        this.#file = file;
        this.#make(container);
    }

    destroy() {}

    #make(container) {
        this.#el = container;
        this.createImage();
    }

    createImage() {
        if (this.#file.type === 'video') {
            this.#img = createNode('video', 'files__item-img', this.#el);
            this.#img.src = this.#file.src;
        } else {
            this.#img = createNode('img', 'files__item-img', this.#el);

            if (this.#file.preview !== null) {
                this.#img.src = this.#file.preview;
            } else {
                this.#img.src = '../assets/img/image_back.png';
            }

            this.#img.loading = 'lazy';
            this.#img.draggable = false;
        }
    }

    setPreview(path) {
        this.#file.preview = path;
        if (this.#img)
            this.#img.src = path;
    }
    getElement() {
        return this.#el;
    }
    getFile() {
        return this.#file;
    }
}

export class FilesController {

    #el = null;
    #items = null;

    constructor(container) {
        this.#el = container;

        this.#items = [];
    }

    setFiles(files) {
        for (const item of this.#items) {
            item.destroy();
        }

        this.#el.innerHTML = '';
        this.#items = [];

        const $block = $(this.getContainer());
        files.forEach(file => {
            const container = this._createElement(file);
            $block.append(container);
            this.#items.push(new FileItem(this, container[0], file));
        })
    }

    updateFiles(files) {
        const ids = files.map(file => file.id);

        // remove deleted files

        this.#items = this.#items.filter(item => {
            if (ids.includes(item.getFile().id)) {
                return true;
            }
            item.destroy();
            item.getElement().remove();
            return false;
        })

        // add new and check other

        let index = 0;
        let item = this.#items[index];
        const updatedItems = [];

        for (const file of files) {
            const oldFile = item?.getFile();

            if (file.id === oldFile?.id) {
                if (oldFile.mtime !== file.mtime) {
                    oldFile.preview = null;
                    oldFile.mtime = file.mtime;
                }
                updatedItems.push(item);
                index++;
                item = this.#items[index];
            } else {
                const container = this._createElement(file);
                if (item) {
                    container.insertBefore(item.getElement());
                } else {
                    $(this.getContainer()).append(container);
                }
                updatedItems.push(new FileItem(this, container[0], file));
            }
        }

        this.#items = updatedItems;
    }

    _createElement(file) {
        const container = $('<div class="files__item" draggable="true">');
        container[0].dataset.name = file.name;
        return container;
    }

    setSort(sort) {
        this._sort = sort;
    }

    getSort() {
        return this._sort;
    }

    getItems() {
        return this.#items;
    }

    getElementsSelector() {
        return '.files__item';
    }

    onControl(event, el) {
        if (event === 'enter' || event === 'dbClick') {
            this.openDetail(el.dataset.name);
        } else if (event === 'select') {
            setTitle(el.dataset.name);
        }
    }

    openDetail(id) {
        window.api.send('openDetail', id);
    }

    getNode(name) {
        return this.getByName(name)?.getElement() ?? null;
    }

    getNodes(names) {
        return this.#items
            .filter((item) => names.includes(item.getFile().name))
            .map((item) => item.getElement());
    }

    getByName(name) {
        return this.#items.find((item) => item.getFile().name === name) ?? null;
    }

    getContainer() {
        return this.#el;
    }

    makeContextOptions(el) {
        const selected = this.getByName(el.dataset.name);

        const innerList = {
            name: 'Woooow',
        };
        let current = innerList;

        const selectedFile = selected.getFile();

        for (let i = 1; i < 40; i++) {
            current.children = [];
            current.children.push(
                { name: 'el ' + i * 100 },
                { name: 'elem ' + i * 100 + 1 },
                { name: 'eleme ' + i * 100 + 2 },
                { name: 'element ' + i * 100 + 3 }
            );
            current = current.children[1];
        }
        current.children = [{
            name: 'well done!',
            callback: () => {
                window.api.send('openFrameMode', 'well-done.png');
            }
        }];

        let edit = {
            name: 'Edit',
            callback: () => {
                window.api.send('openInPaint', selectedFile.src);
            }
        }
        if (selectedFile.type === 'video') {
            edit = {
                name: 'Open with VLC',
                callback: () => {
                    window.api.send('openInVlc', selectedFile.src);
                }
            }
        }

        return [
            edit,
            innerList,
            {
                name: 'Sort...',
                children: this._makeSortContext()
            },
            { type: 'separator' },
            {
                name: 'Frame Mode',
                callback: () => {
                    window.api.send('openFrameMode', selectedFile.src);
                },
                disabled: selectedFile.type === 'video',
            },
            {
                type: 'group',
                children: [
                    {
                        name: 'Make Puzzle',
                        icon: 'puzzle',
                        grow: true,
                        callback: () => {
                            window.api.send('openFramePuzzle', selectedFile.src);
                        },
                        disabled: selectedFile.type === 'video',
                    },
                    {
                        icon: 'settings',
                        callback: () => {
                            window.api.send('openFramePuzzleSettings', selectedFile.src);
                        },
                        disabled: selectedFile.type === 'video',
                    }
                ]
            },
        ];
    }

    _makeSortContext() {
        const sortList = {
            nameAsc: 'Name Asc',
            nameDesc: 'Name Desc',
            dateAsc: 'Date Asc',
            dateDesc: 'Date Desc',
        }

        const result = [];

        for (const [key, name] of Object.entries(sortList) ) {
            const item = {
                name: name,
                callback: () => {
                    $(window).trigger('changeSort', [key]);
                }
            };

            if (this._sort === key) {
                item.icon = 'point';
            }

            result.push(item);
        }

        return result;
    }
}