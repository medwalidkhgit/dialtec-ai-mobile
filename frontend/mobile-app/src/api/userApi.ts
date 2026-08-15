import { apiClient } from './client';
import { ShopCategory } from '../constants/shopCategories';
import {
    CommercantProfileResponse,
    ClientProfileResponse,
    ClientResumeResponse,
    PublicCommercantResponse,
    AdminStatsResponse,
} from '../types/user';
import { PagedResponse } from '../types/produit';

// --- Côté commerçant ---

export async function getMonProfilCommercant(): Promise<CommercantProfileResponse> {
    const response = await apiClient.get('/api/users/commercant/me');
    return response.data;
}

export async function modifierMonProfilCommercant(
    payload: Omit<CommercantProfileResponse, 'id' | 'email' | 'accountStatus'>
): Promise<CommercantProfileResponse> {
    const response = await apiClient.put('/api/users/commercant/me', payload);
    return response.data;
}

export async function supprimerMonCompteCommercant(): Promise<void> {
    await apiClient.delete('/api/users/commercant/me');
}

export async function ajouterClient(email: string): Promise<ClientResumeResponse> {
    const response = await apiClient.post('/api/users/commercant/me/clients', null, { params: { email } });
    return response.data;
}

export async function retirerClient(clientId: string): Promise<void> {
    await apiClient.delete(`/api/users/commercant/me/clients/${clientId}`);
}

export async function listerMesClients(): Promise<ClientResumeResponse[]> {
    const response = await apiClient.get('/api/users/commercant/me/clients');
    return response.data;
}

// --- Côté client ---

export async function getMonProfilClient(): Promise<ClientProfileResponse> {
    const response = await apiClient.get('/api/users/client/me');
    return response.data;
}

export async function modifierMonProfilClient(
    payload: Omit<ClientProfileResponse, 'id' | 'email' | 'accountStatus'>
): Promise<ClientProfileResponse> {
    const response = await apiClient.put('/api/users/client/me', payload);
    return response.data;
}

export async function supprimerMonCompteClient(): Promise<void> {
    await apiClient.delete('/api/users/client/me');
}

export async function listerMesFournisseurs(): Promise<PublicCommercantResponse[]> {
    const response = await apiClient.get('/api/users/client/me/fournisseurs');
    return response.data;
}

export async function decouvrirCommercants(
    shopCategory?: ShopCategory,
    page = 0,
    size = 20
): Promise<PagedResponse<PublicCommercantResponse>> {
    const response = await apiClient.get('/api/users/public/commercants', {
        params: { shopCategory, page, size },
    });
    return response.data;
}

// --- Côté admin ---

export async function listerCommercantsAdmin(): Promise<CommercantProfileResponse[]> {
    const response = await apiClient.get('/api/users/admin/commercants');
    return response.data;
}

export async function consulterCommercantAdmin(commercantId: string): Promise<CommercantProfileResponse> {
    const response = await apiClient.get(`/api/users/admin/commercants/${commercantId}`);
    return response.data;
}

export async function bloquerCompte(userId: string): Promise<void> {
    await apiClient.patch(`/api/users/admin/${userId}/block`);
}

export async function debloquerCompte(userId: string): Promise<void> {
    await apiClient.patch(`/api/users/admin/${userId}/unblock`);
}

export async function supprimerCompteAdmin(userId: string): Promise<void> {
    await apiClient.delete(`/api/users/admin/${userId}`);
}

export async function getStatsAdmin(): Promise<AdminStatsResponse> {
    const response = await apiClient.get('/api/users/admin/stats');
    return response.data;
}