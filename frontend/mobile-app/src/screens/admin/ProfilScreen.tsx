import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Header } from '../../components/Header';
import { SecuritySection } from '../../components/SecuritySection';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';

export function ProfilScreen() {
    const { user } = useAuth();

    return (
        <View style={styles.wrapper}>
            <Header role="admin" />

            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.headerBlock}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{user?.email?.charAt(0)?.toUpperCase() ?? '?'}</Text>
                    </View>
                    <Text style={styles.email}>{user?.email}</Text>
                    <Text style={styles.roleLabel}>Administrateur</Text>
                </View>

                <SecuritySection currentEmail={user?.email ?? ''} dark />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: colors.darkBackground },
    container: { padding: 20, paddingBottom: 60 },
    headerBlock: { alignItems: 'center', marginBottom: 8 },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    avatarText: { fontFamily: fonts.bold, fontSize: 26, color: colors.accentText },
    email: { fontFamily: fonts.bold, fontSize: 18, color: colors.darkTextPrimary, marginBottom: 3, textAlign: 'center' },
    roleLabel: { fontFamily: fonts.regular, fontSize: 14, color: colors.darkTextSecondary },
});