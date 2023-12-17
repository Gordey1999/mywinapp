import {createNode, createScrollbar} from "../js/tools.js";


window.api.receive('mangaDetailInitResult', (files) => {

    const container = document.querySelector('.container');

    files.forEach ((file) => {
        if (file.type === 'mp4') {
            return;
        }

        const item = createNode('div' , 'item', container);
        const img = createNode('img', null, item);
        img.src = file.src;
    });
})
window.api.send('mangaDetailInit');



document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
        e.preventDefault();
        window.api.send('mangaDetailClose');
    }
});

createScrollbar(document.querySelector('.container'));

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
