import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { SplashScreen } from '../screens/SplashScreen';
import { AuthNavigator } from './AuthNavigator';
import { CommercantNavigator } from './CommercantNavigator';
import { ClientNavigator } from './ClientNavigator';
import { AdminNavigator } from './AdminNavigator';

export function RootNavigator() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <SplashScreen />;
    }

    return (
        <NavigationContainer>
            {!user && <AuthNavigator />}
            {user?.role === 'ROLE_CMT' && <CommercantNavigator />}
            {user?.role === 'ROLE_CLIENT' && <ClientNavigator />}
            {user?.role === 'ROLE_ADMIN' && <AdminNavigator />}
        </NavigationContainer>
    );
}