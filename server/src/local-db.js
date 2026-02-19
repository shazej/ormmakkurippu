import fs from 'fs';
import path from 'path';

// Configurable path with safe default
const DATA_DIR = process.env.LOCAL_DB_PATH
    ? path.resolve(process.env.LOCAL_DB_PATH)
    : path.join(process.cwd(), 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (err) {
        console.error(`CRITICAL: Could not create data directory at ${DATA_DIR}`, err);
        throw err;
    }
}

// Simple in-memory mutex for file writing
const writeLocks = new Map();

const acquireLock = async (filePath) => {
    while (writeLocks.get(filePath)) {
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    writeLocks.set(filePath, true);
};

const releaseLock = (filePath) => {
    writeLocks.delete(filePath);
};

class LocalDoc {
    constructor(collectionName, id) {
        this.collectionName = collectionName;
        this.id = id;
    }

    _getFilePath() {
        // Sanitize collection name to prevent traversal
        const safeName = this.collectionName.replace(/[^a-zA-Z0-9_-]/g, '');
        return path.join(DATA_DIR, `${safeName}.json`);
    }

    _readData() {
        const filePath = this._getFilePath();
        try {
            if (!fs.existsSync(filePath)) return [];
            const content = fs.readFileSync(filePath, 'utf8');
            if (!content.trim()) return []; // Handle empty file
            return JSON.parse(content);
        } catch (e) {
            console.error(`[LocalDb] Corrupt or unreadable file: ${filePath}`, e);
            // Backup corrupt file
            if (fs.existsSync(filePath)) {
                const backupPath = `${filePath}.corrupt.${Date.now()}`;
                fs.copyFileSync(filePath, backupPath);
                console.warn(`[LocalDb] Backed up corrupt file to ${backupPath}`);
            }
            return []; // Return empty to allow recovery/continued operation
        }
    }

    async _writeData(data) {
        const filePath = this._getFilePath();
        const tempPath = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).substring(7)}`;

        await acquireLock(filePath);
        try {
            // Write to temp file first
            fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
            // Atomic rename
            fs.renameSync(tempPath, filePath);
        } catch (err) {
            console.error(`[LocalDb] Write failed for ${filePath}`, err);
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); // Cleanup
            throw err;
        } finally {
            releaseLock(filePath);
        }
    }

    async get() {
        const data = this._readData();
        const item = data.find(i => i.id === this.id);
        return {
            exists: !!item,
            data: () => item
        };
    }

    async set(newData, options = {}) {
        const data = this._readData();
        const existingIndex = data.findIndex(i => i.id === this.id);

        if (existingIndex >= 0) {
            if (options.merge) {
                data[existingIndex] = { ...data[existingIndex], ...newData };
            } else {
                data[existingIndex] = newData;
            }
        } else {
            data.push({ ...newData, id: this.id });
        }

        await this._writeData(data);
    }

    async update(newData) {
        const data = this._readData();
        const existingIndex = data.findIndex(i => i.id === this.id);

        if (existingIndex >= 0) {
            data[existingIndex] = { ...data[existingIndex], ...newData };
            await this._writeData(data);
        } else {
            throw new Error('Document not found');
        }
    }

    async delete() {
        const data = this._readData();
        const filtered = data.filter(i => i.id !== this.id);
        await this._writeData(filtered);
    }
}

class LocalCollection {
    constructor(name) {
        this.name = name;
        this.filters = [];
        this.sorts = [];
        this.limitVal = null;
    }

    _getFilePath() {
        const safeName = this.name.replace(/[^a-zA-Z0-9_-]/g, '');
        return path.join(DATA_DIR, `${safeName}.json`);
    }

    _clone() {
        const q = new LocalCollection(this.name);
        q.filters = [...this.filters];
        q.sorts = [...this.sorts];
        q.limitVal = this.limitVal;
        return q;
    }

    doc(id) {
        if (!id) {
            id = Math.random().toString(36).substring(2, 15);
        }
        return new LocalDoc(this.name, id);
    }

    where(field, op, value) {
        const q = this._clone();
        q.filters.push({ field, op, value });
        return q;
    }

    orderBy(field, dir = 'asc') {
        const q = this._clone();
        q.sorts.push({ field, dir });
        return q;
    }

    limit(n) {
        const q = this._clone();
        q.limitVal = n;
        return q;
    }

    async add(data) {
        const id = Math.random().toString(36).substring(2, 15);
        const newDoc = new LocalDoc(this.name, id);
        // Ensure ID is in data if not present
        const docData = { ...data, id };
        await newDoc.set(docData);
        return newDoc;
    }

    async get() {
        let data = [];
        const filePath = this._getFilePath();

        try {
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                if (content.trim()) {
                    data = JSON.parse(content);
                }
            }
        } catch (e) {
            console.error(`[LocalDb] Error reading collection ${this.name}`, e);
            data = [];
        }

        // Apply filters
        for (const filter of this.filters) {
            data = data.filter(item => {
                const itemVal = item[filter.field];
                if (filter.op === '==') return itemVal === filter.value;
                if (filter.op === '!=') return itemVal !== filter.value;
                if (filter.op === '>') return itemVal > filter.value;
                if (filter.op === '<') return itemVal < filter.value;
                if (filter.op === '>=') return itemVal >= filter.value;
                if (filter.op === '<=') return itemVal <= filter.value;
                if (filter.op === 'array-contains') return Array.isArray(itemVal) && itemVal.includes(filter.value);
                return true;
            });
        }

        // Apply sorts
        for (const sort of this.sorts) {
            data.sort((a, b) => {
                const valA = a[sort.field];
                const valB = b[sort.field];

                // Handle undefined/null (push to end)
                if (valA == null) return 1;
                if (valB == null) return -1;

                if (typeof valA === 'string' && typeof valB === 'string') {
                    if (sort.dir === 'desc') return valB.localeCompare(valA);
                    return valA.localeCompare(valB);
                }
                if (sort.dir === 'desc') return valB - valA;
                return valA - valB;
            });
        }

        // Apply limit
        if (this.limitVal) {
            data = data.slice(0, this.limitVal);
        }

        const docs = data.map(item => ({
            id: item.id,
            data: () => item
        }));

        return {
            docs,
            empty: docs.length === 0,
            size: docs.length,
            forEach: (cb) => docs.forEach(cb)
        };
    }
}

export class LocalDb {
    collection(name) {
        return new LocalCollection(name);
    }
}
