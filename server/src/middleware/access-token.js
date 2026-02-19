import { OAuth2Client } from 'google-auth-library';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/app-error.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const prisma = new PrismaClient();

export const verifyGoogleToken = async (req, res, next) => {
    try {
        let token;
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.cookies && req.cookies.session) {
            token = req.cookies.session;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized: No token provided'
            });
        }

        // 1. Verify Google Token
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        const { sub: google_uid, email, name, picture } = payload;

        // 2. Find or Create User in Prisma
        let user = await prisma.user.findUnique({
            where: { google_uid },
            include: { allowed_ips: true, geofence: true } // Include security settings
        });

        if (!user) {
            // Check if user exists by email (legacy/manual creation)
            const existingByEmail = await prisma.user.findUnique({
                where: { primary_email_id: email }
            });

            if (existingByEmail) {
                // Link Google UID to existing user
                user = await prisma.user.update({
                    where: { id: existingByEmail.id },
                    data: { google_uid },
                    include: { allowed_ips: true, geofence: true }
                });
            } else {
                // Create new user
                user = await prisma.user.create({
                    data: {
                        google_uid,
                        primary_email_id: email,
                        role: 'USER', // Default role
                        preferences: {},
                        emails: {
                            create: {
                                email: email,
                                is_primary: true,
                                is_verified: payload.email_verified || false
                            }
                        }
                    },
                    include: { allowed_ips: true, geofence: true }
                });
                console.log(`[Auth] Created new user: ${email} (${user.id})`);
            }
        }

        // 3. Attach to Request
        req.user = {
            uid: user.id, // Internal ID
            google_uid: user.google_uid,
            email: user.primary_email_id,
            role: user.role,
            name: name,
            picture: picture,
            // Pass full user object if needed for policies
            _dbUser: user
        };

        next();
    } catch (error) {
        console.error('Auth Error:', error);
        return res.status(401).json({
            success: false,
            error: 'Unauthorized: Invalid token'
        });
    }
};
