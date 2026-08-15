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
                <Text style={styles.email}>{user?.email}</Text>
                <Text style={styles.roleLabel}>Administrateur</Text>

                <SecuritySection currentEmail={user?.email ?? ''} dark />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: colors.darkBackground },
    container: { padding: 20, paddingBottom: 60 },
    email: { fontFamily: fonts.bold, fontSize: 20, color: colors.darkTextPrimary, marginBottom: 4 },
    roleLabel: { fontFamily: fonts.regular, fontSize: 14, color: colors.darkTextSecondary },
});