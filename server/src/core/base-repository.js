import { db } from '../firebase.js';

export class BaseRepository {
    constructor(collectionName) {
        this.collection = db.collection(collectionName);
    }

    async find(filters = [], limit = 0, sort = null) {
        let query = this.collection;

        for (const filter of filters) {
            query = query.where(filter.field, filter.op, filter.value);
        }

        if (sort) {
            query = query.orderBy(sort.field, sort.dir);
        }

        if (limit > 0) {
            query = query.limit(limit);
        }

        const snapshot = await query.get();
        if (snapshot.empty) return [];

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async findById(id) {
        const doc = await this.collection.doc(id).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }

    async create(data) {
        const docRef = await this.collection.add(data);
        return { id: docRef.id, ...data };
    }

    async update(id, data) {
        await this.collection.doc(id).update(data);
        return { id, ...data };
    }

    async delete(id) {
        await this.collection.doc(id).delete();
        return { id, status: 'deleted' };
    }

    async deleteWhere(field, value) {
        const batch = db.batch();
        const snapshot = await this.collection.where(field, '==', value).get();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    }
}
