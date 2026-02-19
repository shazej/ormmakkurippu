import { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import TopHeader from '../components/layout/TopHeader';
import MainContent from '../components/layout/MainContent';

export default function AppLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setIsSidebarOpen(false);

    return (
        <div className="flex h-screen bg-white">
            <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

            <div className="flex-1 flex flex-col min-w-0">
                <TopHeader toggleSidebar={toggleSidebar} />
                <MainContent />
            </div>
        </div>
    );
}
