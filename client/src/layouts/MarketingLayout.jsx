import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function MarketingLayout() {
    const { user, login } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans text-gray-900">
            {/* Navbar */}
            <header className="fixed w-full bg-white/95 backdrop-blur-sm z-50 border-b border-transparent transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo */}
                        <div className="flex-shrink-0 flex items-center">
                            <Link to="/" className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-red-600 tracking-tight">ormmakurippu</span>
                            </Link>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex space-x-8">
                            <Link to="#" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Made for</Link>
                            <Link to="#" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Resources</Link>
                            <Link to="#" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Pricing</Link>
                        </nav>

                        {/* Right Side Actions */}
                        <div className="hidden md:flex items-center space-x-4">
                            {user ? (
                                <Link to="/app" className="bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm">
                                    Go to App
                                </Link>
                            ) : (
                                <>
                                    <button onClick={() => login()} className="text-gray-600 hover:text-gray-900 font-medium px-3 py-2 transition-colors">
                                        Log in
                                    </button>
                                    <button onClick={() => login()} className="bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm">
                                        Start for free
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden flex items-center">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="text-gray-600 hover:text-gray-900 p-2 rounded-md focus:outline-none"
                            >
                                <span className="sr-only">Open main menu</span>
                                {/* Icon menu */}
                                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden bg-white border-t border-gray-100 shadow-lg absolute w-full">
                        <div className="px-4 pt-2 pb-6 space-y-2">
                            <Link to="#" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Made for</Link>
                            <Link to="#" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Resources</Link>
                            <Link to="#" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Pricing</Link>
                            <div className="border-t border-gray-100 my-2 pt-2">
                                {user ? (
                                    <Link to="/app" className="block w-full text-center px-4 py-3 rounded-md text-white bg-red-600 hover:bg-red-700 font-medium">
                                        Go to App
                                    </Link>
                                ) : (
                                    <>
                                        <button onClick={() => login()} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Log in</button>
                                        <button onClick={() => login()} className="block w-full text-center px-4 py-3 mt-2 rounded-md text-white bg-red-600 hover:bg-red-700 font-medium">
                                            Start for free
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-grow pt-20">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-gray-50 border-t border-gray-200 pt-16 pb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
                        <div className="col-span-2">
                            <Link to="/" className="flex items-center gap-2 mb-4">
                                <span className="text-xl font-bold text-red-600">ormmakurippu</span>
                            </Link>
                            <p className="text-gray-500 text-sm max-w-xs mb-6">
                                Join millions of people who organize work and life with Ormmakurippu.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 mb-4">Features</h3>
                            <ul className="space-y-3 text-sm text-gray-600">
                                <li><Link to="#" className="hover:text-red-600">How it works</Link></li>
                                <li><Link to="#" className="hover:text-red-600">For Teams</Link></li>
                                <li><Link to="#" className="hover:text-red-600">Pricing</Link></li>
                                <li><Link to="#" className="hover:text-red-600">Templates</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 mb-4">Resources</h3>
                            <ul className="space-y-3 text-sm text-gray-600">
                                <li><Link to="#" className="hover:text-red-600">Download Apps</Link></li>
                                <li><Link to="#" className="hover:text-red-600">Help Center</Link></li>
                                <li><Link to="#" className="hover:text-red-600">Productivity Methods</Link></li>
                                <li><Link to="#" className="hover:text-red-600">Integrations</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
                            <ul className="space-y-3 text-sm text-gray-600">
                                <li><Link to="#" className="hover:text-red-600">About Us</Link></li>
                                <li><Link to="#" className="hover:text-red-600">Careers</Link></li>
                                <li><Link to="#" className="hover:text-red-600">Blog</Link></li>
                                <li><Link to="#" className="hover:text-red-600">Contact</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-gray-400 text-sm">
                            &copy; {new Date().getFullYear()} Ormmakurippu. All rights reserved.
                        </div>
                        <div className="flex gap-6 text-gray-400">
                            <Link to="#" className="hover:text-gray-600 text-xl"><i className="fab fa-twitter"></i></Link>
                            <Link to="#" className="hover:text-gray-600 text-xl"><i className="fab fa-github"></i></Link>
                            <Link to="#" className="hover:text-gray-600 text-xl"><i className="fab fa-facebook"></i></Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
