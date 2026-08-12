import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button } from '../../components/Button';
import { TextInput } from '../../components/TextInput';
import { getMonProfilClient, modifierMonProfilClient, supprimerMonCompteClient } from '../../api/userApi';
import { useAuth } from '../../context/AuthContext';
import { ClientProfileResponse } from '../../types/user';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';

export function ProfilScreen() {
    const { logout } = useAuth();

    const [profil, setProfil] = useState<ClientProfileResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    const chargerProfil = useCallback(async () => {
        try {
            const data = await getMonProfilClient();
            setProfil(data);
            setFullName(data.fullName);
            setPhoneNumber(data.phoneNumber);
        } catch (error) {
            console.error('Erreur chargement profil', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            chargerProfil();
        }, [chargerProfil])
    );

    async function handleSave() {
        setIsSaving(true);
        try {
            await modifierMonProfilClient({ fullName, phoneNumber });
            await chargerProfil();
            setIsEditing(false);
        } catch {
            Alert.alert('Erreur', "Impossible d'enregistrer les modifications.");
        } finally {
            setIsSaving(false);
        }
    }

    function handleLogout() {
        Alert.alert('Se déconnecter ?', '', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Se déconnecter', style: 'destructive', onPress: logout },
        ]);
    }

    function handleDeleteAccount() {
        Alert.alert('Supprimer ton compte ?', 'Cette action est définitive. Ton profil sera supprimé.', [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Supprimer',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await supprimerMonCompteClient();
                        await logout();
                    } catch {
                        Alert.alert('Erreur', 'Impossible de supprimer le compte.');
                    }
                },
            },
        ]);
    }

    if (isLoading || !profil) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator color={colors.primary} size="large" />
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Mon profil</Text>
            <Text style={styles.email}>{profil.email}</Text>

            {isEditing ? (
                <>
                    <TextInput label="Nom complet" value={fullName} onChangeText={setFullName} />
                    <TextInput label="Téléphone" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />

                    <Button title="Enregistrer" onPress={handleSave} loading={isSaving} />
                    <Button title="Annuler" variant="outline" onPress={() => setIsEditing(false)} style={styles.spacedButton} />
                </>
            ) : (
                <>
                    <ProfilRow label="Nom" value={profil.fullName} />
                    <ProfilRow label="Téléphone" value={profil.phoneNumber} />

                    <Button title="Modifier" variant="outline" onPress={() => setIsEditing(true)} style={styles.spacedButton} />
                </>
            )}

            <Button title="Se déconnecter" variant="primary" onPress={handleLogout} style={styles.logoutButton} />

            <TouchableOpacity onPress={handleDeleteAccount} style={styles.deleteAccountButton}>
                <Text style={styles.deleteAccountText}>Supprimer mon compte</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

function ProfilRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    container: { padding: 20, paddingBottom: 60 },
    title: { fontFamily: fonts.bold, fontSize: 24, color: colors.textPrimary, marginBottom: 4 },
    email: { fontFamily: fonts.regular, fontSize: 14, color: colors.marine, marginBottom: 24 },
    spacedButton: { marginTop: 12 },
    row: { marginBottom: 16 },
    rowLabel: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.marine, marginBottom: 2 },
    rowValue: { fontFamily: fonts.regular, fontSize: 16, color: colors.textPrimary },
    logoutButton: { marginTop: 32 },
    deleteAccountButton: { marginTop: 20, alignItems: 'center' },
    deleteAccountText: { fontFamily: fonts.semiBold, fontSize: 14, color: '#D32F2F' },
});