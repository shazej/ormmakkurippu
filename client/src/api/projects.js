import axios from 'axios';

const BASE_URL = 'http://localhost:4000/api/projects';

export const getProjects = (workspaceId, { includeArchived = false } = {}) =>
    axios.get(BASE_URL, { params: { workspaceId, includeArchived } });

export const createProject = ({ workspaceId, name, color }) =>
    axios.post(BASE_URL, { workspaceId, name, color });

export const updateProject = (id, data) =>
    axios.patch(`${BASE_URL}/${id}`, data);

export const archiveProject = (id) =>
    axios.post(`${BASE_URL}/${id}/archive`);

export const unarchiveProject = (id) =>
    axios.post(`${BASE_URL}/${id}/unarchive`);
