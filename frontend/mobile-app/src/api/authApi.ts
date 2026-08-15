import { apiClient } from './client';

export interface LoginPayload {
    email: string;
    password: string;
}

export interface RegisterCommercantPayload {
    email: string;
    password: string;
    fullName: string;
    shopCategory: string;
    phoneNumber: string;
    address: string;
    city: string;
    postalCode: string;
    description?: string;
}

export interface RegisterClientPayload {
    email: string;
    password: string;
    fullName: string;
    phoneNumber: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export async function login(payload: LoginPayload): Promise<AuthTokens> {
    const response = await apiClient.post('/api/auth/login', payload);
    // Contrairement aux autres endpoints, /api/auth/login renvoie directement
    // { id, email, role, accessToken, refreshToken, expiresIn } — pas
    // enveloppé dans { success, message, data }.
    return response.data;
}

export async function registerCommercant(payload: RegisterCommercantPayload): Promise<void> {
    await apiClient.post('/api/auth/register/commercant', payload);
}

export async function registerClient(payload: RegisterClientPayload): Promise<void> {
    await apiClient.post('/api/auth/register/client', payload);
}

export async function verifyOtp(email: string, code: string): Promise<void> {
    await apiClient.post('/api/auth/verify-otp', { email, code });
}

export async function resendOtp(email: string): Promise<void> {
    await apiClient.post('/api/auth/resend-otp', { email });
}

export async function logout(): Promise<void> {
    await apiClient.post('/api/auth/logout');
}

export interface ChangeEmailPayload {
    currentEmail: string;
    password: string;
    newEmail: string;
}

export interface ChangePasswordPayload {
    email: string;
    oldPassword: string;
    newPassword: string;
}

export async function changeEmail(payload: ChangeEmailPayload): Promise<string> {
    const response = await apiClient.patch('/api/auth/change-email', payload);
    return response.data.message;
}

export async function changePassword(payload: ChangePasswordPayload): Promise<string> {
    const response = await apiClient.patch('/api/auth/change-password', payload);
    return response.data.message;
}