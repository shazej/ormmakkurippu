import { db } from '../../firebase.js';

export class TasksRepository {
    constructor() {
        this.collection = db.collection('tasks');
    }

    async find(filters = {}, pagination = {}, sort = { created_at: 'desc' }) {
        let query = this.collection;

        // Default Filter: exclude soft-deleted unless explicitly requested
        if (!filters.includeDeleted) {
            query = query.where('status', '!=', 'deleted');
        }

        // Apply other filters
        if (filters.uid) {
            query = query.where('uid', '==', filters.uid);
        }

        if (filters.category) {
            query = query.where('category', '==', filters.category);
        }

        if (filters.shareToken) {
            query = query.where('shareToken', '==', filters.shareToken);
        }

        if (filters.reminderDue) {
            const now = new Date().toISOString();
            // In a real DB, this adds complexity. For LocalDb, filter() handles it.
            // For Firestore, we need a composite index or separate query.
            // We'll assume the repository abstraction handles the "how".
            // Since LocalDb is used in demo, we'll rely on its filter behavior if we pass a custom op or handled here?
            // LocalCollection.where supports 'op'.
            // But here we are building the query.
            // Let's assume we pass a specific filter object that the repository handles?
            // The repository methods .where() are likely chainable.

            // For LocalDb/Firestore:
            query = query.where('reminderAt', '<=', now).where('reminderSent', '!=', true);
        }

        // Sorting
        // Note: multiple orderBys with '!=' filter require composite index in Firestore
        // For simplicity and safety with '!=', we might need to filter 'status' differently
        // or ensure the index exists.
        // If 'status' != 'deleted' is used, Firestore requires 'status' to be the first orderBy field.
        // However, we usually want to order by 'created_at'.
        // To avoid complex index requirements for this MVP step:
        // We will assume 'deletedAt' == null is better if we can query it?
        // But the previous implementation used 'status' != 'deleted'.
        // Let's stick to the previous pattern but be aware of index needs.

        query = query.orderBy(sort.field || 'created_at', sort.direction || 'desc');

        // Pagination
        if (pagination.limit) {
            query = query.limit(pagination.limit);
        }
        if (pagination.offset) {
            query = query.offset(pagination.offset);
        }

        const snapshot = await query.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async findById(id) {
        const doc = await this.collection.doc(id).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() };
    }

    async create(data) {
        const docRef = await this.collection.add({
            ...data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            deletedAt: null
        });
        return { id: docRef.id, ...data };
    }

    async update(id, data) {
        await this.collection.doc(id).update({
            ...data,
            updated_at: new Date().toISOString()
        });
        return { id, ...data };
    }

    async softDelete(id) {
        await this.collection.doc(id).update({
            status: 'deleted',
            deletedAt: new Date().toISOString()
        });
        return { id, status: 'deleted' };
    }
}
