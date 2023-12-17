"use strict";

import {makeClose, makeMinimize} from "../js/window.js";

$('.head-buttons')
    .append(makeMinimize())
    .append(makeClose());

const $container = $('.container');

window.api.invoke('framePuzzleInit').then((result) => {
    const $img = $('<img>').attr('src', result.src);

    $container.append($img);

    $img.one('load', () => {
        const imageWidth = $img[0].naturalWidth;
        const imageHeight = $img[0].naturalHeight;
        const winWidth = $container.width();
        const winHeight = $container.height();

        $img
            .css('width', winWidth * result.size)
            .css('height', winHeight * result.size)
            .css('left', - result.x * winWidth)
            .css('top', - result.y * winHeight)
    })
});

api.receive('framePuzzleSolved', () => {
    $container.find('img').hide();
    const $video = $container.find('.solved-video');
    $video.show();
    $video.get(0).play();
})