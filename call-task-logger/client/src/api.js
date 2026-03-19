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

// Comments
export const fetchComments = (taskId) => api.get(`/tasks/${taskId}/comments`);
export const createComment = (taskId, data) => api.post(`/tasks/${taskId}/comments`, data);
export const deleteComment = (commentId, author_name) =>
    api.delete(`/comments/${commentId}`, { data: { author_name } });

// Notifications
export const fetchNotifications = () => api.get('/notifications');
export const markNotificationRead = (id) => api.post(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.post('/notifications/read-all');

export default api;
