import {createNode} from "../js/tools.js";

window.api.receive('detailInitResult', (files, selectedId) => {

    let index = null;
    for (const i in files) {
        if (files[i].id === selectedId)
            index = i;
    }

    let video = null;
    const item = document.querySelector('.item');
    const menu = document.querySelector('.menu');

    const img = document.createElement('img');

    showFile(files[index]);

    item.append(img);

    document.addEventListener('keydown', (e) => {
        if (e.code === 'KeyD' || e.code === 'ArrowRight') {
            e.preventDefault();
            if (index < files.length - 1)
                index++;
            showFile(files[index]);
        } else if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
            e.preventDefault();
            if (index > 0)
                index--;
            showFile(files[index]);
        } else if (e.code === 'Escape' || e.code === 'Enter') {
            e.preventDefault();
            window.api.send('closeDetail', files[index].id);
        }
    });


    function showFile(file) {
        if (file.type === 'mp4') {
            if (video !== null) {
                video.remove();
            }
            video = createNode('video', null, item);
            const source = createNode('source', null, video);
            source.src = file.src;
            video.autoplay = true;
            video.loop = true;

            img.style.display = 'none';

            video.onloadeddata = () => {
                fillMenuData(file.name, video.videoWidth, video.videoHeight);
            };
        } else {
            if (video !== null) {
                video.remove();
                img.style.display = 'block';
                video = null;
            }
            img.src = file.src;

            img.onload = () => {
                fillMenuData(img.naturalWidth, img.naturalHeight);
            };
        }
    }

    function fillMenuData(width, height) {
        menu.querySelector('.js-menu-number').textContent = index + ' / ' + files.length;
        menu.querySelector('.js-menu-name').textContent = files[index].name;
        menu.querySelector('.js-menu-size').textContent = width + ' x ' + height;
    }

    menu.querySelector('.js-menu-explorer').addEventListener('click', () => {
        window.api.send('detailOpenInExplorer', files[index]);
    });
})
window.api.send('detailInit');


// hide cursor
(function() {
    const container = document.querySelector('.container');
    let timer = null;

    document.addEventListener('mousemove', () => {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        } else {
            container.classList.remove('hideCursor');
        }

        timer = setTimeout(() => {
            container.classList.add('hideCursor');
            timer = null;
        }, 1000);
    });

})();
