import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { DashboardScreen } from '../screens/admin/DashboardScreen';
import { CommercantsListScreen } from '../screens/admin/CommercantsListScreen';
import { CommercantDetailScreen } from '../screens/admin/CommercantDetailScreen';
import { CatalogueConsultationScreen } from '../screens/admin/CatalogueConsultationScreen';
import { ProfilScreen } from '../screens/admin/ProfilScreen';
import { ProduitDetailScreen } from '../screens/client/ProduitDetailScreen';
import { CommercantsStackParamList, AdminCatalogueStackParamList } from './types';

const Tab = createBottomTabNavigator();
const CommercantsStack = createNativeStackNavigator<CommercantsStackParamList>();
const CatalogueStack = createNativeStackNavigator<AdminCatalogueStackParamList>();

function CommercantsStackNavigator() {
    return (
        <CommercantsStack.Navigator screenOptions={{ headerShown: false }}>
            <CommercantsStack.Screen name="CommercantsListAdmin" component={CommercantsListScreen} />
            <CommercantsStack.Screen name="CommercantDetailAdmin" component={CommercantDetailScreen} />
        </CommercantsStack.Navigator>
    );
}

function CatalogueStackNavigator() {
    return (
        <CatalogueStack.Navigator screenOptions={{ headerShown: false }}>
            <CatalogueStack.Screen name="CatalogueConsultation" component={CatalogueConsultationScreen} />
            <CatalogueStack.Screen name="ProduitDetailPublic" component={ProduitDetailScreen} />
        </CatalogueStack.Navigator>
    );
}

export function AdminNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.accent,
                tabBarInactiveTintColor: colors.darkTextSecondary,
                tabBarStyle: {
                    backgroundColor: colors.darkSurface,
                    borderTopColor: colors.darkBorder,
                    borderTopWidth: 1,
                },
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    title: 'Tableau de bord',
                    tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" size={size} color={color} />,
                }}
            />
            <Tab.Screen
                name="Commercants"
                component={CommercantsStackNavigator}
                options={{
                    title: 'Commerçants',
                    tabBarIcon: ({ color, size }) => <Ionicons name="storefront-outline" size={size} color={color} />,
                }}
            />
            <Tab.Screen
                name="Catalogue"
                component={CatalogueStackNavigator}
                options={{ tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} /> }}
            />
            <Tab.Screen
                name="Profil"
                component={ProfilScreen}
                options={{ tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }}
            />
        </Tab.Navigator>
    );
}