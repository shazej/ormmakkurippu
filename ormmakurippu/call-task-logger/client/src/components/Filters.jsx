import React from 'react';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { RotateCcw } from 'lucide-react';

export function Filters({ filters, setFilters, onReset }) {
    const handleChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6 space-y-4 md:space-y-0 md:flex md:gap-4 md:items-end">
            <div className="flex-1 min-w-[200px]">
                <Input
                    label="Search"
                    placeholder="Search by name, desc..."
                    value={filters.search}
                    onChange={(e) => handleChange('search', e.target.value)}
                />
            </div>
            <div className="w-full md:w-40">
                <Select
                    label="Category"
                    value={filters.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                >
                    <option value="">All Categories</option>
                    <option value="Computer">Computer</option>
                    <option value="Car">Car</option>
                    <option value="Home">Home</option>
                    <option value="Other">Other</option>
                </Select>
            </div>
            <div className="w-full md:w-40">
                <Select
                    label="Priority"
                    value={filters.priority}
                    onChange={(e) => handleChange('priority', e.target.value)}
                >
                    <option value="">All Priorities</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                </Select>
            </div>
            <div className="w-full md:w-40">
                <Select
                    label="Status"
                    value={filters.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                >
                    <option value="">All Statuses</option>
                    <option value="New">New</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                </Select>
            </div>
            <Button variant="outline" onClick={onReset} className="w-full md:w-auto" title="Reset Filters">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
            </Button>
            <div className="w-full md:w-auto border-l pl-4 ml-2">
                <Button
                    variant={filters.includeDeleted ? "default" : "ghost"}
                    className={filters.includeDeleted ? "bg-red-600 hover:bg-red-700 text-white" : "text-gray-500"}
                    onClick={() => handleChange('includeDeleted', !filters.includeDeleted)}
                >
                    {filters.includeDeleted ? "Back to Active" : "Trash"}
                </Button>
            </div>
        </div>
    );
}
