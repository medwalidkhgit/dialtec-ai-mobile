import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

export const ACCESS_TOKEN_KEY = 'accessToken';
export const REFRESH_TOKEN_KEY = 'refreshToken';

function resolveApiHost(): string {
    const debuggerHost = Constants.expoConfig?.hostUri;
    if (debuggerHost) {
        return debuggerHost.split(':')[0];
    }
    return 'localhost';
}

export const API_BASE_URL = `http://${resolveApiHost()}:8087`;

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
});

// Attache automatiquement le token à chaque requête sortante, si présent.
apiClient.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Rafraîchit automatiquement le token expiré (401), rejoue la requête
// initiale une seule fois. Simplification assumée : si plusieurs requêtes
// échouent en 401 en même temps, une seule déclenche le rafraîchissement,
// les autres échouent simplement — suffisant pour la portée de ce projet.
let isRefreshing = false;

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry && !isRefreshing) {
            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
                if (!refreshToken) {
                    throw new Error('Aucun refresh token disponible.');
                }

                const response = await axios.post(`${API_BASE_URL}/api/auth/refresh-token`, {
                    refreshToken,
                });

                // Même principe que /api/auth/login : réponse non enveloppée,
                // directement { accessToken, refreshToken, ... }.
                const { accessToken, refreshToken: newRefreshToken } = response.data;
                await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
                await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newRefreshToken);

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
                await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);