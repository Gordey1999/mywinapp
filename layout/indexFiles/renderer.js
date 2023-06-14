
window.api.receive('imagesListResult', (images) => {

    const container = document.querySelector('.images-container')
    container.innerHTML = '';

    images.forEach(image => {
        const item = document.createElement('div')
        item.classList.add('images__item')

        const img = document.createElement('img')
        img.src = image
        img.loading = 'lazy';
        item.append(img);

        container.append(item)
    })
})
window.api.send('imagesList');


//window.api.send("imagesList", null);