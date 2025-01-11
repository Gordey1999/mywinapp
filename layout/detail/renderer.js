import {createNode} from "../assets/js/tools.js";

class VideoPlayer {
    #video = null;

    #controls = {
        container: document.querySelector('.menu-container.bottom'),
        time: document.querySelector('.video-controls .time'),
        duration: document.querySelector('.video-controls .duration'),
        timeline: document.querySelector('.video-controls .timeline'),
        point: document.querySelector('.video-controls .timeline__point'),
    }


    #timer = null;

    _scrollActive = false;
    _paused = false;

    constructor(video) {
        this.#video = video;
        this.#make();
        this.#bind();
        this.#showControls();
        this.#updateTime();
    }
    #make() {
        this.#controls.duration.textContent = this.#formatTime(this.#video.duration);
    }

    #bind() {
        this.#timer = setInterval(this.#updateTime.bind(this), 1000);

        this.#controls.timeline.addEventListener('mousedown', this._onTimelineClick);
        document.addEventListener('mousemove', this._onMouseMove);
        document.addEventListener('mouseup', this._onMouseRelease);
        document.addEventListener('keydown', this._onKeydown);
    }
    #unbind() {
        clearInterval(this.#timer);

        this.#controls.timeline.removeEventListener('mousedown', this._onTimelineClick);
        document.removeEventListener('mousemove', this._onMouseMove);
        document.removeEventListener('mouseup', this._onMouseRelease);
        document.removeEventListener('keydown', this._onKeydown);
    }

    _onTimelineClick = (e) => {
        this._scrollActive = true;
        this.#video.pause();

        const duration = this.#video.duration;
        this.#video.currentTime = this._getMouseTimelinePosition(e.clientX) * duration;
        this.#updateTime();
    }

    _onMouseRelease = (e) => {
        if (!this._scrollActive) { return; }

        this._scrollActive = false;
        if (!this._paused) {
            this.#video.play();
        }
    }

    _onMouseMove = (e) => {
        if (!this._scrollActive) { return; }

        const duration = this.#video.duration;
        this.#video.currentTime = this._getMouseTimelinePosition(e.clientX) * duration;
        this.#updateTime();
    }

    _getMouseTimelinePosition(mouseX) {
        const timelineRect = this.#controls.timeline.getBoundingClientRect();

        if (mouseX < timelineRect.left) { return 0; }
        if (mouseX > timelineRect.right) { return 1; }

        return (mouseX - timelineRect.left) / timelineRect.width;
    }

    #updateTime() {
        const time = Math.floor(this.#video.currentTime);
        const duration = this.#video.duration;
        const timelineWidth = this.#controls.timeline.offsetWidth;

        this.#controls.time.textContent = this.#formatTime(time);

        this.#controls.point.style.width = (time / duration) * timelineWidth + 'px';
    }
    #formatTime(time) {
        const seconds = Math.floor(time % 60);
        const minutes = Math.floor(time / 60 % 3600);
        const hours = Math.floor(time / 3600);

        let res = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
        if (hours > 0) {
            res = hours + res;
        }
        return res;
    }

    #showControls() {
        this.#controls.container.classList.remove('hidden');
    }
    #hideControls() {
        this.#controls.container.classList.add('hidden');
    }

    destroy() {
        this.#hideControls();
        this.#unbind();
    }

    _onKeydown = (e) => {
        if (this._scrollActive) { return; }

        if (e.shiftKey) {
            if (e.code === 'KeyD' || e.code === 'ArrowRight') {
                e.preventDefault();
                this.#video.currentTime += 5;
                this.#updateTime();
            } else if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
                e.preventDefault();
                this.#video.currentTime -= 5;
                this.#updateTime();
            }
        }
        if (e.code === 'Space') {
            e.preventDefault();

            if (this._paused) {
                this.#video.play();
            } else {
                this.#video.pause();
            }
            this._paused = !this._paused;
        }
    }
}


class ItemController {
    _$container = null
    _containerW = 0;
    _containerH = 0;
    _aspectRatio = 0;
    _$itemContainer = null;
    _origW = 0;
    _origH = 0;
    _posX = 0;
    _posY = 0;
    _scale = 0; // зум относительно оригинального размера файла
    _minScale = 0.25;
    _fullScale = 0;
    _maxScale = 10;
    _mouseX = 0;
    _mouseY = 0;


    constructor($container, $itemContainer) {
        this._$container = $container;
        this._aspectRatio = window.devicePixelRatio;
        this._$itemContainer = $itemContainer;

        this.onWindowResize();
        this._bind();
    }

    _bind() {
        $(window).on('resize', this.onWindowResize.bind(this));
        window.addEventListener('wheel', this.onWheel.bind(this));
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        this._$itemContainer.on("dblclick", this._dropZoom.bind(this));
        // on mouse move
    }

    onWindowResize() {
        this._containerW = this._$container.width();
        this._containerH = this._$container.height();
        this._render();
    }

    onMouseMove(e) {
        this._mouseX = e.x;
        this._mouseY = e.y;
    }

    setItem(item, origW, origH, saveScale = false) {
        this._origW = origW;
        this._origH = origH;

        if (!saveScale) {
            this._dropZoom();
        }

        this._render();
    }

    _dropZoom() {
        if (this._containerW / this._origW > this._containerH / this._origH)
        {
            this._scale = (this._containerH * this._aspectRatio) / this._origH;
        }
        else
        {
            this._scale = (this._containerW * this._aspectRatio) / this._origW;
        }
        this._fullScale = this._scale;
        this._render();
    }

    onWheel(e) {
        if (e.ctrlKey) {
            const [w, h] = this._calculateSize();
            this._scale -= e.deltaY * 0.02;

            const [wn, hn] = this._calculateSize();

            const left = -this._posX;
            const top = -this._posY;

            const pointX = left + this._mouseX;
            const pointY = top + this._mouseY;
            const pointXNew = pointX * (wn / w);
            const pointYNew = pointY * (hn / h);
            this._posX = -(pointXNew - this._mouseX);
            this._posY = -(pointYNew - this._mouseY);
        }
        else {
            this._posX -= e.deltaX * 2;
            this._posY -= e.deltaY * 2;
        }

        this._render();
    }

    _calculateSize() {
        if (this._scale > this._maxScale) {
            this._scale = this._maxScale;
        }
        else if (this._scale < this._minScale) {
            this._scale = this._minScale;
        }
        if (Math.abs(this._scale - this._fullScale) < 0.04) {
            this._scale = this._fullScale;
        }

        const scaleAspect = this._scale / this._aspectRatio;
        return [scaleAspect * this._origW, scaleAspect * this._origH];
    }

    _render() {
        const [w, h] = this._calculateSize();

        this._$itemContainer.width(w);
        this._$itemContainer.height(h);

        if (this._posX > 0) {
            this._posX = 0;
        } else if (this._posX < this._containerW - w) {
            this._posX = this._containerW - w;
        }
        if (this._posY > 0) {
            this._posY = 0;
        } else if (this._posY < this._containerH - h) {
            this._posY = this._containerH - h;
        }

        if (w <= this._containerW) {
            this._posX = (this._containerW - w) / 2;
        }
        if (h <= this._containerH) {
            this._posY = (this._containerH - h) / 2;
        }

        this._$itemContainer.css('left', this._posX + 'px');
        this._$itemContainer.css('top', this._posY + 'px');
    }
}

window.api.receive('detailInitResult', (files, selectedId) => {

    let index = null;
    for (const i in files) {
        if (files[i].id === selectedId)
            index = i;
    }

    let video = null;
    let player = null;
    const item = document.querySelector('.item');
    const menu = document.querySelector('.file-info');
    let currentLoaded = false;

    const img = document.createElement('img');
    const itemController = new ItemController($('.container'), $(item));

    showFile(files[index]);

    item.append(img);

    document.addEventListener('keydown', (e) => {
        if (files[index].type === 'video' && e.shiftKey) { return; }

        if (files[index].type === 'video') {
            files[index].currentTime = video.currentTime;
        }

        if (e.code === 'KeyD' || e.code === 'ArrowRight') {
            e.preventDefault();
            if (currentLoaded && index < files.length - 1)
                index++;
            showFile(files[index], e.shiftKey);
        } else if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
            e.preventDefault();
            if (currentLoaded && index > 0)
                index--;
            showFile(files[index], e.shiftKey);
        } else if (e.code === 'Escape' || e.code === 'Enter') {
            e.preventDefault();
            window.api.send('closeDetail', files[index].id);
        }
    });


    function showFile(file, saveScale = false) {
        currentLoaded = false;

        if (player) {
            player.destroy();
            player = null;
        }

        if (file.type === 'video') {
            if (video !== null) {
                video.remove();
            }
            video = createNode('video', null, item);
            video.src = file.src;
            video.autoplay = true;
            video.loop = true;
            video.currentTime = file.currentTime ?? 0;

            img.style.display = 'none';

            video.onloadeddata = () => {
                fillMenuData(video.videoWidth, video.videoHeight);
                player = new VideoPlayer(video);
                currentLoaded = true;
                itemController.setItem(video, video.videoWidth, video.videoHeight, saveScale);
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
                currentLoaded = true;
                itemController.setItem(img, img.naturalWidth, img.naturalHeight, saveScale);
            };
        }
    }

    function fillMenuData(width, height) {
        menu.querySelector('.number').textContent = (index + 1) + ' / ' + files.length;
        menu.querySelector('.name').textContent = files[index].name;
        menu.querySelector('.size').textContent = width + ' x ' + height;
    }

    menu.querySelector('.explorer').addEventListener('click', () => {
        window.api.send('openInExplorer', files[index].src);
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
