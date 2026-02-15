import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

class LocalDoc {
    constructor(collectionName, id) {
        this.collectionName = collectionName;
        this.id = id;
    }

    _getFilePath() {
        return path.join(DATA_DIR, `${this.collectionName}.json`);
    }

    _readData() {
        try {
            const filePath = this._getFilePath();
            if (!fs.existsSync(filePath)) return [];
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (e) {
            return [];
        }
    }

    _writeData(data) {
        fs.writeFileSync(this._getFilePath(), JSON.stringify(data, null, 2), 'utf8');
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
        let data = this._readData();
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

        this._writeData(data);
    }

    async update(newData) {
        let data = this._readData();
        const existingIndex = data.findIndex(i => i.id === this.id);

        if (existingIndex >= 0) {
            data[existingIndex] = { ...data[existingIndex], ...newData };
            this._writeData(data);
        } else {
            throw new Error('Document not found');
        }
    }

    async delete() {
        let data = this._readData();
        const filtered = data.filter(i => i.id !== this.id);
        this._writeData(filtered);
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
        return path.join(DATA_DIR, `${this.name}.json`);
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
        await newDoc.set(data);
        return newDoc;
    }

    async get() {
        let data = [];
        try {
            const filePath = this._getFilePath();
            if (fs.existsSync(filePath)) {
                data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            }
        } catch (e) {
            data = [];
        }

        // Apply filters
        for (const filter of this.filters) {
            data = data.filter(item => {
                if (filter.op === '==') return item[filter.field] === filter.value;
                if (filter.op === '!=') return item[filter.field] !== filter.value;
                return true;
            });
        }

        // Apply sorts
        for (const sort of this.sorts) {
            data.sort((a, b) => {
                const valA = a[sort.field] || 0;
                const valB = b[sort.field] || 0;
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
            empty: docs.length === 0
        };
    }
}

export class LocalDb {
    collection(name) {
        return new LocalCollection(name);
    }
}
