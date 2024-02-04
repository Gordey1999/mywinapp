"use strict";

import {makeClose, makeMinimize} from "../assets/js/window.js";

$('.head-buttons')
    .append(makeMinimize())
    .append(makeClose());

const $container = $('.container');

window.api.invoke('framePuzzleInit').then((result) => {
    const $img = $('<img>').attr('src', result.src);

    $container.append($img);

    $img.one('load', () => {
        // const imageWidth = $img[0].naturalWidth;
        // const imageHeight = $img[0].naturalHeight;
        // const winWidth = $container.width();
        // const winHeight = $container.height();
        //
        // const w = winWidth * result.size;
        // const h = winHeight * result.size

        $img
            .css('width', result.imageWidth)
            .css('height', result.imageHeight)
            .css('left', - result.xOffset)
            .css('top', - result.yOffset)
    })
});

api.receive('framePuzzleSolved', (mute) => {
    $container.find('img').hide();
    const $video = $container.find('.solved-video');
    $video.show();
    if (mute) {
        $video.prop('muted', true);
    }
    $video.get(0).play();
})