import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { listerCatalogueParCommercant } from '../../api/produitApi';
import { PublicProduitResponse } from '../../types/produit';
import { SHOP_CATEGORY_LABELS } from '../../constants/shopCategories';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { FournisseursStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<FournisseursStackParamList, 'CommercantCatalogue'>;
type RouteProps = RouteProp<FournisseursStackParamList, 'CommercantCatalogue'>;

export function CommercantCatalogueScreen() {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<RouteProps>();
    const insets = useSafeAreaInsets();
    const { commercant } = route.params;

    const [produits, setProduits] = useState<PublicProduitResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            listerCatalogueParCommercant(commercant.id)
                .then((result) => setProduits(result.content))
                .catch((error) => console.error('Erreur chargement catalogue commerçant', error))
                .finally(() => setIsLoading(false));
        }, [commercant.id])
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
                <Text style={styles.backText}>← Retour</Text>
            </TouchableOpacity>

            <View style={styles.headerCard}>
                <Text style={styles.nom}>{commercant.fullName}</Text>
                <Text style={styles.categorie}>{SHOP_CATEGORY_LABELS[commercant.shopCategory]}</Text>
                <Text style={styles.detail}>{commercant.address}, {commercant.city} {commercant.postalCode}</Text>
                {commercant.description ? <Text style={styles.description}>{commercant.description}</Text> : null}
            </View>

            {isLoading ? (
                <ActivityIndicator color={colors.accent} size="large" style={styles.loader} />
            ) : (
                <FlatList
                    data={produits}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>Ce commerçant n'a pas encore de produits.</Text>}
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
                                    <Text style={styles.produitNom} numberOfLines={1}>{item.nom}</Text>
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
    container: { flex: 1, backgroundColor: colors.darkBackground, paddingHorizontal: 20 },
    backLink: { marginBottom: 12 },
    backText: { fontFamily: fonts.regular, fontSize: 16, color: colors.accent },
    headerCard: {
        backgroundColor: colors.darkSurface,
        borderRadius: 16,
        padding: 18,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.darkBorder,
    },
    nom: { fontFamily: fonts.bold, fontSize: 20, color: colors.darkTextPrimary, marginBottom: 4 },
    categorie: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.accent, marginBottom: 8 },
    detail: { fontFamily: fonts.regular, fontSize: 13, color: colors.darkTextSecondary, marginBottom: 6 },
    description: { fontFamily: fonts.regular, fontSize: 13, color: colors.darkTextSecondary, lineHeight: 18 },
    loader: { marginTop: 40 },
    list: { paddingBottom: 40 },
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
    produitNom: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.darkTextPrimary, marginBottom: 4 },
    prix: { fontFamily: fonts.regular, fontSize: 14, color: colors.accent },
});