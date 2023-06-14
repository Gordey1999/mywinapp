window.api.enableZoom();

window.api.receive("fromMain", (files) => {
    const container = document.querySelector('.files-container')

    if (files.length > 400)
        files = files.slice(0, 400);

    files.forEach(file => {
        const item = document.createElement('div')
        item.classList.add('files__item')
        item.dataset.path = file.path;
        const img = document.createElement('img')
        img.src = file.path
        item.append(img);
        container.append(item)
    })
});
window.api.send("toMain", "some data");

class FilesContainer {
    constructor() {

    }
}

class FileItem {
    constructor() {

    }
}