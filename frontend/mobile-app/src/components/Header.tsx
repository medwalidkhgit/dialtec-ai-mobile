import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

type Role = 'commercant' | 'client' | 'admin';

interface HeaderProps {
    role: Role;
}

const logos: Record<Role, any> = {
    commercant: require('../../assets/Portail_Comm.png'),
    client: require('../../assets/Portail_Client.png'),
    admin: require('../../assets/Portail_Admin.png'),
};

export function Header({ role }: HeaderProps) {
    const { logout } = useAuth();
    const insets = useSafeAreaInsets();

    function handleLogout() {
        Alert.alert('Se déconnecter ?', '', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Se déconnecter', style: 'destructive', onPress: logout },
        ]);
    }

    return (
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
            <Image source={logos[role]} style={styles.logo} resizeMode="contain" />
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                <Text style={styles.logoutText}>{'>'} Déconnexion</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 12,
        backgroundColor: colors.darkBackground,
    },
    logo: {
        width: 170,
        height: 48,
    },
    logoutButton: {
        backgroundColor: colors.accent,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    logoutText: {
        fontFamily: fonts.semiBold,
        fontSize: 13,
        color: colors.white,
    },
});