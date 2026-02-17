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
        getUser: async (uid) => ({ uid, email: 'test@example.com' }),

        // Added mocks for Phase 2 features
        generatePasswordResetLink: async (email) => `http://localhost:4000/mock/reset-password?email=${email}`,
        generateEmailVerificationLink: async (email) => `http://localhost:4000/mock/verify-email?email=${email}`,
        updateUser: async (uid, properties) => {
            console.log(`[Mock Auth] Updated user ${uid}:`, properties);
            return { uid, ...properties };
        }
    };
} else {
    // REAL FIREBASE MODE
    if (process.env.USE_LOCAL_DB === 'true') {
        console.log('ℹ️  USE_LOCAL_DB=true: Using LocalDb (JSON File Storage)');
        // @ts-ignore
        db = new LocalDb();

        // Mock Auth for LocalDb mode (since we don't have Firebase Admin)
        auth = {
            verifyIdToken: async (token) => {
                // For demo/local-db mode, we might trust any token or a specific debug token
                // Or we can just decode it if it's a real jwt but verification fails without keys?
                // For now, let's treat it similar to E2E but maybe log a warning.
                console.log('⚠️  LocalDb Mode: Mock verifying token:', token);
                return { uid: 'local-user', email: 'user@local.dev' };
            },
            getUser: async (uid) => ({ uid, email: 'user@local.dev' }),
            getUserByEmail: async (email) => ({ uid: 'local-user', email }),
            createUser: async (props) => ({ uid: 'local-user', ...props })
        };
    } else {
        if (!getApps().length) {
            try {
                console.log('ℹ️  Initializing Firebase (relying on GOOGLE_APPLICATION_CREDENTIALS or ADC)...');
                app = initializeApp({
                    projectId: process.env.GOOGLE_PROJECT_ID || process.env.PROJECT_ID || 'ormmakurippu-cb4bc'
                });
                console.log('✅ Firebase initialized successfully');
                db = getFirestore(app);
                auth = getAuth(app);
            } catch (error) {
                console.error('❌ Error initializing Firebase:', error);
                console.log('⚠️  Falling back to LocalDb due to initialization error...');
                db = new LocalDb();
                auth = {
                    verifyIdToken: async () => ({ uid: 'fallback-user', email: 'fallback@error.dev' }),
                    getUser: async (uid) => ({ uid, email: 'fallback@error.dev' })
                };
            }
        } else {
            app = getApps()[0];
            db = getFirestore(app);
            auth = getAuth(app);
        }
    }
}

export { db, auth };

