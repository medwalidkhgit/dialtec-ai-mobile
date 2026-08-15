import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Header } from '../../components/Header';
import { listerMonCatalogue } from '../../api/produitApi';
import { ProduitResponse } from '../../types/produit';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { CommercantStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<CommercantStackParamList, 'CatalogueList'>;

export function CatalogueScreen() {
    const navigation = useNavigation<NavigationProp>();
    const [produits, setProduits] = useState<ProduitResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const chargerCatalogue = useCallback(async () => {
        try {
            const result = await listerMonCatalogue();
            setProduits(result.content);
        } catch (error) {
            console.error('Erreur chargement catalogue', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            chargerCatalogue();
        }, [chargerCatalogue])
    );

    function handleRefresh() {
        setIsRefreshing(true);
        chargerCatalogue();
    }

    return (
        <View style={styles.wrapper}>
            <Header role="commercant" />

            {isLoading ? (
                <ActivityIndicator color={colors.accent} size="large" style={styles.loader} />
            ) : (
                <FlatList
                    data={produits}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.accent} />
                    }
                    ListEmptyComponent={
                        <View style={styles.centered}>
                            <Text style={styles.emptyText}>Aucun produit pour l'instant.</Text>
                        </View>
                    }
                    renderItem={({ item }) => {
                        const imagePrincipale = (item.images ?? []).find((img) => img.estPrincipale) ?? item.images?.[0];
                        const stockFaible = item.quantite <= item.seuilAlerte;

                        return (
                            <TouchableOpacity
                                style={styles.card}
                                onPress={() => navigation.navigate('ProduitDetail', { produitId: item.id })}
                            >
                                {imagePrincipale ? (
                                    <Image source={{ uri: imagePrincipale.imageUrl }} style={styles.image} />
                                ) : (
                                    <View style={[styles.image, styles.imagePlaceholder]} />
                                )}

                                <View style={styles.cardContent}>
                                    <Text style={styles.nom} numberOfLines={1}>{item.nom}</Text>
                                    <Text style={styles.prix}>{item.prix ? `${item.prix} MAD` : 'Prix non défini'}</Text>

                                    <View style={styles.badgesRow}>
                                        {item.statut === 'EN_ATTENTE_VALIDATION' && (
                                            <View style={[styles.badge, styles.badgeWarning]}>
                                                <Text style={styles.badgeTextOnAccent}>À valider</Text>
                                            </View>
                                        )}
                                        {stockFaible && (
                                            <View style={[styles.badge, styles.badgeDanger]}>
                                                <Text style={styles.badgeTextOnDanger}>Stock faible</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: colors.darkBackground },
    centered: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
    emptyText: {
        fontFamily: fonts.regular,
        fontSize: 15,
        color: colors.darkTextSecondary,
    },
    loader: { marginTop: 60 },
    list: {
        padding: 16,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: colors.darkSurface,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.darkBorder,
        overflow: 'hidden',
    },
    image: {
        width: 88,
        height: 88,
    },
    imagePlaceholder: {
        backgroundColor: colors.darkBorder,
    },
    cardContent: {
        flex: 1,
        padding: 12,
        justifyContent: 'center',
    },
    nom: {
        fontFamily: fonts.semiBold,
        fontSize: 15,
        color: colors.darkTextPrimary,
        marginBottom: 4,
    },
    prix: {
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.accent,
        marginBottom: 6,
    },
    badgesRow: {
        flexDirection: 'row',
        gap: 6,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    badgeWarning: {
        backgroundColor: colors.accent,
    },
    badgeDanger: {
        backgroundColor: '#D32F2F',
    },
    badgeTextOnAccent: {
        fontFamily: fonts.semiBold,
        fontSize: 11,
        color: colors.accentText,
    },
    badgeTextOnDanger: {
        fontFamily: fonts.semiBold,
        fontSize: 11,
        color: colors.white,
    },
});