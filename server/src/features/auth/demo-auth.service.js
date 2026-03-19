import jwt from 'jsonwebtoken';

// ─── Demo users ───────────────────────────────────────────────────────────────
// Fixed IDs ensure idempotent upserts across resets.
export const DEMO_USERS = {
    'owner@demo.local': {
        id: 'demo-owner-00000000-0000-0000-0000-000000000001',
        name: 'Demo Owner',
        role: 'ADMIN',
    },
    'member@demo.local': {
        id: 'demo-member-0000-0000-0000-000000000002',
        name: 'Demo Member',
        role: 'USER',
    },
    'demo@local.test': {
        id: 'demo-user-0000-0000-0000-000000000003',
        name: 'Demo User',
        role: 'USER',
    },
};

// ─── JWT helpers ──────────────────────────────────────────────────────────────
function getSecret() {
    const secret = process.env.DEMO_JWT_SECRET;
    if (!secret || secret === 'demo-secret-change-me') {
        if (process.env.NODE_ENV !== 'test') {
            console.warn(
                '[DEMO_AUTH] DEMO_JWT_SECRET is not set or uses default. ' +
                'Set a strong secret in your .env file.'
            );
        }
    }
    return secret || 'demo-secret-change-me';
}

/**
 * Sign a short-lived demo JWT for the given email.
 * @param {string} email - must be a key in DEMO_USERS
 * @returns {string} signed JWT
 */
export function signDemoToken(email) {
    const demoUser = DEMO_USERS[email];
    if (!demoUser) throw new Error(`Unknown demo user: ${email}`);

    return jwt.sign(
        {
            user_id: demoUser.id,
            email,
            demo: true,
        },
        getSecret(),
        { expiresIn: '7d' }
    );
}

/**
 * Verify a demo JWT. Returns payload or null (never throws).
 * @param {string} token
 * @returns {object|null}
 */
export function verifyDemoToken(token) {
    try {
        const payload = jwt.verify(token, getSecret());
        if (!payload.demo) return null;
        return payload;
    } catch {
        return null;
    }
}

/**
 * Check if running in local DB mode (USE_LOCAL_DB=true)
 */
function isLocalMode() {
    return process.env.USE_LOCAL_DB === 'true';
}

/**
 * Upsert a demo user using LocalDb (JSON file storage).
 * @param {string} email
 * @returns {Promise<object>} user record
 */
async function upsertDemoUserLocal(email) {
    const { LocalDb } = await import('../../local-db.js');
    const localDb = new LocalDb();
    const demoMeta = DEMO_USERS[email];
    const { id, name, role } = demoMeta;

    const usersCollection = localDb.collection('users');
    const userDoc = usersCollection.doc(id);
    const existing = await userDoc.get();

    const now = new Date().toISOString();

    if (!existing.exists) {
        const newUser = {
            id,
            primary_email_id: email,
            display_name: name,
            role,
            preferences: {},
            is_onboarded: false,
            onboarding_step: 1,
            created_at: now,
            updated_at: now,
        };
        await userDoc.set(newUser);
        console.log(`[DEMO_AUTH] Created demo user (local): ${email}`);
        return newUser;
    }

    const user = existing.data();
    if (user.display_name !== name) {
        await userDoc.update({ display_name: name, updated_at: now });
        return { ...user, display_name: name };
    }
    return user;
}

/**
 * Upsert a demo user using Prisma (PostgreSQL).
 * @param {string} email
 * @returns {Promise<object>} prisma User record
 */
async function upsertDemoUserPrisma(email) {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const demoMeta = DEMO_USERS[email];
    const { id, name, role } = demoMeta;

    const user = await prisma.$transaction(async (tx) => {
        let user = await tx.user.findUnique({ where: { id } });

        if (!user) {
            user = await tx.user.create({
                data: {
                    id,
                    primary_email_id: email,
                    display_name: name,
                    role,
                    preferences: {},
                    emails: {
                        create: {
                            email,
                            is_primary: true,
                            is_verified: true,
                        },
                    },
                },
            });
            console.log(`[DEMO_AUTH] Created demo user: ${email}`);
        } else if (user.display_name !== name) {
            user = await tx.user.update({
                where: { id },
                data: { display_name: name },
            });
        }

        // Activate pending workspace invites
        await tx.workspaceMember.updateMany({
            where: { email, status: 'PENDING' },
            data: { status: 'ACTIVE', user_id: id, joined_at: new Date() },
        });

        // Activate pending task assignments
        await tx.task.updateMany({
            where: { assigned_to_email: email, assigned_to_user_id: null, deleted_at: null },
            data: { assigned_to_user_id: id, assigned_to_email: null },
        });

        return user;
    });

    return user;
}

/**
 * Upsert a demo user into the database.  Idempotent — safe to call on every login.
 * Automatically uses LocalDb or Prisma based on USE_LOCAL_DB env var.
 * @param {string} email
 * @returns {Promise<object>} user record
 */
export async function upsertDemoUser(email) {
    const demoMeta = DEMO_USERS[email];
    if (!demoMeta) throw new Error(`Unknown demo user: ${email}`);

    if (isLocalMode()) {
        return upsertDemoUserLocal(email);
    }
    return upsertDemoUserPrisma(email);
}

/**
 * Find a demo user by ID from DB. Returns null if not found.
 * Used by auth middleware to lazy-load the user on each request.
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
export async function findDemoUserById(userId) {
    if (isLocalMode()) {
        const { LocalDb } = await import('../../local-db.js');
        const localDb = new LocalDb();
        const userDoc = localDb.collection('users').doc(userId);
        const snap = await userDoc.get();
        if (!snap.exists) return null;
        return snap.data();
    }

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    return prisma.user.findUnique({ where: { id: userId } });
}
