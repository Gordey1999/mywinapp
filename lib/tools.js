const settings = require("./settings");
const path = require("node:path");

function getFileType(name) {
    const ext = getFileExt(name);
    if (ext === null) { return null; }

    for (const [type, list] of Object.entries(settings.types)) {
        if (list.includes(ext)) {
            return type;
        }
    }
    return null;
}

function getFileExt(name) {
    const ext = path.extname(name);
    return ext.length > 0 ? ext.substring(1).toLowerCase() : null;
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