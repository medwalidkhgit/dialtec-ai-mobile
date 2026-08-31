import { apiClient } from './client';

export interface UploadResponse {
    url: string;
    key: string;
}

/**
 * Format spécifique à React Native pour joindre un fichier à un
 * FormData : un objet {uri, name, type}, pas un vrai File/Blob comme
 * dans un navigateur web classique. "uri" vient typiquement d'expo-camera
 * ou expo-audio après une capture.
 */
export async function uploadPhoto(uri: string): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', {
        uri,
        name: 'photo.jpg',
        type: 'image/jpeg',
    } as any);

    // Timeout plus long que le défaut global (15s) — un vrai upload de
    // fichier prend naturellement plus de temps qu'un simple appel JSON.
    const response = await apiClient.post('/api/media/me/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
    });
    return response.data;
}

export async function uploadAudio(uri: string): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', {
        uri,
        name: 'audio.m4a',
        type: 'audio/m4a',
    } as any);

    const response = await apiClient.post('/api/media/me/audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
    });
    return response.data;
}