import { db } from '../../firebase.js';

export class ActivityRepository {
    constructor() {
        this.collection = db.collection('audit_logs');
    }

    async create(data) {
        // Enforce timestamp if not present
        const entry = {
            timestamp: new Date().toISOString(),
            ...data
        };
        const ref = await this.collection.add(entry);
        return { id: ref.id, ...entry };
    }

    async find(filters = [], limit = 50, sort = { field: 'timestamp', dir: 'desc' }) {
        let query = this.collection;

        filters.forEach(f => {
            query = query.where(f.field, f.op, f.value);
        });

        if (sort) {
            query = query.orderBy(sort.field, sort.dir);
        }

        if (limit) {
            query = query.limit(limit);
        }

        const snapshot = await query.get();
        if (snapshot.empty) return [];

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
}
