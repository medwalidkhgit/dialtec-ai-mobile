import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { consulterCommercantAdmin, bloquerCompte, debloquerCompte, supprimerCompteAdmin } from '../../api/userApi';
import { CommercantProfileResponse } from '../../types/user';
import { SHOP_CATEGORY_LABELS } from '../../constants/shopCategories';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { CommercantsStackParamList } from '../../navigation/types';

const statusLabels: Record<string, string> = {
    ACTIF: 'Actif',
    BLOQUE: 'Bloqué',
    EN_ATTENTE_VERIFICATION: 'En attente',
};

const statusColors: Record<string, string> = {
    ACTIF: '#2E7D32',
    BLOQUE: '#D32F2F',
    EN_ATTENTE_VERIFICATION: colors.gold,
};

const statusTextColors: Record<string, string> = {
    ACTIF: colors.white,
    BLOQUE: colors.white,
    EN_ATTENTE_VERIFICATION: colors.black,
};

type NavigationProp = NativeStackNavigationProp<CommercantsStackParamList, 'CommercantDetailAdmin'>;
type RouteProps = RouteProp<CommercantsStackParamList, 'CommercantDetailAdmin'>;

export function CommercantDetailScreen() {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<RouteProps>();
    const insets = useSafeAreaInsets();
    const { commercantId } = route.params;

    const [commercant, setCommercant] = useState<CommercantProfileResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActing, setIsActing] = useState(false);

    const charger = useCallback(() => {
        consulterCommercantAdmin(commercantId)
            .then(setCommercant)
            .catch((error) => console.error('Erreur chargement commerçant', error))
            .finally(() => setIsLoading(false));
    }, [commercantId]);

    useFocusEffect(
        useCallback(() => {
            charger();
        }, [charger])
    );

    async function handleToggleBlock() {
        if (!commercant) return;
        setIsActing(true);
        try {
            if (commercant.accountStatus === 'BLOQUE') {
                await debloquerCompte(commercantId);
            } else {
                await bloquerCompte(commercantId);
            }
            charger();
        } catch (error: any) {
            const message = error?.response?.data?.message ?? "Impossible d'effectuer cette action.";
            Alert.alert('Erreur', message);
        } finally {
            setIsActing(false);
        }
    }

    function handleDelete() {
        Alert.alert('Supprimer ce compte ?', 'Cette action est définitive et supprimera toutes les données associées.', [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Supprimer',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await supprimerCompteAdmin(commercantId);
                        navigation.goBack();
                    } catch (error: any) {
                        const message = error?.response?.data?.message ?? 'Impossible de supprimer ce compte.';
                        Alert.alert('Erreur', message);
                    }
                },
            },
        ]);
    }

    if (isLoading || !commercant) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator color={colors.accent} size="large" />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.wrapper}
            contentContainerStyle={[styles.container, { paddingTop: insets.top + 20 }]}
        >
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
                <Text style={styles.backText}>← Retour</Text>
            </TouchableOpacity>

            <View style={styles.headerBlock}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{commercant.fullName?.charAt(0)?.toUpperCase() ?? '?'}</Text>
                </View>
                <Text style={styles.nom}>{commercant.fullName}</Text>
                <Text style={styles.email}>{commercant.email}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColors[commercant.accountStatus] }]}>
                    <Text style={[styles.statusText, { color: statusTextColors[commercant.accountStatus] }]}>
                        {statusLabels[commercant.accountStatus]}
                    </Text>
                </View>
            </View>

            <View style={styles.infoBlock}>
                <InfoRow label="Catégorie" value={SHOP_CATEGORY_LABELS[commercant.shopCategory]} />
                <InfoRow label="Téléphone" value={commercant.phoneNumber} />
                <InfoRow label="Adresse" value={`${commercant.address}, ${commercant.city} ${commercant.postalCode}`} dernier />
            </View>

            <Button
                title={commercant.accountStatus === 'BLOQUE' ? 'Débloquer ce compte' : 'Bloquer ce compte'}
                variant="outline"
                dark
                onPress={handleToggleBlock}
                loading={isActing}
            />

            <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                <Text style={styles.deleteText}>Supprimer ce compte</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

function InfoRow({ label, value, dernier }: { label: string; value: string; dernier?: boolean }) {
    return (
        <View style={[styles.row, dernier && styles.rowDernier]}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.darkBackground },
    wrapper: { flex: 1, backgroundColor: colors.darkBackground },
    container: { padding: 20, paddingBottom: 60 },
    backLink: { marginBottom: 16 },
    backText: { fontFamily: fonts.regular, fontSize: 16, color: colors.accent },
    nom: { fontFamily: fonts.bold, fontSize: 20, color: colors.darkTextPrimary, marginBottom: 4 },
    email: { fontFamily: fonts.regular, fontSize: 14, color: colors.darkTextSecondary, marginBottom: 10 },
    headerBlock: { alignItems: 'center', marginBottom: 24 },
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
    statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
    statusText: { fontFamily: fonts.semiBold, fontSize: 12 },
    infoBlock: {
        backgroundColor: colors.darkSurface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.darkBorder,
        padding: 18,
        marginBottom: 28,
    },
    row: {
        paddingBottom: 12,
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.darkBorder,
    },
    rowDernier: { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 },
    rowLabel: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.darkTextSecondary, marginBottom: 3 },
    rowValue: { fontFamily: fonts.regular, fontSize: 15, color: colors.darkTextPrimary },
    deleteButton: { marginTop: 24, alignItems: 'center' },
    deleteText: { fontFamily: fonts.semiBold, fontSize: 14, color: '#D32F2F' },
});