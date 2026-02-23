import React, { useState } from 'react';
import { Download, Upload, AlertCircle, CheckCircle2, Loader2, FileText } from 'lucide-react';
import { exportTasksCsv, importTasksCsv } from '../api/tasks';

export default function SettingsDataPage() {
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importResults, setImportResults] = useState(null);
    const [error, setError] = useState(null);

    const handleExport = async () => {
        setIsExporting(true);
        setError(null);
        try {
            const blob = await exportTasksCsv();
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'tasks-export.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Export failed:', err);
            setError('Failed to export tasks. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleImport = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsImporting(true);
        setError(null);
        setImportResults(null);

        try {
            const data = await importTasksCsv(file);
            setImportResults(data.data);
            // Clear input
            event.target.value = '';
        } catch (err) {
            console.error('Import failed:', err);
            setError(err.response?.data?.message || err.message || 'Failed to import tasks.');
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Data Management</h1>
                <p className="text-gray-500 mt-1">Export your tasks or import them from a CSV file.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Export Card */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                        <Download className="text-blue-600 w-6 h-6" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Export Tasks</h2>
                    <p className="text-sm text-gray-500 mt-2 mb-6">
                        Download all your tasks, including descriptions, due dates, projects, and labels in a CSV format.
                    </p>
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isExporting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4" />
                        )}
                        {isExporting ? 'Exporting...' : 'Download CSV'}
                    </button>
                </div>

                {/* Import Card */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
                        <Upload className="text-purple-600 w-6 h-6" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Import Tasks</h2>
                    <p className="text-sm text-gray-500 mt-2 mb-6">
                        Upload a CSV file to bulk create tasks. Limit: 5,000 rows. Files must be .csv format.
                    </p>
                    <label className="relative block">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleImport}
                            disabled={isImporting}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <div className="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-purple-200 text-purple-600 rounded-xl font-medium hover:bg-purple-50 transition-colors">
                            {isImporting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Upload className="w-4 h-4" />
                            )}
                            {isImporting ? 'Importing...' : 'Select CSV File'}
                        </div>
                    </label>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {/* Import Results */}
            {importResults && (
                <div className="mt-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <CheckCircle2 className="text-green-600 w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Import Results</h3>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="p-4 bg-gray-50 rounded-xl text-center">
                            <div className="text-2xl font-bold text-gray-900">{importResults.total}</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mt-1">Total Rows</div>
                        </div>
                        <div className="p-4 bg-green-50 rounded-xl text-center">
                            <div className="text-2xl font-bold text-green-600">{importResults.successCount}</div>
                            <div className="text-xs text-green-500 uppercase tracking-wider font-semibold mt-1">Succeeded</div>
                        </div>
                        <div className="p-4 bg-red-50 rounded-xl text-center">
                            <div className="text-2xl font-bold text-red-600">{importResults.failed.length}</div>
                            <div className="text-xs text-red-500 uppercase tracking-wider font-semibold mt-1">Failed</div>
                        </div>
                    </div>

                    {importResults.failed.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                                Details for Failed Rows
                            </h4>
                            <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-xl">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold">
                                        <tr>
                                            <th className="px-4 py-2">Row</th>
                                            <th className="px-4 py-2">Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {importResults.failed.map((fail, i) => (
                                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-2.5 font-medium text-gray-700">{fail.row}</td>
                                                <td className="px-4 py-2.5 text-red-600">{fail.reason}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
