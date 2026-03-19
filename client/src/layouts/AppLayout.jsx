/**
 * AppLayout
 *
 * Two-column layout: dark sidebar + white main panel.
 * Owns the state for all creation modals (task, project, folder)
 * and threads the openers down to Sidebar and children via context.
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import CreateTaskModal from '../components/CreateTaskModal';
import CreateProjectModal from '../components/CreateProjectModal';
import CreateFolderModal from '../components/CreateFolderModal';

// Mobile top bar — only shown on small screens
function MobileTopBar({ onToggleSidebar }) {
    return (
        <header className="lg:hidden h-[52px] bg-white border-b border-gray-200 flex items-center px-4 gap-3 shrink-0">
            <button
                onClick={onToggleSidebar}
                className="p-1.5 -ml-1 text-gray-500 hover:bg-gray-100 rounded-md"
                aria-label="Open navigation"
            >
                {/* Hamburger */}
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
            <span className="text-base font-bold text-gray-900">
                <span className="text-red-600">ormmak</span>kurippu
            </span>
        </header>
    );
}

export default function AppLayout() {
    const [sidebarOpen, setSidebarOpen]           = useState(false);
    const [createTaskOpen, setCreateTaskOpen]     = useState(false);
    const [createProjectOpen, setCreateProjectOpen] = useState(false);
    const [createFolderOpen, setCreateFolderOpen] = useState(false);
    const [tasks, setTasks]   = useState([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    // Close mobile sidebar on route change
    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    const fetchTasks = async (query = '') => {
        try {
            setLoading(true);
            const params = query ? { search: query } : {};
            const response = await axios.get('/api/tasks', { params });
            // API returns { success: true, data: [...] }
            setTasks(response.data?.data || response.data || []);
        } catch (err) {
            console.error('Error fetching tasks:', err);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    return (
        <div className="flex h-screen overflow-hidden bg-white">
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onOpenCreateTask={() => setCreateTaskOpen(true)}
                onOpenCreateProject={() => setCreateProjectOpen(true)}
                onOpenCreateFolder={() => setCreateFolderOpen(true)}
            />

            {/* Main panel */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <MobileTopBar onToggleSidebar={() => setSidebarOpen(o => !o)} />

                <main className="flex-1 overflow-y-auto bg-white">
                    <div
                        key={location.pathname}
                        className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in"
                    >
                        <Outlet context={{ tasks, fetchTasks, loading }} />
                    </div>
                </main>
            </div>

            {/* Creation modals */}
            <CreateTaskModal
                isOpen={createTaskOpen}
                onClose={() => setCreateTaskOpen(false)}
                onTaskCreated={fetchTasks}
            />
            <CreateProjectModal
                isOpen={createProjectOpen}
                onClose={() => setCreateProjectOpen(false)}
            />
            <CreateFolderModal
                isOpen={createFolderOpen}
                onClose={() => setCreateFolderOpen(false)}
            />
        </div>
    );
}
