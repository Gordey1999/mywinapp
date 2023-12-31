const settings = require("./settings");

function getType(name) {
    for (const type of settings.types) {
        if (name.toLowerCase().endsWith(type)) {
            return type;
        }
    }
    return null;
}

const collator = new Intl.Collator(['en', 'ru'], {numeric: true, sensitivity: 'base'});

function sortByName(arr) {
    arr.sort((a, b) => collator.compare(a.name, b.name));
    return arr;
}

module.exports = { getType, sortByName };