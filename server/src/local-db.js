import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'tasks.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure data file exists
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
}

class LocalDoc {
    constructor(collectionName, id) {
        this.collectionName = collectionName;
        this.id = id;
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

    _readData() {
        try {
            return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        } catch (e) {
            return [];
        }
    }

    _writeData(data) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    }
}

class LocalCollection {
    constructor(name) {
        this.name = name;
        this.filters = [];
        this.sorts = [];
    }

    doc(id) {
        return new LocalDoc(this.name, id);
    }

    where(field, op, value) {
        this.filters.push({ field, op, value });
        return this;
    }

    orderBy(field, dir = 'asc') {
        this.sorts.push({ field, dir });
        return this;
    }

    async get() {
        let data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

        // Apply filters
        for (const filter of this.filters) {
            data = data.filter(item => {
                if (filter.op === '==') return item[filter.field] === filter.value;
                return true;
            });
        }

        // Apply sorts
        for (const sort of this.sorts) {
            data.sort((a, b) => {
                const valA = a[sort.field] || 0;
                const valB = b[sort.field] || 0;
                if (sort.dir === 'desc') return valB - valA;
                return valA - valB;
            });
        }

        return {
            docs: data.map(item => ({
                data: () => item
            }))
        };
    }
}

export class LocalDb {
    collection(name) {
        return new LocalCollection(name);
    }
}
