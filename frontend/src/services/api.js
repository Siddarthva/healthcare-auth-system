import axios from 'axios';
import useAuthStore from '../store/authStore';

const api = axios.create({
    baseURL: 'http://localhost:3000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().accessToken;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        // Basic retry logic or logout on 401 could go here
        if (error.response?.status === 401 && !originalRequest._retry) {
            // For a demo, let's keep it simple: clear auth state on 401
            useAuthStore.getState().logout();
        }
        return Promise.reject(error);
    }
);

export default api;
