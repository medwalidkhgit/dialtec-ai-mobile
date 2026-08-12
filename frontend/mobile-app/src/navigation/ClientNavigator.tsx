import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { CatalogueScreen } from '../screens/client/CatalogueScreen';
import { ProduitDetailScreen } from '../screens/client/ProduitDetailScreen';
import { FournisseursScreen } from '../screens/client/FournisseursScreen';
import { DecouvrirCommercantsScreen } from '../screens/client/DecouvrirCommercantsScreen';
import { CommercantCatalogueScreen } from '../screens/client/CommercantCatalogueScreen';
import { NouveautesScreen } from '../screens/client/NouveautesScreen';
import { ProfilScreen } from '../screens/client/ProfilScreen';
import {
    ClientCatalogueStackParamList,
    FournisseursStackParamList,
    NouveautesStackParamList,
} from './types';

const Tab = createBottomTabNavigator();
const CatalogueStack = createNativeStackNavigator<ClientCatalogueStackParamList>();
const FournisseursStack = createNativeStackNavigator<FournisseursStackParamList>();
const NouveautesStack = createNativeStackNavigator<NouveautesStackParamList>();

function CatalogueStackNavigator() {
    return (
        <CatalogueStack.Navigator screenOptions={{ headerShown: false }}>
            <CatalogueStack.Screen name="CatalogueList" component={CatalogueScreen} />
            <CatalogueStack.Screen name="ProduitDetailPublic" component={ProduitDetailScreen} />
        </CatalogueStack.Navigator>
    );
}

function FournisseursStackNavigator() {
    return (
        <FournisseursStack.Navigator screenOptions={{ headerShown: false }}>
            <FournisseursStack.Screen name="FournisseursList" component={FournisseursScreen} />
            <FournisseursStack.Screen name="DecouvrirCommercants" component={DecouvrirCommercantsScreen} />
            <FournisseursStack.Screen name="CommercantCatalogue" component={CommercantCatalogueScreen} />
            <FournisseursStack.Screen name="ProduitDetailPublic" component={ProduitDetailScreen} />
        </FournisseursStack.Navigator>
    );
}

function NouveautesStackNavigator() {
    return (
        <NouveautesStack.Navigator screenOptions={{ headerShown: false }}>
            <NouveautesStack.Screen name="NouveautesList" component={NouveautesScreen} />
            <NouveautesStack.Screen name="ProduitDetailPublic" component={ProduitDetailScreen} />
        </NouveautesStack.Navigator>
    );
}

export function ClientNavigator() {
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
                name="Fournisseurs"
                component={FournisseursStackNavigator}
                options={{ tabBarIcon: ({ color, size }) => <Ionicons name="storefront-outline" size={size} color={color} /> }}
            />
            <Tab.Screen
                name="Nouveautes"
                component={NouveautesStackNavigator}
                options={{
                    title: 'Nouveautés',
                    tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" size={size} color={color} />,
                }}
            />
            <Tab.Screen
                name="Profil"
                component={ProfilScreen}
                options={{ tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }}
            />
        </Tab.Navigator>
    );
}