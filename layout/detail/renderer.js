window.api.receive('detailInitResult', (files, selectedId) => {

    const container = document.querySelector('.container')
    container.innerHTML = '';

    let index = null;
    for (const i in files) {
        if (files[i].id === selectedId)
            index = i;
    }


    const item = document.createElement('div')
    item.classList.add('item')

    const img = document.createElement('img')
    img.src = files[index].src;
    //img.loading = 'lazy';
    item.append(img);

    container.append(item);

    document.addEventListener('keydown', (e) => {
        e.preventDefault();
        if (e.code === 'KeyD' || e.code === 'ArrowRight') {
            if (index < files.length - 1)
                index++;
            img.src = files[index].src;
        } else if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
            if (index > 0)
                index--;
            img.src = files[index].src;
        } else if (e.code === 'Escape' || e.code === 'Enter') {
            window.api.send('closeDetail', files[index].id);
        }
    });
})
window.api.send('detailInit');