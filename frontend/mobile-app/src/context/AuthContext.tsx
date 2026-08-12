import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../api/client';
import { login as loginApi, logout as logoutApi } from '../api/authApi';
import { AuthUser, Role } from '../types/auth';

interface JwtPayload {
    sub: string;
    userId: string;
    role: Role;
}

interface AuthContextValue {
    user: AuthUser | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function decodeUserFromToken(token: string): AuthUser {
    const payload = jwtDecode<JwtPayload>(token);
    return {
        id: payload.userId,
        email: payload.sub,
        role: payload.role,
    };
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkExistingSession();
    }, []);

    async function checkExistingSession() {
        const minDisplayTime = new Promise((resolve) => setTimeout(resolve, 1200));

        try {
            const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
            if (token) {
                setUser(decodeUserFromToken(token));
            }
        } catch {
            await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
            await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        } finally {
            await minDisplayTime;
            setIsLoading(false);
        }
    }

    async function login(email: string, password: string) {
        const { accessToken, refreshToken } = await loginApi({ email, password });

        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);

        setUser(decodeUserFromToken(accessToken));
    }

    async function logout() {
        try {
            await logoutApi();
        } catch {

        }
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth doit être utilisé à l'intérieur de AuthProvider");
    }
    return context;
}