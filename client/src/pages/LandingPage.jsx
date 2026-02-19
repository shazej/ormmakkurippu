import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
    const { user, login } = useAuth();

    useEffect(() => {
        document.title = "Ormmakurippu - Organize your work and life";
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.content = "Ormmakurippu is a modern task manager that helps you organize your work, track calls, and collaborate with your team.";
        } else {
            const meta = document.createElement('meta');
            meta.name = "description";
            meta.content = "Ormmakurippu is a modern task manager that helps you organize your work, track calls, and collaborate with your team.";
            document.head.appendChild(meta);
        }
    }, []);

    return (
        <div className="bg-white text-gray-900 font-sans">
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
                        {/* Text Content */}
                        <div className="lg:col-span-6 text-center lg:text-left mb-12 lg:mb-0">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 mb-6 leading-tight">
                                Organize your <br className="hidden lg:block" />
                                work and life, <br className="hidden lg:block" />
                                <span className="text-red-600">finally.</span>
                            </h1>
                            <p className="text-lg/relaxed sm:text-xl/relaxed text-gray-500 mb-10 max-w-2xl mx-auto lg:mx-0">
                                Become focused, organized, and calm with Ormmakurippu. The world’s #1 task manager and to-do list app.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                {user ? (
                                    <Link to="/app" className="bg-red-600 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-red-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                                        Go to App
                                    </Link>
                                ) : (
                                    <>
                                        <button onClick={() => login()} className="bg-red-600 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-red-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                                            Start for free
                                        </button>
                                        <div className="hidden sm:flex items-center text-gray-500 text-sm font-medium">
                                            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            Free forever plan
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Hero Image / Mockup */}
                        <div className="lg:col-span-6 relative">
                            {/* Abstract decorative blobs */}
                            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-red-100/50 rounded-full blur-3xl opacity-70"></div>
                            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-100/50 rounded-full blur-3xl opacity-70"></div>

                            {/* CSS Mockup of App UI */}
                            <div className="relative rounded-xl shadow-2xl bg-white border border-gray-200 overflow-hidden transform rotate-1 hover:rotate-0 transition-transform duration-500">
                                {/* Mockup Header */}
                                <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                    </div>
                                    <div className="ml-4 w-1/3 h-2 bg-gray-200 rounded-full"></div>
                                </div>
                                {/* Mockup Content */}
                                <div className="p-6 space-y-4">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="w-32 h-6 bg-gray-900 rounded opacity-10"></div>
                                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs">+</div>
                                    </div>
                                    {/* Mock Task Items */}
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                                            <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                                            <div className="flex-1">
                                                <div className="w-3/4 h-3 bg-gray-800 rounded opacity-80 mb-1.5"></div>
                                                <div className="w-1/4 h-2 bg-gray-400 rounded opacity-60"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Social Proof / Trust */}
            <section className="bg-gray-50 border-y border-gray-100 py-10">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-6">Trusted by teams at</p>
                    <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale">
                        {/* Simple Text Logos for Trust Strip */}
                        <span className="text-xl font-bold text-gray-600">ACME Corp</span>
                        <span className="text-xl font-bold text-gray-600">GlobalSoft</span>
                        <span className="text-xl font-bold text-gray-600">Technica</span>
                        <span className="text-xl font-bold text-gray-600">Innovate</span>
                        <span className="text-xl font-bold text-gray-600">FutureLab</span>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 lg:py-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">A powerful task manager you can trust</h2>
                        <p className="text-lg text-gray-500">
                            Ormmakurippu brings all your tasks, teammates, and tools together.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12">
                        {/* Feature 1 */}
                        <div className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center text-2xl mb-6">
                                📝
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Quick Add</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Capture tasks in seconds. Our natural language input understands due dates, priorities, and more immediately.
                            </p>
                        </div>
                        {/* Feature 2 */}
                        <div className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-2xl mb-6">
                                📞
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Call Logging</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Keep track of every conversation. Log calls directly to tasks and contacts so nothing falls through the cracks.
                            </p>
                        </div>
                        {/* Feature 3 */}
                        <div className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center text-2xl mb-6">
                                🤝
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Delegate</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Share the workload. Delegate tasks to coworkers and track their progress from your shared workspace.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="py-20 bg-gray-900 text-white text-center">
                <div className="max-w-4xl mx-auto px-4">
                    <h2 className="text-3xl sm:text-4xl font-bold mb-8">Achieve peace of mind with Ormmakurippu</h2>
                    {user ? (
                        <Link to="/app" className="bg-red-600 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-red-500 transition-colors inline-block">
                            Go to App
                        </Link>
                    ) : (
                        <button onClick={() => login()} className="bg-red-600 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-red-500 transition-colors inline-block">
                            Start for free
                        </button>
                    )}
                </div>
            </section>
        </div>
    );
}
