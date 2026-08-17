import React from 'react';
import {
    useFonts,
    IBMPlexSans_400Regular,
    IBMPlexSans_600SemiBold,
    IBMPlexSans_700Bold,
} from '@expo-google-fonts/ibm-plex-sans';
import { AuthProvider } from './src/context/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { SplashScreen } from './src/screens/SplashScreen';

export default function App() {
    const [fontsLoaded] = useFonts({
        IBMPlexSans_400Regular,
        IBMPlexSans_600SemiBold,
        IBMPlexSans_700Bold,
    });

    if (!fontsLoaded) {
        return <SplashScreen />;
    }

    return (
        <AuthProvider>
            <RootNavigator />
        </AuthProvider>
    );
}