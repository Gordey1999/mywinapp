import {createNode} from "../assets/js/tools.js";
import "../assets/js/window.js";

(function() {
    const progressEl = document.querySelector('.progress');
    const progressBarEl = progressEl.querySelector('.bar');

    const container = document.querySelector('.container');
    //const currentContainer = document.querySelector('.container .current');

    let result = null;
    let count = null;

    window.api.receive('searchCopiesInitResult', (cnt) => {
        showProgress();
        count = cnt;

        window.api.send('searchCopiesStep');
    });

    window.api.receive('searchCopiesStepResult', (res) => {
        if (typeof res === 'object') {
            hideProgress();
            result = res;

            const active = container.querySelector('.dir-block.active');

            makeDirs(res);

            if (active) {
                const a = active.querySelector('.dir-block__head a');
                expandDir(a.dataset.src);
            }
            return;
        }
        setProgress(res / count * 100);
        window.api.send('searchCopiesStep');
    });

    window.api.send('searchCopiesInit');


    function makeDirs() {
        container.innerHTML = '';

        const dirs = Object.keys(result);
        smartSort(dirs)
        for (const dir of dirs) {
            const block = createNode('div', 'dir-block', container);
            block.dataset.src = dir;

            const head = makeDirLink(dir, result[dir].count, block);
            head.classList.add('dir-block__head');
            createNode('div', 'dir-block__body', container);
        }

        container.querySelectorAll('.dir-block a');
    }

    function makeDirLink(dir, count, container) {
        const head = createNode('span', null, container);
        const a = createNode('a', null, head);
        a.href = '#';
        a.dataset.src = dir;
        a.textContent = dir;
        a.addEventListener('click', onDirLinkClick);
        head.append(' (' + count + ')');
        return head;
    }

    function onDirLinkClick(e) {
        e.preventDefault();
        const src = this.dataset.src;
        if (!src) return;

        closeActive();
        expandDir(src, true);

        // if (this.parentElement.classList.contains('dir-block__copy-dir'))
        //     scrollToElement(this.parentElement);
    }

    function closeActive() {
        const block = container.querySelector('.dir-block.active')
        if (block) {
            block.classList.remove('active');
            block.querySelector('.dir-block__body').remove();
        }
    }

    function expandDir(src) {
        const srcData = src.replaceAll('\\', '\\\\');
        const block = container.querySelector(`.dir-block[data-src="${srcData}"]`);
        const body = createNode('div', 'dir-block__body', block);
        block.classList.add('active');

        const copyDirs = Object.keys(result[src].copies);
        smartSort(copyDirs);

        for (const dir of copyDirs) {
            const copies = result[src].copies;
            const files = Object.keys(copies[dir]);
            smartSort(files);

            const link = makeDirLink(dir, files.length, body);
            link.classList.add('dir-block__copy-dir');

            const filesContainer = createNode('div', 'dir-block__items', body);

            for (const name of files) {
                const data = copies[dir][name];

                let img;
                if (data.type === 'video') {
                    img = createNode('video', 'dir-block__item', filesContainer);
                    img.src = data.src;
                } else {
                    img = createNode('img', 'dir-block__item', filesContainer);
                    img.src = data.preview;
                }
                img.dataset.src = data.src;
                img.alt = name;
                img.addEventListener('click', onItemClick);
            }
        }
        return block;
    }


    function showCopy(hash, file) {
        let block = container.querySelector('#hash' + hash);
        if (block === null) {
            block = createNode('div', 'item', container);
            createNode('div', 'links', block);
            createNode('div', 'images', block);
            block.id = 'hash' + hash;
        }


        const links = block.querySelector('.links');
        const images = block.querySelector('.images');

        const link = createNode('a', 'link', links);
        link.href = '#';
        link.textContent = file;
        link.dataset.path = file;
        link.addEventListener('click', onLinkClick);

        const image = createNode('img', 'image', images);
        image.src = file;
    }


    function onItemClick(e) {
        e.preventDefault();
        window.api.send('searchCopiesOpenFile', this.dataset.src);
    }


    function smartSort(arr) {
        const collator = new Intl.Collator(['en', 'ru'], {numeric: true, sensitivity: 'base'});
        arr.sort(collator.compare);
    }



    function showProgress() {
        progressEl.classList.add('active');
    }
    function setProgress(percent) {
        progressBarEl.style.width = percent + '%';
    }
    function hideProgress() {
        progressEl.classList.remove('active');
    }
})();


