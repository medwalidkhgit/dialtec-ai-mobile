import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterChoiceScreen } from '../screens/auth/RegisterChoiceScreen';
import { RegisterCommercantScreen } from '../screens/auth/RegisterCommercantScreen';
import { RegisterClientScreen } from '../screens/auth/RegisterClientScreen';
import { OtpVerificationScreen } from '../screens/auth/OtpVerificationScreen';
import { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="RegisterChoice" component={RegisterChoiceScreen} />
            <Stack.Screen name="RegisterCommercant" component={RegisterCommercantScreen} />
            <Stack.Screen name="RegisterClient" component={RegisterClientScreen} />
            <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
        </Stack.Navigator>
    );
}