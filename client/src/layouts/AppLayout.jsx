import { useState, useEffect } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/layout/Sidebar';
import TopHeader from '../components/layout/TopHeader';
import CreateTaskModal from '../components/CreateTaskModal';
import CreateProjectModal from '../components/CreateProjectModal';
import CreateFolderModal from '../components/CreateFolderModal';

export default function AppLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [createTaskOpen, setCreateTaskOpen] = useState(false);
    const [createProjectOpen, setCreateProjectOpen] = useState(false);
    const [createFolderOpen, setCreateFolderOpen] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    const toggleSidebar = () => setIsSidebarOpen(o => !o);
    const closeSidebar = () => setIsSidebarOpen(false);

    // Close mobile sidebar on route change
    useEffect(() => { closeSidebar(); }, [location.pathname]);

    const fetchTasks = async (query = '') => {
        try {
            setLoading(true);
            const params = {};
            if (query) params.search = query;
            const response = await axios.get('/api/tasks', { params });
            setTasks(response.data?.data || response.data || []);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTasks(); }, []);

    return (
        <div className="flex h-screen bg-white">
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={closeSidebar}
                onOpenCreateTask={() => setCreateTaskOpen(true)}
                onOpenCreateProject={() => setCreateProjectOpen(true)}
                onOpenCreateFolder={() => setCreateFolderOpen(true)}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopHeader toggleSidebar={toggleSidebar} />
                <main className="flex-1 overflow-y-auto bg-white">
                    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                        <Outlet context={{ tasks, fetchTasks, loading }} />
                    </div>
                </main>
            </div>

            <CreateTaskModal
                isOpen={createTaskOpen}
                onClose={() => setCreateTaskOpen(false)}
                onTaskCreated={fetchTasks}
            />
            <CreateProjectModal
                isOpen={createProjectOpen}
                onClose={() => setCreateProjectOpen(false)}
                onCreated={() => {}}
            />
            <CreateFolderModal
                isOpen={createFolderOpen}
                onClose={() => setCreateFolderOpen(false)}
                onCreated={() => {}}
            />
        </div>
    );
}
