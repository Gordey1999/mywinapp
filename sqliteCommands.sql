

SELECT sql
FROM sqlite_schema
WHERE name = 'tableName';




CREATE TABLE "files"
(
    id    integer
        primary key,
    dir   TEXT not null,
    name  TEXT not null,
    type  TEXT not null,
    size  integer,
    hash  TEXT not null,
    ctime TEXT,
    mtime TEXT
);
create index path
    on files (dir);
create index hash
    on files (hash);