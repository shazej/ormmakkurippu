import { db } from '../../firebase.js';

export class ComplianceRepository {
    constructor() {
        this.collection = db.collection('compliance_certifications');
    }

    async create(data) {
        const docRef = this.collection.doc();
        const now = new Date().toISOString();
        const cert = {
            id: docRef.id,
            ...data,
            createdAt: now,
            updatedAt: now,
            active: true
        };
        await docRef.set(cert);
        return cert;
    }

    async findAll(filters = {}) {
        let query = this.collection;

        // Default: only active certs unless specified
        if (!filters.includeInactive) {
            query = query.where('active', '==', true);
        }

        if (filters.region) {
            query = query.where('region', '==', filters.region);
        }

        const snapshot = await query.get();
        if (snapshot.empty) return [];

        return snapshot.docs.map(doc => doc.data());
    }

    async findById(id) {
        const doc = await this.collection.doc(id).get();
        return doc.exists ? doc.data() : null;
    }

    async update(id, data) {
        const docRef = this.collection.doc(id);
        const now = new Date().toISOString();
        await docRef.update({
            ...data,
            updatedAt: now
        });
        return this.findById(id);
    }

    async delete(id) {
        // Soft delete
        await this.collection.doc(id).update({
            active: false,
            updatedAt: new Date().toISOString()
        });
        return { id, status: 'deleted' };
    }
}
