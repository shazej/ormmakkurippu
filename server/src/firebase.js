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
        app = initializeApp();
    }
} else {
    app = getApps()[0];
}

export const db = getFirestore(app);
export const auth = getAuth(app);
