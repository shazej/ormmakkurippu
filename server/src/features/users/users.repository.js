import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class UsersRepository {
    async findById(id) {
        return prisma.user.findUnique({
            where: { id }
        });
    }

    async findByEmail(email) {
        return prisma.user.findUnique({
            where: { primary_email_id: email }
        });
    }

    async create(data) {
        return prisma.user.create({
            data
        });
    }

    async update(id, data) {
        return prisma.user.update({
            where: { id },
            data
        });
    }

    async createOrUpdateGoogleUser(googleProfile, tx) {
        const db = tx || prisma;
        const { google_uid, email, name, picture, email_verified } = googleProfile;

        // 1. Try to find by Google UID
        let user = await db.user.findUnique({
            where: { google_uid },
            include: { allowed_ips: true, geofence: true }
        });

        if (user) {
            // Update profile if changed (optional, but good for keeping sync)
            if (user.display_name !== name || user.avatar_url !== picture) {
                user = await db.user.update({
                    where: { id: user.id },
                    data: {
                        display_name: name || user.display_name,
                        avatar_url: picture || user.avatar_url
                    },
                    include: { allowed_ips: true, geofence: true }
                });
            }
            return user;
        }

        // 2. Try to find by Email (Legacy/Manual linkage)
        const existingByEmail = await db.user.findUnique({
            where: { primary_email_id: email },
            include: { allowed_ips: true, geofence: true }
        });

        if (existingByEmail) {
            // Link Google UID
            user = await db.user.update({
                where: { id: existingByEmail.id },
                data: {
                    google_uid,
                    display_name: existingByEmail.display_name || name,
                    avatar_url: existingByEmail.avatar_url || picture
                },
                include: { allowed_ips: true, geofence: true }
            });
        } else {
            // 3. Create New User
            user = await db.user.create({
                data: {
                    google_uid,
                    primary_email_id: email,
                    display_name: name,
                    avatar_url: picture,
                    role: 'USER',
                    preferences: {},
                    emails: {
                        create: {
                            email: email,
                            is_primary: true,
                            is_verified: email_verified || false
                        }
                    }
                },
                include: { allowed_ips: true, geofence: true }
            });

            // Link pending tasks
            await db.task.updateMany({
                where: { assigned_to_email: email },
                data: {
                    assigned_to_user_id: user.id,
                    assigned_to_email: null
                }
            });
        }

        return user;
    }
}
