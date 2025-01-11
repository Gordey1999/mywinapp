const settings = require("./settings");

function getFileType(name) {
    for (const [type, list] of Object.entries(settings.types)) {
        for (const ext of list) {
            if (name.toLowerCase().endsWith(ext)) {
                return type;
            }
        }
    }
    return null;
}

function getFileExt(name) {
    for (const [type, list] of Object.entries(settings.types)) {
        for (const ext of list) {
            if (name.toLowerCase().endsWith(ext)) {
                return ext;
            }
        }
    }
    return null;
}

const collator = new Intl.Collator(['en', 'ru'], {numeric: true, sensitivity: 'base'});

function sortByName(arr, desc = false) {
    if (desc) {
        arr.sort((a, b) => collator.compare(b.name, a.name));
    } else {
        arr.sort((a, b) => collator.compare(a.name, b.name));
    }

    return arr;
}

module.exports = { getFileExt, getFileType, sortByName };