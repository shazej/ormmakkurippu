import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { getProjects } from '../api/projects';
import { useAuth } from './AuthContext';

const ProjectsContext = createContext();

export const useProjects = () => useContext(ProjectsContext);

export const ProjectsProvider = ({ children }) => {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Get workspaceId from user object or local storage fallback
    const workspaceId = user?._dbUser?.default_workspace_id || user?.default_workspace_id;

    const fetchProjects = useCallback(async () => {
        if (!workspaceId) return;

        setLoading(true);
        try {
            const response = await getProjects(workspaceId);
            if (response.data.success) {
                setProjects(response.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch projects:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [workspaceId]);

    useEffect(() => {
        if (user && workspaceId) {
            fetchProjects();
        }
    }, [user, workspaceId, fetchProjects]);

    return (
        <ProjectsContext.Provider value={{ projects, loading, error, refresh: fetchProjects }}>
            {children}
        </ProjectsContext.Provider>
    );
};
