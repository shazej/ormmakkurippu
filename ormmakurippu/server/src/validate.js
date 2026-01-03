import { z } from 'zod';
import { Categories, Priorities, Statuses } from './schema.js';

export const taskSchema = z.object({
    title: z.string().min(1, "Title is required"),
    fromName: z.string().optional().nullable(),
    fromPhone: z.string().optional().nullable(),
    category: z.nativeEnum(Categories).default(Categories.GENERAL),
    priority: z.nativeEnum(Priorities).default(Priorities.MEDIUM),
    description: z.string().optional().nullable(), // Description can be optional if title is there
    notes: z.string().optional().nullable(),
    status: z.nativeEnum(Statuses).default(Statuses.PENDING),
    attachments: z.array(z.object({
        provider: z.string(),
        fileId: z.string(),
        name: z.string(),
        mimeType: z.string(),
        size: z.union([z.number(), z.string()]).optional(),
        webViewLink: z.string().optional(),
        createdAt: z.union([z.number(), z.string()]).optional()
    })).optional().default([]),
});

export const validate = (schema) => (req, res, next) => {
    try {
        const result = schema.parse(req.body);
        req.body = result; // specific assignment to sanitized body
        next();
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ errors: err.errors });
        }
        next(err);
    }
};
