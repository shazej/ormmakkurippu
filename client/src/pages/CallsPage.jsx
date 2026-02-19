import { useState, useEffect } from 'react';
import axios from 'axios';

export default function CallsPage() {
    const [calls, setCalls] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCalls();
    }, []);

    const fetchCalls = async () => {
        try {
            const res = await axios.get('/api/calls');
            setCalls(res.data.data || res.data); // Handle success envelope
        } catch (error) {
            console.error('Error fetching calls:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="px-4 py-8">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Call Log</h1>
                <button
                    onClick={() => alert('Manual entry modal coming soon')}
                    className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
                >
                    Log Call
                </button>
            </header>

            {loading ? (
                <div className="text-center py-10 text-gray-500">Loading calls...</div>
            ) : calls.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-500 mb-2">No calls logged yet.</p>
                    <p className="text-xs text-gray-400">Calls will appear here when you log them or sync via API.</p>
                </div>
            ) : (
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                    <ul className="divide-y divide-gray-200">
                        {calls.map(call => (
                            <li key={call.id} className="p-4 hover:bg-gray-50 transition flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${call.direction === 'INCOMING' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {call.direction === 'INCOMING' ? '↙️' : '↗️'}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{call.contact?.name || call.caller_name || 'Unknown'}</p>
                                        <p className="text-sm text-gray-500">{call.caller_phone_e164} • {new Date(call.call_time).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {call.duration_sec && <span className="text-xs text-gray-400">{Math.floor(call.duration_sec / 60)}m {call.duration_sec % 60}s</span>}
                                    <button className="text-gray-400 hover:text-blue-600" title="Create Task">
                                        📝
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
