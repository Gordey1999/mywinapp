const db = require("./db");
const fs = require("fs");
const crypto = require('crypto');

class FilesIndexer {
    #dir = null;
    #queue = [];
    #add = [];
    #dbData = null;
    #total = null;

    #checkStep = 30;

    constructor(dir, files) {
        this.#dir = dir;
        this.#queue = [...files];
        this.#total = files.length;
    }

    async stepAsync() {
        return this.step();
    }

    step() {
        if (this.#dbData === null) {
            this.#fetchDb();
            return 0;
        }
        if (this.#queue.length > 0) {
            this.#stepCheck();
            return this.#total - (this.#queue.length + this.#add.length);
        }
        if (Object.keys(this.#dbData).length > 0) {
            this.#deleteUnwanted();
            return this.#total - this.#add.length;
        }
        if (this.#add.length > 0) {
            this.#stepAdd();
            return this.#total - this.#add.length;
        }
        return 'done';
    }

    #fetchDb() {
        const rows = db.prepare('SELECT * FROM files WHERE dir = ? order by name').all(this.#dir);
        this.#dbData = {};
        for (const row of rows)
            this.#dbData[row.name] = row;
    }

    #stepCheck() {
        for (let i = 0; i < this.#checkStep; i++) {
            if (this.#queue.length === 0) break;

            const file = this.#queue.pop();
            const stats = fs.statSync(file.src);
            const ctime = stats.ctime.toISOString();
            const mtime = stats.mtime.toISOString();

            const dbFile = this.#dbData[file.name] ?? null;
            if (dbFile && dbFile.size === stats.size && dbFile.ctime === ctime && dbFile.mtime === mtime) {
                delete this.#dbData[file.name];
            } else {
                this.#add.push({
                    'file': file,
                    'size': stats.size,
                    'ctime': ctime,
                    'mtime': mtime
                });
            }
        }
    }
    #stepAdd() {
        const item = this.#add.pop();

        const insert = db.prepare(`
            INSERT INTO files (dir, name, type, size, ctime, mtime, hash)
            VALUES (@dir, @name, @type, @size, @ctime, @mtime, @hash)`);

        insert.run({
            dir: this.#dir,
            name: item.file.name,
            type: item.file.type,
            size: item.size,
            ctime: item.ctime,
            mtime: item.mtime,
            hash: item.size < 256000000 ? makeHash(item.file.src) : ''
        })
    }

    #deleteUnwanted() {
        const ids = Object.values(this.#dbData).map(item => item.id);
        const params = ids.map(() => '?').join(',');
        db.prepare(`DELETE from files WHERE id IN (${params})`).run(ids);
        this.#dbData = {};
    }
}

function makeHash(src) {
    const fileBuffer = fs.readFileSync(src);
    const hashSum = crypto.createHash('sha1');
    hashSum.update(fileBuffer);

    return hashSum.digest('hex');
}


module.exports = { FilesIndexer }