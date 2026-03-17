// Stub component — feature not yet implemented
export default function CreateProjectModal({ isOpen, onClose, onCreated }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-25">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create Project</h3>
                <p className="text-sm text-gray-500 mb-4">Projects coming soon.</p>
                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
