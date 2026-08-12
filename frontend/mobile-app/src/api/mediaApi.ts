import { apiClient } from './client';

export interface UploadResponse {
    url: string;
    key: string;
}

export async function uploadPhoto(uri: string): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', {
        uri,
        name: 'photo.jpg',
        type: 'image/jpeg',
    } as any);

    const response = await apiClient.post('/api/media/me/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
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
    });
    return response.data.data;
}