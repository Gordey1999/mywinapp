const icons = {
    close: [ 16, ' <path d="M 3 3 L 13 13 M 3 13 L 13 3" stroke-width="1.5px" fill="none"/>' ],
    minimize: [ 16, '<path d="M 3 8 H 13" stroke-width="1.5px" fill="none"/>' ],
    maximize: [ 16, '<path d="M 3 3 H 13 V 13 H 3 Z" stroke-width="1.5px" fill="none"/>' ],
    unmaximize: [ 16, '<path d="M 3 13 H 11 V 5 H 3 V 13 M 5 5 V 3 H 13 V 11 H 11" stroke-width="1px" fill="none"/>' ],
    menu: [ 24, '<path d="M 3 6 H 21 M 3 12 H 21 M 3 18 H 21" stroke-width="2px" fill="none"/>' ],

    point: [ 16, '<circle cx="8" cy="8" r="2" stroke-width="1px" stroke="none" />', true ],
    arrow: [ 16, '<path d="M 6 3 L 11 8 L 6 13" stroke-width="1px" fill="none"/>' ],
    settings: [ 16, '<circle cx="8" cy="8" r="2" stroke-width="1px" fill="none" /><path d="M 5 3 h 6 L 14 8 L 11 13 h -6 L 2 8 L 5 3 h 1" stroke-width="1px" fill="none" />' ],
    explorer: [ 16, '<path d="M 2 13 h 12 v -9 h -7 l -1 -1 h -4 V 13 h 1 M 2 6 h 12" stroke-width="1px" fill="none" />' ],
    puzzle: [ 16, '<path d="M 3 14 V 4 H 6 V 1 H 9 V 4 H 13 V 8 H 10 V 11 H 13 V 14 H 3 V 11" stroke-width="1px" fill="none"/>' ],
    copy: [ 16, '<path d="M 3 14 V 4 H 11 V 14 H 3 V 13 M 5 4 V 2 H 13 V 12 H 11" stroke-width="1px"  fill="none"/>' ],
    copy2: [ 16, '<path d="M 3 14 V 6 L 5 4 H 11 V 14 H 3 V 13 M 6 3 7 2 H 13 V 12 H 11" stroke-width="1px"  fill="none"/>' ],
    paste: [ 16, '<path d="M 3 14 v -12 h 10 v 12 h -10 v -1 M 6 2 v 2 h 4 v -2" stroke-width="1px" fill="none" />' ],
    delete: [ 16, '<path d="M 2 3 H 14 M 4 3 L 5 14 H 11 L 12 3 M 7 3 V 2 H 9 V 3" stroke-width="1px" fill="none"/>' ],
    file: [ 16, '<path d="M 4 13 v -10 h 6 l 2 2 v 8 h -8 v -1 M 6 7 h 4 M 6 10 h 4" stroke-width="1px"  fill="none"/>' ],

    x: [ 16, '<path d="M 2 2 L 14 14 M 2 14 L 14 2" stroke-width="1px" fill="none"/>' ],

    arrowFilled: [16, '<path d="M 0 10 L 8 5 L 16 10" />', true ],

    checked: [ 16, '<path d="M 2 8 l 4 4 l 8 -8" stroke-width="2px" fill="none"/>' ]
}

export function loadIcon(name) {
    if (!icons.hasOwnProperty(name)) {
        console.log('cant find icon' + name);
        return null;
    }

    return make(icons[name][1], icons[name][0], icons[name].length === 3);
}

function make(content, width, fill = false) {
    const iconHeader = '<svg class="#CLASS#" xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 #WIDTH# #WIDTH#" width="#WIDTH#px" height="#WIDTH#px">';
    const iconFooter = '</svg>'

	let header = iconHeader.replaceAll('#WIDTH#', width);
	header = header.replace('#CLASS#', fill ? 'svg-fill' : '');

    const icon = header + content + iconFooter;

    return (new DOMParser()).parseFromString(icon, "text/xml").documentElement;
}