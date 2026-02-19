import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';

export default function MainContent({ context }) {
    const location = useLocation();

    return (
        <main className="flex-1 overflow-y-auto bg-white">
            <div
                key={location.pathname}
                className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 transition-opacity duration-300 ease-in-out animate-fade-in"
            >
                <Outlet context={context} />
            </div>
        </main>
    );
}
