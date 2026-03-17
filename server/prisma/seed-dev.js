/**
 * Dev-only seed script.
 * Creates a fully-onboarded local test user for password-based login.
 *
 * Usage:
 *   cd server
 *   node prisma/seed-dev.js
 *
 * Credentials created:
 *   Email:    dev@example.com
 *   Password: Dev@123456
 */
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load .env from server directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

const DEV_EMAIL    = 'dev@example.com';
const DEV_PASSWORD = 'Dev@123456';
const DEV_NAME     = 'Dev User';

async function main() {
    console.log('🌱  Dev seed starting…');

    // ── 1. Hash password ─────────────────────────────────────────────────────
    const password_hash = await argon2.hash(DEV_PASSWORD, { type: argon2.argon2id });

    // ── 2. Upsert dev user ───────────────────────────────────────────────────
    const existing = await prisma.user.findUnique({
        where: { primary_email_id: DEV_EMAIL },
    });

    let user;
    if (existing) {
        console.log(`ℹ️   User ${DEV_EMAIL} already exists — updating password + marking onboarded.`);
        user = await prisma.user.update({
            where: { id: existing.id },
            data: {
                password_hash,
                display_name:    existing.display_name || DEV_NAME,
                is_onboarded:    true,
                onboarding_step: 4,
                role:            'USER',
                // Remove google_uid so check-provider returns 'password', not 'google'
                google_uid: null,
            },
        });
    } else {
        user = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    display_name:     DEV_NAME,
                    primary_email_id: DEV_EMAIL,
                    password_hash,
                    role:             'USER',
                    is_onboarded:     true,
                    onboarding_step:  4,
                    preferences:      {},
                    emails: {
                        create: {
                            email:       DEV_EMAIL,
                            is_primary:  true,
                            is_verified: true,
                        },
                    },
                },
            });
            return newUser;
        });
    }

    // ── 3. Ensure a default workspace ────────────────────────────────────────
    let workspace = await prisma.workspace.findFirst({
        where: { owner_user_id: user.id },
    });

    if (!workspace) {
        workspace = await prisma.workspace.create({
            data: {
                owner_user_id: user.id,
                name:          `${DEV_NAME}'s Workspace`,
            },
        });
        // Add the owner as an ACTIVE OWNER member
        await prisma.workspaceMember.create({
            data: {
                workspace_id: workspace.id,
                user_id:      user.id,
                email:        DEV_EMAIL,
                role:         'OWNER',
                status:       'ACTIVE',
                joined_at:    new Date(),
            },
        });
    }

    // Set default_workspace_id if not already set
    if (!user.default_workspace_id) {
        await prisma.user.update({
            where: { id: user.id },
            data:  { default_workspace_id: workspace.id },
        });
    }

    // ── 4. Summary ────────────────────────────────────────────────────────────
    console.log('\n✅  Dev seed complete!\n');
    console.log('  ┌─────────────────────────────────────────┐');
    console.log('  │  LOCAL TEST CREDENTIALS                  │');
    console.log('  │                                          │');
    console.log(`  │  Email:    ${DEV_EMAIL.padEnd(30)}│`);
    console.log(`  │  Password: ${DEV_PASSWORD.padEnd(30)}│`);
    console.log('  │                                          │');
    console.log('  │  Login at: http://localhost:5173/login   │');
    console.log('  └─────────────────────────────────────────┘\n');
}

main()
    .catch(e => { console.error('❌  Seed failed:', e.message); process.exit(1); })
    .finally(() => prisma.$disconnect());
