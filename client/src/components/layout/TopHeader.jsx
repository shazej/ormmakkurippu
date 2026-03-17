import { Menu } from 'lucide-react';

export default function TopHeader({ toggleSidebar }) {
    return (
        <header className="h-[52px] bg-white border-b border-gray-200 flex items-center px-4 gap-3 lg:hidden shrink-0">
            <button
                onClick={toggleSidebar}
                className="p-1.5 -ml-1 text-gray-500 hover:bg-gray-100 rounded-md"
                aria-label="Open navigation"
            >
                <Menu size={20} />
            </button>
            <span className="text-base font-bold text-gray-900">
                <span className="text-red-600">ormmak</span>kurippu
            </span>
        </header>
    );
}
