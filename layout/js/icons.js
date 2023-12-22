const icons = {
    close: [ 16, ' <path d="M 3 3 L 13 13 M 3 13 L 13 3" stroke-width="1.5px" fill="none"/>' ],
    minimize: [ 16, '<path d="M 3 8 H 13" stroke-width="1.5px" fill="none"/>' ],
    maximize: [ 16, '<path d="M 3 3 H 13 V 13 H 3 Z" stroke-width="1.5px" fill="none"/>' ],
    unmaximize: [ 16, '<path d="M 3 13 H 11 V 5 H 3 V 13 M 5 5 V 3 H 13 V 11 H 11" stroke-width="1px" fill="none"/>' ],
    menu: [ 24, '<path d="M 3 6 H 21 M 3 12 H 21 M 3 18 H 21" stroke-width="2px" fill="none"/>' ],
	checked: [ 16, '<path d="M 2 8 l 4 4 l 8 -8" stroke-width="2px" fill="none"/>' ]
}

export function loadIcon(name) {
    if (!icons.hasOwnProperty(name)) {
        console.log('cant find icon' + name);
        return null;
    }

    return make(icons[name][1], icons[name][0]);
}

function make(content, width) {
    const iconHeader = '<svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 #WIDTH# #WIDTH#" width="#WIDTH#px" height="#WIDTH#px">';
    const iconFooter = '</svg>'

    const icon = iconHeader.replaceAll('#WIDTH#', width) + content + iconFooter;

    return (new DOMParser()).parseFromString(icon, "text/xml").documentElement;
}