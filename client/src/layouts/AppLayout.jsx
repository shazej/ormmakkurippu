import { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/layout/Sidebar';
import TopHeader from '../components/layout/TopHeader';
import MainContent from '../components/layout/MainContent';
import CreateTaskModal from '../components/CreateTaskModal';

export default function AppLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setIsSidebarOpen(false);

    const fetchTasks = async (query = '') => {
        try {
            setLoading(true);
            const params = {};
            if (query) params.search = query;
            const response = await axios.get('/api/tasks', { params });
            setTasks(response.data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    return (
        <div className="flex h-screen bg-white">
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={closeSidebar}
                onOpenCreateTask={() => setIsCreateModalOpen(true)}
            />

            <div className="flex-1 flex flex-col min-w-0">
                <TopHeader toggleSidebar={toggleSidebar} />
                <MainContent context={{ tasks, fetchTasks, loading }} />
            </div>

            <CreateTaskModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onTaskCreated={fetchTasks}
            />
        </div>
    );
}
