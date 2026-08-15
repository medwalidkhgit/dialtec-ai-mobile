import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button } from '../../components/Button';
import { TextInput } from '../../components/TextInput';
import { Header } from '../../components/Header';
import { SecuritySection } from '../../components/SecuritySection';
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
                <ActivityIndicator color={colors.accent} size="large" />
            </View>
        );
    }

    return (
        <View style={styles.wrapper}>
            <Header role="client" />

            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.email}>{profil.email}</Text>

                {isEditing ? (
                    <>
                        <TextInput label="Nom complet" dark value={fullName} onChangeText={setFullName} />
                        <TextInput
                            label="Téléphone"
                            dark
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            keyboardType="phone-pad"
                        />

                        <Button title="Enregistrer" onPress={handleSave} loading={isSaving} />
                        <Button
                            title="Annuler"
                            variant="outline"
                            dark
                            onPress={() => setIsEditing(false)}
                            style={styles.spacedButton}
                        />
                    </>
                ) : (
                    <>
                        <ProfilRow label="Nom" value={profil.fullName} />
                        <ProfilRow label="Téléphone" value={profil.phoneNumber} />

                        <Button
                            title="Modifier"
                            variant="outline"
                            dark
                            onPress={() => setIsEditing(true)}
                            style={styles.spacedButton}
                        />
                    </>
                )}

                <SecuritySection currentEmail={profil.email} dark />

                <TouchableOpacity onPress={handleDeleteAccount} style={styles.deleteAccountButton}>
                    <Text style={styles.deleteAccountText}>Supprimer mon compte</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
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
    wrapper: { flex: 1, backgroundColor: colors.darkBackground },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.darkBackground },
    container: { padding: 20, paddingBottom: 60 },
    email: { fontFamily: fonts.regular, fontSize: 14, color: colors.darkTextSecondary, marginBottom: 24 },
    spacedButton: { marginTop: 12 },
    row: { marginBottom: 16 },
    rowLabel: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.darkTextSecondary, marginBottom: 2 },
    rowValue: { fontFamily: fonts.regular, fontSize: 16, color: colors.darkTextPrimary },
    deleteAccountButton: { marginTop: 32, alignItems: 'center' },
    deleteAccountText: { fontFamily: fonts.semiBold, fontSize: 14, color: '#D32F2F' },
});