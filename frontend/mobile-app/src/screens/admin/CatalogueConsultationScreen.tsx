import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Header } from '../../components/Header';
import { listerCataloguePublic } from '../../api/produitApi';
import { PublicProduitResponse } from '../../types/produit';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { AdminCatalogueStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<AdminCatalogueStackParamList, 'CatalogueConsultation'>;

export function CatalogueConsultationScreen() {
    const navigation = useNavigation<NavigationProp>();
    const [produits, setProduits] = useState<PublicProduitResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const charger = useCallback(async () => {
        try {
            const result = await listerCataloguePublic();
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
            charger();
        }, [charger])
    );

    function handleRefresh() {
        setIsRefreshing(true);
        charger();
    }

    return (
        <View style={styles.wrapper}>
            <Header role="admin" />

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
                    ListHeaderComponent={<Text style={styles.title}>Catalogue global</Text>}
                    ListEmptyComponent={<Text style={styles.emptyText}>Aucun produit sur la plateforme.</Text>}
                    renderItem={({ item }) => {
                        const image = (item.images ?? []).find((img) => img.estPrincipale) ?? item.images?.[0];
                        return (
                            <TouchableOpacity
                                style={styles.card}
                                onPress={() => navigation.navigate('ProduitDetailPublic', { produitId: item.id })}
                            >
                                {image ? (
                                    <Image source={{ uri: image.imageUrl }} style={styles.image} />
                                ) : (
                                    <View style={[styles.image, styles.imagePlaceholder]} />
                                )}
                                <View style={styles.cardContent}>
                                    <Text style={styles.nom} numberOfLines={1}>{item.nom}</Text>
                                    <Text style={styles.prix}>{item.prix ? `${item.prix} MAD` : 'Prix non défini'}</Text>
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
    loader: { marginTop: 60 },
    list: { padding: 20 },
    title: { fontFamily: fonts.bold, fontSize: 24, color: colors.darkTextPrimary, marginBottom: 16 },
    emptyText: {
        fontFamily: fonts.regular,
        fontSize: 15,
        color: colors.darkTextSecondary,
        textAlign: 'center',
        marginTop: 40,
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
    image: { width: 88, height: 88 },
    imagePlaceholder: { backgroundColor: colors.darkBorder },
    cardContent: { flex: 1, padding: 12, justifyContent: 'center' },
    nom: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.darkTextPrimary, marginBottom: 4 },
    prix: { fontFamily: fonts.regular, fontSize: 14, color: colors.accent },
});