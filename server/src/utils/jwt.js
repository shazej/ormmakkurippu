/**
 * Thin wrapper around jsonwebtoken with a consistent signing/verification API.
 * Used for email-password session tokens.
 * Google ID tokens are still verified separately via verifyFirebaseToken middleware.
 */
import jwt from 'jsonwebtoken';

const SECRET  = process.env.JWT_SECRET  || 'dev-secret-change-in-production';
const EXPIRES = process.env.JWT_EXPIRES || '7d';

export const signToken = (payload) =>
    jwt.sign(payload, SECRET, { expiresIn: EXPIRES, algorithm: 'HS256' });

export const verifyToken = (token) =>
    jwt.verify(token, SECRET);   // throws if invalid/expired
