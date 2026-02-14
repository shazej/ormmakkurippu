import { db } from '../firebase.js';

export class AdminRepository {
    constructor() {
        this.tasksCollection = db.collection('tasks');
        this.auditLogsCollection = db.collection('audit_logs');
    }

    async getAllTasks(sort = { field: 'created_at', direction: 'desc' }) {
        const snapshot = await this.tasksCollection.orderBy(sort.field, sort.direction).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async deleteTask(id) {
        await this.tasksCollection.doc(id).delete();
        return { id };
    }

    async createTask(data, adminUid) {
        const ref = await this.tasksCollection.add({
            ...data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            createdBy: adminUid,
            deletedAt: null
        });
        return { id: ref.id, ...data };
    }

    async updateTask(id, data) {
        await this.tasksCollection.doc(id).update({
            ...data,
            updated_at: new Date().toISOString()
        });
        return { id, ...data };
    }

    async getAuditLogs(limit = 100) {
        const snapshot = await this.auditLogsCollection.orderBy('timestamp', 'desc').limit(limit).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
}
