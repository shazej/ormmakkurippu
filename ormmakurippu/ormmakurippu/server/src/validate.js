import { z } from 'zod';
import { Categories, Priorities, Statuses } from './schema.js';

export const taskSchema = z.object({
    fromName: z.string().min(1, "From Name is required"),
    fromPhone: z.string().optional().nullable(),
    category: z.nativeEnum(Categories).default(Categories.OTHER),
    priority: z.nativeEnum(Priorities).default(Priorities.MEDIUM),
    description: z.string().min(1, "Description is required"),
    notes: z.string().optional().nullable(),
    status: z.nativeEnum(Statuses).default(Statuses.NEW),
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
