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

    constructor(video) {
        this.#video = video;
        this.#make();
        this.#bind();
        this.#showControls();
    }
    #make() {
        this.#controls.duration.textContent = this.#formatTime(this.#video.duration);
    }

    #bind() {
        this.#timer = setInterval(this.#updateTime.bind(this), 1000);
        this.#controls.timeline.addEventListener('click', this.#onTimelineClick.bind(this));
    }
    #unbind() {
        clearInterval(this.#timer);
    }

    #onTimelineClick(e) {
        const duration = this.#video.duration;
        const timelineWidth = this.#controls.timeline.offsetWidth;
        const x = e.offsetX;
        this.#video.currentTime = (x / timelineWidth) * duration;
        this.#updateTime();
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

    showFile(files[index]);

    item.append(img);

    document.addEventListener('keydown', (e) => {
        if (e.code === 'KeyD' || e.code === 'ArrowRight') {
            e.preventDefault();
            if (currentLoaded && index < files.length - 1)
                index++;
            showFile(files[index]);
        } else if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
            e.preventDefault();
            if (currentLoaded && index > 0)
                index--;
            showFile(files[index]);
        } else if (e.code === 'Escape' || e.code === 'Enter') {
            e.preventDefault();
            window.api.send('closeDetail', files[index].id);
        }
    });


    function showFile(file) {
        currentLoaded = false;

        if (player) {
            player.destroy();
            player = null;
        }

        if (file.type === 'mp4') {
            if (video !== null) {
                video.remove();
            }
            video = createNode('video', null, item);
            video.src = file.src;
            video.autoplay = true;
            video.loop = true;

            img.style.display = 'none';

            video.onloadeddata = () => {
                fillMenuData(video.videoWidth, video.videoHeight);
                player = new VideoPlayer(video);
                currentLoaded = true;
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
            };
        }
    }

    function fillMenuData(width, height) {
        menu.querySelector('.number').textContent = (index + 1) + ' / ' + files.length;
        menu.querySelector('.name').textContent = files[index].name;
        menu.querySelector('.size').textContent = width + ' x ' + height;
    }

    menu.querySelector('.explorer').addEventListener('click', () => {
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
