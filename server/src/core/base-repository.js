import { db } from '../firebase.js';

export class BaseRepository {
    constructor(collectionName) {
        this.collectionName = collectionName;
        this.collection = db.collection(collectionName);
    }

    async create(data, id = null) {
        const now = new Date().toISOString();
        const docData = {
            ...data,
            created_at: now,
            updated_at: now
        };

        if (id) {
            await this.collection.doc(id).set(docData);
            return { id, ...docData };
        } else {
            const ref = await this.collection.add(docData);
            return { id: ref.id, ...docData };
        }
    }

    async findById(id) {
        const doc = await this.collection.doc(id).get();
        if (!doc.exists) return null;
        const data = doc.data();
        if (data && data.deletedAt) return null; // Soft delete check
        return { id: doc.id, ...data };
    }

    async findOne(field, value) {
        const snapshot = await this.collection.where(field, '==', value).limit(1).get();
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    }

    async find(filters = [], limit = 50, orderBy = { field: 'created_at', dir: 'desc' }) {
        let query = this.collection;

        for (const f of filters) {
            query = query.where(f.field, f.op, f.value);
        }

        // Apply deletedAt filter if not explicitly requested? 
        // For simplicity, we assume callers handle soft delete filtering or we explicitly hide them.
        // Let's hide them by default if "deletedAt" is not in filters.
        const hasDeletedFilter = filters.some(f => f.field === 'deletedAt');

        // Note: Firestore requires indexes for mixed inequality fields. 
        // So we might skip implicit deletedAt filtering for broad queries unless we are sure.
        // But for safety:
        // if (!hasDeletedFilter) {
        //     query = query.where('deletedAt', '==', null); 
        // }
        // The above fails if mixed with other inequalities usually.
        // We will rely on application logic to check `deletedAt`.

        if (orderBy) {
            query = query.orderBy(orderBy.field, orderBy.dir);
        }

        if (limit) {
            query = query.limit(limit);
        }

        const snapshot = await query.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async update(id, data) {
        const docRef = this.collection.doc(id);
        const updateData = {
            ...data,
            updated_at: new Date().toISOString()
        };
        await docRef.update(updateData);
        // Return updated (need to fetch again or just merge in memory)
        return { id, ...updateData };
    }

    async delete(id, soft = true) {
        if (soft) {
            return this.update(id, { deletedAt: new Date().toISOString() });
        } else {
            return this.collection.doc(id).delete();
        }
    }

    async deleteWhere(field, value) {
        const snapshot = await this.collection.where(field, '==', value).get();
        if (snapshot.empty) return;

        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    }
}
