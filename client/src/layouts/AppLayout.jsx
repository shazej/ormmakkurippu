import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AppLayout() {
    const { user, logout } = useAuth();
    const location = useLocation();

    const navItems = [
        { path: '/app', label: 'Inbox', icon: '📥' },
        { path: '/app/today', label: 'Today', icon: '📅' },
        { path: '/app/calls', label: 'Call Log', icon: '📞' },
        { path: '/app/projects', label: 'Projects', icon: 'fyp' }, // Placeholder icon
    ];

    return (
        <div className="flex h-screen bg-white">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
                <div className="p-4 flex items-center gap-2 border-b border-gray-100">
                    <span className="text-xl font-bold text-blue-600">ormmakurippu</span>
                </div>

                <div className="p-2 flex-1 overflow-y-auto">
                    <nav className="space-y-1">
                        {navItems.map(item => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === item.path
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                <span className="text-lg">{item.icon}</span>
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="mt-8 px-3">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Workspaces</h3>
                        <div className="space-y-1">
                            {/* Placeholder for workspaces list */}
                            <div className="flex items-center gap-2 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded cursor-pointer">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                My Workspace
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center gap-3">
                        {user?.picture ? (
                            <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                                {user?.name?.[0] || 'U'}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                            <button onClick={logout} className="text-xs text-red-500 hover:text-red-700">Logout</button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-white">
                <div className="max-w-4xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
