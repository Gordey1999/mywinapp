const directions = {
    1: 'left',
    2: 'right',
    3: 'top',
    4: 'left_top',
    5: 'right_top',
    6: 'bottom',
    7: 'bottom_left',
    8: 'bottom_right'
}

const extraWidth = 16;
const extraHeight = 48;

function getHeight(aspectRatio, width) {
    return Math.max(
        0,
        Math.floor((width - extraWidth) / aspectRatio + extraHeight)
    );
}

function getWidth(aspectRatio, height) {
    return Math.max(
        0,
        Math.floor((height - extraHeight) * aspectRatio + extraWidth)
    );
}

function windowProportionalResize(window, aspectRatio) {
    let resizeDirection;

    window.hookWindowMessage(0x0214, (wParam) => {
        const directionNumber = wParam.readUIntBE(0, 1);
        resizeDirection = directions[directionNumber];
    });

    window?.on('will-resize', (event, newBounds) => {

        if (aspectRatio && window) {
            event.preventDefault();
            let temp_width;
            let temp_height;
            const toBounds = { ...newBounds };
            switch (resizeDirection) {
                case 'left':
                case 'right':
                    toBounds.height = getHeight(
                        aspectRatio,
                        newBounds.width
                    );
                    break;
                case 'top':
                case 'bottom':
                    toBounds.width = getWidth(aspectRatio, newBounds.height);
                    break;
                case 'bottom_left':
                case 'bottom_right':
                case 'left_top':
                case 'right-top':
                    toBounds.width = getWidth(aspectRatio, newBounds.height);
                    temp_width = newBounds.width;
                    temp_height = getHeight(aspectRatio, temp_width);
                    if (
                        temp_width * temp_height >
                        toBounds.width * toBounds.height
                    ) {
                        toBounds.width = temp_width;
                        toBounds.height = temp_height;
                    }
                    break;
                default:
            }
            switch (resizeDirection) {
                case 'bottom_left':
                    toBounds.x = newBounds.x + newBounds.width - toBounds.width;
                    break;
                case 'left_top':
                    toBounds.x = newBounds.x + newBounds.width - toBounds.width;
                    toBounds.y = newBounds.y + newBounds.height - toBounds.height;
                    break;
                case 'right_top':
                    toBounds.y = newBounds.y + newBounds.height - toBounds.height;
                    break;
                default:
            }
            window.setBounds(toBounds);
        }
    });
}

module.exports = { windowProportionalResize }