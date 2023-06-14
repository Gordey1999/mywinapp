window.api.enableZoom();

window.api.receive("dirListResult", (files) => {
    const container = document.querySelector('.files-container')
    container.innerHTML = '';

    if (files.length > 400)
        files = files.slice(0, 400);

    files.forEach(file => {
        const item = document.createElement('div')
        item.classList.add('files__item')
        item.dataset.path = file.path;

        if (!file.isDir || file.cover) {
            const img = document.createElement('img')
            img.src = file.isDir ? file.cover : file.path
            item.append(img);
        }

        if (file.isDir)
        {
            item.classList.add('directory')
            const title = document.createElement('div')
            title.classList.add('files__item-title')
            title.innerText = file.name
            item.append(title)

            item.addEventListener('dblclick', openDir)
            item.addEventListener('click', onDirClick)
        }

        container.append(item)
    })
});
window.api.send("dirList", null);


function openDir(e) {
    window.api.send("dirList", e.currentTarget.dataset.path)
}

function onDirClick(e) {
    if (e.which !== 2) return

    window.api.send('showDetail', e.currentTarget.dataset.path)
}

class FilesContainer {
    constructor() {

    }
}

class FileItem {
    constructor() {

    }
}