
(function() {

    const fieldCount = document.querySelector('.js-count');
    const fieldAdded = document.querySelector('.js-added');
    const fieldMessage = document.querySelector('.js-message');

    let stop = true;

    document.querySelector('.js-start').addEventListener('click', () => {
        if (!stop) return;
        stop = false;
        window.api.send('indexFilesStep');
    });

    document.querySelector('.js-stop').addEventListener('click', () => {
        stop = true;
    });

    window.api.receive('indexFilesStepResult', (data) => {
        fieldCount.textContent = data.count;
        fieldAdded.textContent = data.added;
        if (data.finished) {
            fieldMessage.textContent = 'finished!';
            return;
        }
        if (data.message !== null) {
            fieldMessage.textContent = data.message;
        }
        if (data.stepFinished && !stop) {
            window.api.send('indexFilesStep');
        }
    });

})();