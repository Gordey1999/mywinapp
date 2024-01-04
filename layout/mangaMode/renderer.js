"use strict";

import {adaptiveGrid, createNode} from "../assets/js/tools.js";
import "../assets/js/window.js";

window.api.receive('mangaModeInitResult', (mangaList) => {

    const container = document.querySelector('.manga-container');

    adaptiveGrid($(container), 200, 4);

    mangaList.forEach((manga) => {
        const item = createNode('div', 'manga__item', container);
        item.dataset.src = manga.src;
        const image = createNode('img', 'manga__item-img', item);
        image.src = manga.preview;

        image.addEventListener('click', (e) => {
            if (e.detail === 2) {
                window.api.send('openMangaDetail', manga.files);
            }
        })
    })
});

window.api.send('mangaModeInit');

document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
        e.preventDefault();
        window.api.send('mangaModeClose');
    }
});