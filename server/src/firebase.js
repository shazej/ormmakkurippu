import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

let app;

// Try to load service-account.json if it exists, otherwise rely on GOOGLE_APPLICATION_CREDENTIALS or default
const serviceAccountPath = path.join(process.cwd(), 'service-account.json');

if (!getApps().length) {
    if (fs.existsSync(serviceAccountPath)) {
        try {
            const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
            app = initializeApp({
                credential: cert(serviceAccount)
            });
            console.log('Firebase initialized with service-account.json');
        } catch (error) {
            console.error('Error loading service-account.json:', error);
            app = initializeApp();
        }
    } else {
        console.log('No service-account.json found, using default credentials');
        app = initializeApp({
            projectId: process.env.GOOGLE_PROJECT_ID || process.env.PROJECT_ID
        });
    }
} else {
    app = getApps()[0];
}

import { LocalDb } from './local-db.js';

export const db = (!process.env.GOOGLE_PROJECT_ID && !process.env.PROJECT_ID && !fs.existsSync(serviceAccountPath))
    ? new LocalDb()
    : getFirestore(app);

if ((!process.env.GOOGLE_PROJECT_ID && !process.env.PROJECT_ID && !fs.existsSync(serviceAccountPath))) {
    console.warn('⚠️  WARNING: Using Local JSON Database Mode (data/tasks.json)');
}

export const auth = getAuth(app);
