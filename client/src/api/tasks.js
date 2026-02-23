import axios from 'axios';

const BASE_URL = 'http://localhost:4000/api/tasks';

export const exportTasksCsv = async () => {
    const response = await axios.get(`${BASE_URL}/export.csv`, {
        responseType: 'blob',
    });
    return response.data;
};

export const importTasksCsv = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${BASE_URL}/import`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};
