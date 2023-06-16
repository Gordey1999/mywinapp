import {createNode} from "../js/tools.js";

window.api.receive('detailInitResult', (files, selectedId) => {

    const container = document.querySelector('.container')
    container.innerHTML = '';

    let index = null;
    for (const i in files) {
        if (files[i].id === selectedId)
            index = i;
    }

    let video = null;
    const item = document.createElement('div')
    item.classList.add('item')

    const img = document.createElement('img')

    showFile(files[index]);
    //img.loading = 'lazy';
    item.append(img);

    container.append(item);

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
            //video.controls = true;
            //video.controlsList = 'nofullscreen';

            img.style.display = 'none';
        } else {
            if (video !== null) {
                video.remove();
                img.style.display = 'block';
                video = null;
            }
            img.src = file.src;
        }
    }
})
window.api.send('detailInit');