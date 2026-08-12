import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { CatalogueScreen } from '../screens/commercant/CatalogueScreen';
import { ProduitDetailScreen } from '../screens/commercant/ProduitDetailScreen';
import { GenerationScreen } from '../screens/commercant/GenerationScreen';
import { ClientsScreen } from '../screens/commercant/ClientsScreen';
import { ProfilScreen } from '../screens/commercant/ProfilScreen';
import { CommercantStackParamList, GenerationStackParamList } from './types';

const Tab = createBottomTabNavigator();
const CatalogueStack = createNativeStackNavigator<CommercantStackParamList>();
const GenerationStack = createNativeStackNavigator<GenerationStackParamList>();

function CatalogueStackNavigator() {
    return (
        <CatalogueStack.Navigator screenOptions={{ headerShown: false }}>
            <CatalogueStack.Screen name="CatalogueList" component={CatalogueScreen} />
            <CatalogueStack.Screen name="ProduitDetail" component={ProduitDetailScreen} />
        </CatalogueStack.Navigator>
    );
}

function GenerationStackNavigator() {
    return (
        <GenerationStack.Navigator screenOptions={{ headerShown: false }}>
            <GenerationStack.Screen name="GenerationCapture" component={GenerationScreen} />
            <GenerationStack.Screen name="ProduitDetail" component={ProduitDetailScreen} />
        </GenerationStack.Navigator>
    );
}

export function CommercantNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.marine,
                tabBarStyle: { backgroundColor: colors.white },
            }}
        >
            <Tab.Screen
                name="Catalogue"
                component={CatalogueStackNavigator}
                options={{ tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} /> }}
            />
            <Tab.Screen
                name="Generation"
                component={GenerationStackNavigator}
                options={{
                    title: 'Générer',
                    tabBarIcon: ({ color, size }) => <Ionicons name="add-circle-outline" size={size} color={color} />,
                }}
            />
            <Tab.Screen
                name="Clients"
                component={ClientsScreen}
                options={{ tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} /> }}
            />
            <Tab.Screen
                name="Profil"
                component={ProfilScreen}
                options={{ tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }}
            />
        </Tab.Navigator>
    );
}