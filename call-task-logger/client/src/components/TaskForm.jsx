import React, { useState, useRef, useEffect } from 'react';
import { z } from 'zod';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Textarea } from './ui/Textarea';
import { Button } from './ui/Button';

// Zod Schema
const formSchema = z.object({
    fromName: z.string().trim().min(1, 'Name is required'),
    fromPhone: z.string().trim().optional(),
    category: z.enum(['Computer', 'Car', 'Home', 'Other']),
    priority: z.enum(['Low', 'Medium', 'High']),
    description: z.string().trim().min(1, 'Description is required'),
    notes: z.string().trim().optional(),
    status: z.enum(['New', 'In Progress', 'Done']),
    recurrenceRule: z.enum(['daily', 'weekly', 'monthly']).nullable().optional(),
    projectId: z.string().optional().nullable(),
});

export function TaskForm({ initialData, onSubmit, onCancel, isCallLogMode }) {
    const [formData, setFormData] = useState({
        fromName: initialData?.fromName || '',
        fromPhone: initialData?.fromPhone || '',
        category: initialData?.category || 'Other',
        priority: initialData?.priority || 'Medium',
        description: initialData?.description || '',
        notes: initialData?.notes || '',
        status: initialData?.status || 'New',
        recurrenceRule: initialData?.recurrenceRule || null,
        projectId: initialData?.projectId || '',
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [savedMessage, setSavedMessage] = useState(null);
    const fromNameRef = useRef(null);

    useEffect(() => {
        if (isCallLogMode && !isSubmitting) {
            // Small timeout to ensure modal transition or re-render is done
            setTimeout(() => fromNameRef.current?.focus(), 50);
        }
    }, [isCallLogMode, isSubmitting, savedMessage]);

    const handleKeyDown = (e) => {
        if (!isCallLogMode) return;

        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleSubmit(e);
            return;
        }

        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            const form = e.target.form;
            const index = Array.prototype.indexOf.call(form, e.target);
            // Move to next focusable element
            let nextIndex = index + 1;
            while (form.elements[nextIndex]) {
                if (form.elements[nextIndex].tabIndex !== -1 && !form.elements[nextIndex].disabled) {
                    form.elements[nextIndex].focus();
                    break;
                }
                nextIndex++;
            }
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error for this field when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault(); // e might be undefined if called programmatically, though here we always pass it? No wait, handleKeyDown calls it with e.
        setIsSubmitting(true);
        setErrors({});

        try {
            const validatedData = formSchema.parse(formData);
            await onSubmit(validatedData);

            if (isCallLogMode) {
                setSavedMessage("Task Saved!");
                // Reset form
                setFormData({
                    fromName: '',
                    fromPhone: '',
                    category: 'Other',
                    priority: 'Medium',
                    description: '',
                    notes: '',
                    status: 'New',
                    recurrenceRule: null,
                    projectId: '',
                });
                // Clear message after 2 seconds
                setTimeout(() => setSavedMessage(null), 2000);
            }
        } catch (err) {
            if (err instanceof z.ZodError) {
                const fieldErrors = {};
                err.errors.forEach(error => {
                    fieldErrors[error.path[0]] = error.message;
                });
                setErrors(fieldErrors);
            } else {
                // Re-throw or handle non-validation errors (App.jsx handles them usually, but we need to stop submitting)
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4" onKeyDown={handleKeyDown}>
            {savedMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded relative text-center font-bold mb-4">
                    {savedMessage}
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    label="From Name *"
                    name="fromName"
                    value={formData.fromName}
                    onChange={handleChange}
                    error={errors.fromName}
                    ref={fromNameRef}
                    autoFocus
                />
                <Input
                    label="Phone Number"
                    name="fromPhone"
                    value={formData.fromPhone}
                    onChange={handleChange}
                    error={errors.fromPhone}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                    label="Category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    error={errors.category}
                >
                    <option value="Computer">Computer</option>
                    <option value="Car">Car</option>
                    <option value="Home">Home</option>
                    <option value="Other">Other</option>
                </Select>

                <Select
                    label="Priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    error={errors.priority}
                >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                </Select>
            </div>

            <Select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                error={errors.status}
            >
                <option value="New">New</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
            </Select>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                    label="Recurrence"
                    name="recurrenceRule"
                    value={formData.recurrenceRule || ''}
                    onChange={handleChange}
                    error={errors.recurrenceRule}
                >
                    <option value="">None</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                </Select>

                {/* Project Selection would go here if we had the list of projects */}
                {/* For now, I'll just add the field if we have projects, but since it's simple recurrence request, let's stick to recurrence */}
            </div>

            <Textarea
                label="Description *"
                name="description"
                value={formData.description}
                onChange={handleChange}
                error={errors.description}
            />

            <Textarea
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                error={errors.notes}
            />

            <div className="flex justify-end gap-3 pt-4">
                <Button variant="ghost" type="button" onClick={onCancel} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                    {initialData ? 'Update Task' : 'Create Task'}
                </Button>
            </div>
        </form>
    );
}
