"use strict";

import {makeClose, makeMinimize} from "../assets/js/window.js";

$('.head-buttons')
    .append(makeMinimize())
    .append(makeClose());

window.api.invoke('frameModeInit').then((imageSrc) => {
    const $container = $('.container');

    const $img = $('<img>').attr('src', imageSrc);

    $container.append($img);

    $img.one('load', () => {
        // remove
    })
});