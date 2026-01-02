import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
});

// Add response interceptor for global error handling if needed
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // You can log errors or redirect to login here
        return Promise.reject(error);
    }
);

export const fetchTasks = (params) => api.get('/tasks', { params });
export const fetchTask = (id) => api.get(`/tasks/${id}`);
export const createTask = (data) => api.post('/tasks', data);
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data);
export const deleteTask = (id) => api.delete(`/tasks/${id}`);
export const restoreTask = (id) => api.post(`/tasks/${id}/restore`);

export default api;
