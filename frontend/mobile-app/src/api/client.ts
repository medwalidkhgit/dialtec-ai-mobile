import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

export const ACCESS_TOKEN_KEY = 'accessToken';
export const REFRESH_TOKEN_KEY = 'refreshToken';

/**
 * "localhost" ne fonctionne ni sur l'émulateur Android, ni sur un
 * téléphone physique (les deux le résoudraient vers eux-mêmes, pas vers
 * le PC qui fait tourner api-gateway). Expo connaît déjà l'adresse
 * réseau à laquelle le téléphone/émulateur accède au serveur de
 * développement (Metro) — on réutilise cette même adresse pour nos
 * appels API, plutôt que de coder une IP en dur qui changerait à
 * chaque réseau WiFi.
 */
function resolveApiHost(): string {
    const debuggerHost = Constants.expoConfig?.hostUri;
    if (debuggerHost) {
        return debuggerHost.split(':')[0];
    }
    return 'localhost';
}

// Passe à "true" temporairement pour tester contre le vrai cluster EKS
// (via CloudFront) plutôt que le backend local — remets à "false" pour
// revenir au développement local normal.
const UTILISER_EKS_POUR_TEST = true;

export const API_BASE_URL = UTILISER_EKS_POUR_TEST
    ? 'https://dk005oic22m5k.cloudfront.net'
    : `http://${resolveApiHost()}:8087`;

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
});

// Attache automatiquement le token à chaque requête sortante, si présent.
apiClient.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    console.log(`[intercepteur] ${config.url} — token trouvé:`, token ? `oui (${token.slice(0, 15)}...)` : 'NON');
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

        // Un 401 sur /login ou /refresh-token signifie "identifiants invalides"
        // ou "session déjà irrécupérable" — jamais "session expirée à
        // rafraîchir". Les inclure dans la logique de rafraîchissement ci-
        // dessous ferait perdre le VRAI message d'erreur (ex: "mot de passe
        // incorrect"), remplacé silencieusement par l'échec du rafraîchissement
        // lui-même.
        const estEndpointAuthExclu =
            originalRequest?.url?.includes('/api/auth/login') ||
            originalRequest?.url?.includes('/api/auth/refresh-token');

        if (error.response?.status === 401 && !estEndpointAuthExclu && !originalRequest._retry && !isRefreshing) {
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