import React from 'react';

export default function Step2({ onNext }) {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-gray-900">Configure Preferences</h3>
                <p className="mt-1 text-sm text-gray-500">
                    Customize your experience.
                </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <p className="text-sm text-gray-600">Preferences form fields will go here (Notifications, Timezone, etc.)</p>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={onNext}
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Continue
                </button>
            </div>
        </div>
    );
}
