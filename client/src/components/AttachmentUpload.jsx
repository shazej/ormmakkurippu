import React, { useState } from 'react';
import axios from 'axios';

export default function AttachmentUpload({ onUploadSuccess, idToken }) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!idToken) {
            setError('Please login with Google first.');
            return;
        }

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('/api/drive/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${idToken}`
                }
            });
            onUploadSuccess(response.data);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Upload failed');
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = null;
        }
    };

    return (
        <div className="mt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Attachments</label>
            <div className="flex items-center gap-4">
                <input
                    type="file"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                />
                {uploading && <span className="text-sm text-blue-600">Uploading...</span>}
            </div>
            {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
        </div>
    );
}
