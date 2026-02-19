import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { LocalDb } from './local-db.js';

dotenv.config();

let app;
let db;
let auth;

// Helper for safe logging
const logStartup = (provider, mode, status) => {
    console.log(JSON.stringify({
        event: 'startup_db_config',
        provider,
        mode,
        status,
        timestamp: new Date().toISOString()
    }));
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const initializeFirestoreWithRetry = async (retries = 0) => {
    try {
        if (!getApps().length) {
            const options = {
                projectId: process.env.GOOGLE_PROJECT_ID || process.env.PROJECT_ID || 'ormmakurippu-cb4bc'
            };

            // Optional: Load service account if available and not using ADC
            const serviceAccountPath = path.join(process.cwd(), 'service-account.json');
            if (fs.existsSync(serviceAccountPath)) {
                // We let ADC handle it if possible, but if file exists we could use it. 
                // Standard practice for Cloud Run is ADC. keeping simple.
            }

            app = initializeApp(options);
        } else {
            app = getApps()[0];
        }

        const firestore = getFirestore(app);
        // Test connection
        await firestore.listCollections();

        return {
            db: firestore,
            auth: getAuth(app)
        };
    } catch (error) {
        if (retries < MAX_RETRIES) {
            console.warn(`Firestore initialization attempt ${retries + 1} failed. Retrying...`);
            await new Promise(res => setTimeout(res, RETRY_DELAY));
            return initializeFirestoreWithRetry(retries + 1);
        }
        throw error;
    }
};

const init = async () => {
    const isProduction = process.env.NODE_ENV === 'production';
    const useLocalDb = process.env.USE_LOCAL_DB === 'true';

    // 1. Forced LocalDb Mode
    if (useLocalDb) {
        logStartup('localdb', process.env.NODE_ENV || 'development', 'forced_local');
        console.log('ℹ️  USE_LOCAL_DB=true: Using LocalDb (JSON File Storage)');
        db = new LocalDb();
        auth = getMockAuth('local-user');
        return;
    }

    // 2. Firestore Mode
    try {
        console.log('ℹ️  Attempting to initialize Firestore...');
        const firebaseServices = await initializeFirestoreWithRetry();
        db = firebaseServices.db;
        auth = firebaseServices.auth;
        logStartup('firestore', process.env.NODE_ENV || 'development', 'success');
        console.log('✅ Firestore initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing Firestore:', error.message);

        // 3. Fallback Logic
        if (isProduction) {
            console.error('🚨 CRITICAL: Firestore failed in PRODUCTION. Failing fast.');
            logStartup('firestore', 'production', 'failed_fatal');
            process.exit(1); // Fail fast in production
        } else {
            console.warn('⚠️  Firestore failed. Falling back to LocalDb (Non-Production Safe Mode).');
            logStartup('localdb', process.env.NODE_ENV || 'development', 'fallback');
            db = new LocalDb();
            auth = getMockAuth('fallback-user');
        }
    }
};

// Mock Auth Helper
const getMockAuth = (uidPrefix) => ({
    verifyIdToken: async (token) => {
        console.log(`[MockAuth] Verifying token: ${token ? '****' : 'null'}`);
        return { uid: `${uidPrefix}-123`, email: `${uidPrefix}@example.com` };
    },
    getUser: async (uid) => ({ uid, email: `${uidPrefix}@example.com` }),
    getUserByEmail: async (email) => ({ uid: `${uidPrefix}-123`, email }),
    createUser: async (props) => ({ uid: `${uidPrefix}-${Date.now()}`, ...props }),
    generatePasswordResetLink: async (email) => `http://localhost:4000/mock/reset?email=${email}`,
    generateEmailVerificationLink: async (email) => `http://localhost:4000/mock/verify?email=${email}`,
    updateUser: async (uid, props) => ({ uid, ...props })
});

// Top-level await is supported in modules, but to be safe with all bundlers/envs, 
// we initialize synchronously where possible or handle the promise in app startup.
// Since we export db/auth, we need them to be ready. 
// For this architecture, we'll run init() immediately but exports might be checked after.
// NOTE: This pattern requires the app to wait for DB. 'index.js' imports this.
// We will export a promise or rely on synchronous/lazy instantiation if needed.
// Given the existing structure, `db` and `auth` are exported directly. 
// We will switch to exporting a `getDb` or `initDb` function, OR block top level.
// Blocking top level await:
await init();

export { db, auth };
