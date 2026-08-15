import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button } from '../../components/Button';
import { TextInput } from '../../components/TextInput';
import { Header } from '../../components/Header';
import { SecuritySection } from '../../components/SecuritySection';
import { getMonProfilCommercant, modifierMonProfilCommercant, supprimerMonCompteCommercant } from '../../api/userApi';
import { useAuth } from '../../context/AuthContext';
import { CommercantProfileResponse } from '../../types/user';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { SHOP_CATEGORIES, SHOP_CATEGORY_LABELS, ShopCategory } from '../../constants/shopCategories';

export function ProfilScreen() {
    const { logout } = useAuth();

    const [profil, setProfil] = useState<CommercantProfileResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [fullName, setFullName] = useState('');
    const [shopCategory, setShopCategory] = useState<ShopCategory | null>(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [description, setDescription] = useState('');

    const chargerProfil = useCallback(async () => {
        try {
            const data = await getMonProfilCommercant();
            setProfil(data);
            setFullName(data.fullName);
            setShopCategory(data.shopCategory);
            setPhoneNumber(data.phoneNumber);
            setAddress(data.address);
            setCity(data.city);
            setPostalCode(data.postalCode);
            setDescription(data.description ?? '');
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
        if (!shopCategory) return;

        setIsSaving(true);
        try {
            await modifierMonProfilCommercant({
                fullName,
                shopCategory,
                phoneNumber,
                address,
                city,
                postalCode,
                description: description || null,
            });
            await chargerProfil();
            setIsEditing(false);
        } catch {
            Alert.alert('Erreur', "Impossible d'enregistrer les modifications.");
        } finally {
            setIsSaving(false);
        }
    }

    function handleDeleteAccount() {
        Alert.alert(
            'Supprimer ton compte ?',
            'Cette action est définitive. Ton profil, ton catalogue et tes informations seront supprimés.',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await supprimerMonCompteCommercant();
                            await logout();
                        } catch {
                            Alert.alert('Erreur', 'Impossible de supprimer le compte.');
                        }
                    },
                },
            ]
        );
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
            <Header role="commercant" />

            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.email}>{profil.email}</Text>

                {isEditing ? (
                    <>
                        <TextInput label="Nom complet" dark value={fullName} onChangeText={setFullName} />

                        <Text style={styles.label}>Catégorie de boutique</Text>
                        <View style={styles.chipsContainer}>
                            {SHOP_CATEGORIES.map((category) => {
                                const isSelected = category === shopCategory;
                                return (
                                    <Pressable
                                        key={category}
                                        onPress={() => setShopCategory(category)}
                                        style={[styles.chip, isSelected && styles.chipSelected]}
                                    >
                                        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                                            {SHOP_CATEGORY_LABELS[category]}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>

                        <TextInput
                            label="Téléphone"
                            dark
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            keyboardType="phone-pad"
                        />
                        <TextInput label="Adresse" dark value={address} onChangeText={setAddress} />
                        <TextInput label="Ville" dark value={city} onChangeText={setCity} />
                        <TextInput
                            label="Code postal"
                            dark
                            value={postalCode}
                            onChangeText={setPostalCode}
                            keyboardType="number-pad"
                        />
                        <TextInput label="Description" dark value={description} onChangeText={setDescription} multiline />

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
                        <ProfilRow label="Catégorie" value={SHOP_CATEGORY_LABELS[profil.shopCategory]} />
                        <ProfilRow label="Téléphone" value={profil.phoneNumber} />
                        <ProfilRow label="Adresse" value={`${profil.address}, ${profil.city} ${profil.postalCode}`} />
                        {profil.description ? <ProfilRow label="Description" value={profil.description} /> : null}

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
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.darkBackground },
    wrapper: { flex: 1, backgroundColor: colors.darkBackground },
    container: { padding: 20, paddingBottom: 60 },
    email: { fontFamily: fonts.regular, fontSize: 14, color: colors.darkTextSecondary, marginBottom: 24 },
    label: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.darkTextPrimary, marginBottom: 8 },
    chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    chip: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: colors.darkBorder,
    },
    chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
    chipText: { fontFamily: fonts.regular, fontSize: 13, color: colors.darkTextSecondary },
    chipTextSelected: { color: colors.accentText, fontFamily: fonts.semiBold },
    spacedButton: { marginTop: 12 },
    row: { marginBottom: 16 },
    rowLabel: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.darkTextSecondary, marginBottom: 2 },
    rowValue: { fontFamily: fonts.regular, fontSize: 16, color: colors.darkTextPrimary },
    deleteAccountButton: { marginTop: 20, alignItems: 'center' },
    deleteAccountText: { fontFamily: fonts.semiBold, fontSize: 14, color: '#D32F2F' },
});