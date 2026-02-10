import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { LocalDb } from './local-db.js';

dotenv.config();

let app;

// Try to load service-account.json if it exists, otherwise rely on GOOGLE_APPLICATION_CREDENTIALS or default
const serviceAccountPath = path.join(process.cwd(), 'service-account.json');

let db;
let auth;

if (process.env.E2E_TEST_MODE === 'true') {
    console.log('🧪 E2E_TEST_MODE: Using LocalDb Mock');
    // @ts-ignore
    db = new LocalDb();

    // Mock Auth for E2E mode
    auth = {
        verifyIdToken: async (token) => {
            console.log('🧪 E2E_TEST_MODE: Mock Verifying Token:', token);
            if (token === 'e2e-magic-token') { // Matches mock token from index.js
                return { uid: 'test-e2e-user', email: 'test@example.com' };
            }
            throw new Error('Invalid mock token');
        },
        getUser: async (uid) => ({ uid, email: 'test@example.com' })
    };
} else {
    // REAL FIREBASE MODE
    if (!getApps().length) {
        if (fs.existsSync(serviceAccountPath)) {
            try {
                const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
                app = initializeApp({
                    credential: cert(serviceAccount)
                });
                console.log('✅ Firebase initialized with service-account.json');
            } catch (error) {
                console.error('❌ Error loading service-account.json:', error);
                // Fallback to ADC
                app = initializeApp();
            }
        } else {
            console.log('ℹ️ No service-account.json found, checking for ADC or env vars');
            app = initializeApp({
                projectId: process.env.GOOGLE_PROJECT_ID || process.env.PROJECT_ID || 'ormmakurippu-cb4bc'
            });
        }
    } else {
        app = getApps()[0];
    }

    db = getFirestore(app);
    auth = getAuth(app);
}

export { db, auth };

