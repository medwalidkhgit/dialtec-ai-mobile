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
import { AlertBanner } from '../../components/AlertBanner';
import { fonts } from '../../theme/typography';

export function ProfilScreen() {
    const { logout } = useAuth();

    const [profil, setProfil] = useState<ClientProfileResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

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
            setSuccessMessage('Coordonnées mises à jour avec succès.');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error: any) {
            const message = error?.response?.data?.message ?? "Impossible d'enregistrer les modifications.";
            Alert.alert('Erreur', message);
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
                    } catch (error: any) {
                        const message = error?.response?.data?.message ?? 'Impossible de supprimer le compte.';
                        Alert.alert('Erreur', message);
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

    const initiale = profil.fullName?.charAt(0)?.toUpperCase() ?? '?';

    return (
        <View style={styles.wrapper}>
            <Header role="client" />

            <ScrollView contentContainerStyle={styles.container}>
                <AlertBanner message={successMessage} variant="success" dark />

                <View style={styles.headerBlock}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initiale}</Text>
                    </View>
                    <Text style={styles.nomAffiche}>{profil.fullName}</Text>
                    <Text style={styles.email}>{profil.email}</Text>
                </View>

                <View style={styles.carte}>
                    <Text style={styles.carteTitre}>Coordonnées</Text>

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
                            <ProfilRow label="Téléphone" value={profil.phoneNumber} dernier />

                            <Button
                                title="Modifier"
                                variant="outline"
                                dark
                                onPress={() => setIsEditing(true)}
                                style={styles.spacedButton}
                            />
                        </>
                    )}
                </View>

                <SecuritySection currentEmail={profil.email} dark />

                <TouchableOpacity onPress={handleDeleteAccount} style={styles.deleteAccountButton}>
                    <Text style={styles.deleteAccountText}>Supprimer mon compte</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

function ProfilRow({ label, value, dernier }: { label: string; value: string; dernier?: boolean }) {
    return (
        <View style={[styles.row, dernier && styles.rowDernier]}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: colors.darkBackground },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.darkBackground },
    container: { padding: 20, paddingBottom: 60 },
    headerBlock: { alignItems: 'center', marginBottom: 28 },
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
    nomAffiche: { fontFamily: fonts.bold, fontSize: 18, color: colors.darkTextPrimary, marginBottom: 3 },
    email: { fontFamily: fonts.regular, fontSize: 14, color: colors.darkTextSecondary },
    carte: {
        backgroundColor: colors.darkSurface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.darkBorder,
        padding: 18,
        marginBottom: 20,
    },
    carteTitre: {
        fontFamily: fonts.bold,
        fontSize: 16,
        color: colors.darkTextPrimary,
        marginBottom: 16,
    },
    spacedButton: { marginTop: 12 },
    row: {
        paddingBottom: 12,
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.darkBorder,
    },
    rowDernier: { borderBottomWidth: 0, marginBottom: 4, paddingBottom: 0 },
    rowLabel: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.darkTextSecondary, marginBottom: 3 },
    rowValue: { fontFamily: fonts.regular, fontSize: 15, color: colors.darkTextPrimary },
    deleteAccountButton: { marginTop: 24, alignItems: 'center' },
    deleteAccountText: { fontFamily: fonts.semiBold, fontSize: 14, color: '#D32F2F' },
});