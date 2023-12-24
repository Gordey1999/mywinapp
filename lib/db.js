const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../main.db'), { /*verbose: console.log*/ });

console.log('connection start');
module.exports = db;