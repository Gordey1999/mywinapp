$(function() {
    let $container = $('.puzzleContainer');
    let $menu = $('.contextMenu');
    let $active = null;

    function resetActive() {
        hideContextMenu();
        resetActiveInternal();
    }

    function resetActiveInternal() {
        $container.removeClass('hide');
        if ($active !== null)
        {
            $active.removeClass('selected');
            $active = null;
        }
    }

    function setActive($elem) {
        resetActiveInternal();
        $container.addClass('hide');
        $elem.addClass('selected');
        $active = $elem;
    }

    function hideContextMenu() {
        $menu.removeClass('active');
        setTimeout(function() {
            if (!$menu.hasClass('active'))
                $menu.hide();
        }, 500);
    }
    function showContextMenu() {
        $menu.show();
        $menu.addClass('active');
    }


    let data = null;

    window.api.receive('puzzleGetBlockResult', (puzzle, options) => {
        if (data === null) {
            data = {};
            const body = document.body;
            for (let i = 1; i <= 4; i++) {
                body.style.setProperty('--cell-width' + i, puzzle['cellWidth'][i] + 'px');
                body.style.setProperty('--cell-height' + i, puzzle['cellHeight'][i] + 'px');
            }
        }

        for (const piece of puzzle.cells) {
            const el = document.createElement('div');
            el.classList.add('puzzleElement', 'puzzleSize' + piece.size);
            el.dataset.size = piece.size;
            el.style.left = piece.xPx + 'px';
            el.style.top = piece.yPx + 'px';
            $container.append(el);
        }
        data.mapEnd = options.mapEnd;
        data.nextBlockY = options.nextBlockY;
        data.pieceWidth = options.pieceWidth;

        $container.removeClass('loadingMore');
        loadImages();
    })

    function queryBlock() {
        window.api.send('puzzleGetBlock', data?.mapEnd, data?.nextBlockY);
    }
    queryBlock();


    let windowHeight = $(window).height();
    let getImageIndex = -1;
    let getImageItems = [];
	let canGetNext = true;
    window.api.receive('puzzleGetImageResult', (img, initStyles, index) => {
        getImageItems[index](img, initStyles);
	    canGetNext = true;
    })
    let imagesQueue = [];
    setInterval(function() {
        if (imagesQueue.length && canGetNext) {
	        canGetNext = false;
            imagesQueue.shift()();
        }
    }, 200);

    function loadImages()
    {
        let scroll = $(document).scrollTop();

        $('.puzzleElement:not(.init)').each(function () {
            let $this = $(this);

            let top = parseInt($($this).css('top'));
            if (top - scroll > windowHeight)
                return;

            $this.addClass('init');

            let request = {
                url: '/getImage.php',
                method: 'get',
                dataType: 'json', // тип ответа
                data: {
                    size: $this.data('size'),
                    pieceWidth: data.pieceWidth
                }
            };
            let imgId = null;
            if ($this.find('img').length > 0)
                imgId = $this.find('img').data('id');


            getImageItems.push(function(img, initStyles) {
                    $this.html(img);
                    const $image = $this.find('img');
                    for (let key in initStyles) {
                        $image.css(key, initStyles[key] + 'px');
                    }
                    $image.one('load', function() {
                        setTimeout(function() {
                            if ($image.hasClass('horizontal'))
                                $image.css('left', $image.data('offset'));
                            else
                                $image.css('top', $image.data('offset'));

                        }, 100);
                        setTimeout(function() { $this.addClass('loaded') }, 1000);
                    });
            });

            const index = ++getImageIndex;
            imagesQueue.push(function() {
                window.api.send('puzzleGetImage', $this.data('size'), data.pieceWidth, index, imgId);
            });

        });
    }

    function getRandomBool() {
        return Math.floor(Math.random() * 2) === 1;
    }

    function animateImages() {
        let scroll = $(document).scrollTop();

        $('.puzzleElement.loaded').each(function () {
            let $this = $(this);
            let $image = $(this).find('img');

            let top = parseInt($this.css('top'));

            let isVisible = Math.abs((top + $image.height() / 2) - (scroll + windowHeight / 2)) < windowHeight * 2;
            let isHorizontal = $image.hasClass('horizontal');

            if (isVisible && $this.hasClass('notVisible'))
            {
                // show
                $this.removeClass('notVisible');
                if (isHorizontal)
                {
                    let offset = $image.data('offset');
                    $image.css('left', offset);
                }
                else
                {
                    let offset = $image.data('offset');
                    $image.css('top', offset);
                }
            }
            else if (!isVisible && !$this.hasClass('notVisible'))
            {
                // hide
                $this.addClass('notVisible');
                if (isHorizontal)
                {
                    $image.css('left', getRandomBool() ? 0 : $this.width() - $image.width());
                }
                else
                {
                    $image.css('top', getRandomBool() ? 0 : $this.top - $image.height());
                }
            }
        });
    }

    function downloadBlock() {
        loadImages();
        animateImages();

        if ($container.hasClass('loadingMore'))
        {
            return;
        }
        let scroll = $(document).scrollTop()
        let height = data.pieceWidth * data.nextBlockY;

        if (height - scroll < windowHeight * 2)
        {
            queryBlock();
            $container.addClass('loadingMore');
        }
    }

    //loadImages();
    $(document).scroll(downloadBlock);

    // image position
    (function() {
        let $element = null;
        let $image = null;
        let drugPos = 0;
        let type = 'h';
        let imageOffset = 0;
        let max = 0;

        $('body').on('mousedown', '.puzzleElement', function(e) {
            if (e.button !== 0)
                return;
            e.preventDefault();
            //setActive($(this));
            resetActive();
            $element = $(this);
            $image = $(this).find('img');
            type = $image.hasClass('horizontal') ? 'h' : 'v';

            $image.css('transition', 'none');
            if (type === 'h')
            {
                drugPos = e.pageX;
                imageOffset = parseInt($image.css('left'));
                max = $element.width() - $image.width();
            }
            else
            {
                drugPos = e.pageY;
                imageOffset = parseInt($image.css('top'));
                max = $element.height() - $image.height();
            }
        })

        $(window).mouseup(function(e) {
            if (e.button !== 0 || $element === null) {
                $element = null;
                return;
            }
            resetActive();
            let offset = type === 'h' ? parseInt($image.css('left')) : parseInt($image.css('top'));
            let imageL = type === 'h' ? $image.width() : $image.height();
            $image.css('transition', "");
            $image.data('offset', offset + 'px');

            // $.ajax({
            //     url: '/updateImage.php',
            //     method: 'get',
            //     dataType: 'json', // тип ответа
            //     data: {
            //         action: 'setPosition',
            //         id: $image.data('id'),
            //         position: (-offset + $element.width() / 2) / imageL
            //     },
            // });

            $element = null;
        });
        $(window).mousemove(function(e) {
            if ($element === null)
                return;

            let offset = type === 'h' ? e.pageX - drugPos : e.pageY - drugPos;

            offset += imageOffset;

            if (offset > 0)
                offset = 0;
            else if (offset < max)
                offset = max;

            if (type === 'h')
                $image.css('left', offset);
            else
                $image.css('top', offset);
        });
    })();

    // context menu

    (function() {
        $('body').on('contextmenu', '.puzzleElement', function(e) {
            e.preventDefault();

            //$menu.addClass('active');
            showContextMenu();

            let x = e.pageX;
            let y = e.pageY;
            let bodyWidth = $('body').width();

            if ($menu.width() + x > bodyWidth)
                x -= $menu.width();

            $menu.css('left', x + 'px');
            $menu.css('top', y + 'px');

            setActive($(this));
        })

        // $('.btnDeleteBorders').click(function(e) {
        //     e.preventDefault();
        //     $.ajax({
        //         url: '/updateImage.php',
        //         method: 'get',
        //         dataType: 'json', // тип ответа
        //         data: {
        //             action: 'deleteBlackBorders',
        //             id: $active.find('img').data('id'),
        //         },
        //     }).then(function(data) {
        //         if (data.status !== 'ok')
        //             return;
        //         $active.removeClass('init');
        //         $active.find('img').css('transition', 'opacity 1s').css('opacity', 0);
        //         loadImages();
        //
        //         resetActive();
        //     });
        //     return true;
        // });

        //
        // $('body').on('click', function(e) {
        //     console.log('lsdf');
        //     resetActive();
        // })

    })();





    document.addEventListener('keydown', (e) => {
        if (e.code === 'Escape' || e.code === 'Enter') {
            window.api.send('closePuzzle');
        }
    });
});
