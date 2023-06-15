const Database = require('better-sqlite3');

const db = new Database('main.db', { verbose: console.log });

console.log('connection start');
module.exports = db;