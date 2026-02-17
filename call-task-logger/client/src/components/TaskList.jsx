import React from 'react';
import { Pencil, Trash2, Calendar, User, Phone, Tag, AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

function StatusBadge({ status }) {
    const colors = {
        'New': 'bg-blue-100 text-blue-800',
        'In Progress': 'bg-yellow-100 text-yellow-800',
        'Done': 'bg-green-100 text-green-800',
    };
    return (
        <span className={cn("px-2 py-1 rounded-full text-xs font-semibold", colors[status] || 'bg-gray-100 text-gray-800')}>
            {status}
        </span>
    );
}

function PriorityBadge({ priority }) {
    const colors = {
        'High': 'text-red-600 font-bold',
        'Medium': 'text-yellow-600 font-medium',
        'Low': 'text-gray-500',
    };
    return (
        <span className={cn("text-xs uppercase tracking-wider", colors[priority])}>
            {priority} Priority
        </span>
    );
}

export function TaskList({ tasks, isLoading, error, onEdit, onDelete, onRestore }) {
    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-6 rounded-lg text-center flex flex-col items-center">
                <AlertCircle className="h-10 w-10 mb-2" />
                <p className="font-semibold">Error loading tasks</p>
                <p className="text-sm">{error}</p>
            </div>
        );
    }

    if (!Array.isArray(tasks)) {
        console.error('TaskList received non-array tasks:', tasks);
        return <div className="text-red-500">Error: Tasks data is not an array.</div>;
    }

    if (tasks.length === 0) {
        return (
            <div className="text-center py-20 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500 text-lg">No tasks found matching your filters.</p>
                <p className="text-sm text-gray-400">Try adjusting filters or create a new task.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4">
            {tasks.map((task) => (
                <div key={task.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <StatusBadge status={task.status} />
                            <PriorityBadge priority={task.priority} />
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(task.createdAt).toLocaleString()}
                        </div>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{task.description}</h3>

                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-1">
                            <User className="h-4 w-4 text-gray-400" />
                            {task.fromName}
                        </div>
                        {task.fromPhone && (
                            <div className="flex items-center gap-1">
                                <Phone className="h-4 w-4 text-gray-400" />
                                {task.fromPhone}
                            </div>
                        )}
                        <div className="flex items-center gap-1">
                            <Tag className="h-4 w-4 text-gray-400" />
                            {task.category}
                        </div>
                    </div>

                    {task.notes && (
                        <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-700 mb-4 border border-gray-100">
                            <p className="font-semibold text-xs text-gray-500 mb-1">NOTES</p>
                            {task.notes}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 border-t pt-3 mt-2">
                        {onRestore ? (
                            <Button variant="outline" size="sm" onClick={() => onRestore(task.id)} className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200">
                                <RotateCcw className="h-4 w-4 mr-1" /> Restore
                            </Button>
                        ) : (
                            <Button variant="outline" size="sm" onClick={() => onEdit(task)}>
                                <Pencil className="h-4 w-4 mr-1" /> Edit
                            </Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => onDelete(task.id)}>
                            <Trash2 className="h-4 w-4 mr-1" /> {onRestore ? "Delete Forever" : "Delete"}
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}
