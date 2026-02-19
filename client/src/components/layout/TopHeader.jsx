import React from 'react';
import { Menu } from 'lucide-react';

export default function TopHeader({ toggleSidebar }) {
    return (
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 justify-between lg:hidden">
            <button
                onClick={toggleSidebar}
                className="p-2 -ml-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
                <Menu size={24} />
            </button>
            <span className="text-lg font-bold text-blue-600">ormmakurippu</span>
            <div className="w-10" /> {/* Spacer for centering if needed */}
        </header>
    );
}
