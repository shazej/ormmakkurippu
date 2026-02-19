import React from 'react';

export default function Step3({ onNext }) {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-gray-900">You're All Set!</h3>
                <p className="mt-1 text-sm text-gray-500">
                    Review your information and finish setup.
                </p>
            </div>

            <div className="bg-green-50 p-4 rounded-md border border-green-200">
                <p className="text-sm text-green-700">Everything looks good to go.</p>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={onNext}
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                    Finish & Go to App
                </button>
            </div>
        </div>
    );
}
