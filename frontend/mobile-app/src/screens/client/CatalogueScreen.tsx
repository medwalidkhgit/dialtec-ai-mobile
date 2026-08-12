import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TextInput } from '../../components/TextInput';
import { listerCataloguePublic } from '../../api/produitApi';
import { PublicProduitResponse } from '../../types/produit';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { ClientCatalogueStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<ClientCatalogueStackParamList, 'CatalogueList'>;

export function CatalogueScreen() {
    const navigation = useNavigation<NavigationProp>();
    const [produits, setProduits] = useState<PublicProduitResponse[]>([]);
    const [recherche, setRecherche] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const charger = useCallback(async (nom?: string) => {
        try {
            const result = await listerCataloguePublic(nom || undefined);
            setProduits(result.content);
        } catch (error) {
            console.error('Erreur chargement catalogue public', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            charger(recherche);
        }, [charger])
    );

    function handleRefresh() {
        setIsRefreshing(true);
        charger(recherche);
    }

    function handleRechercheSubmit() {
        setIsLoading(true);
        charger(recherche);
    }

    return (
        <View style={styles.wrapper}>
            <View style={styles.searchContainer}>
                <TextInput
                    label="Rechercher"
                    value={recherche}
                    onChangeText={setRecherche}
                    placeholder="Nom du produit..."
                    onSubmitEditing={handleRechercheSubmit}
                    returnKeyType="search"
                />
            </View>

            {isLoading ? (
                <ActivityIndicator color={colors.primary} size="large" style={styles.loader} />
            ) : (
                <FlatList
                    data={produits}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
                    ListEmptyComponent={<Text style={styles.emptyText}>Aucun produit trouvé.</Text>}
                    renderItem={({ item }) => {
                        const image = item.images.find((img) => img.estPrincipale) ?? item.images[0];
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
                                    <Text style={styles.categorie}>{item.categorie}</Text>
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
    wrapper: { flex: 1, backgroundColor: colors.white },
    searchContainer: { paddingHorizontal: 16, paddingTop: 16 },
    loader: { marginTop: 60 },
    list: { padding: 16 },
    emptyText: { fontFamily: fonts.regular, fontSize: 15, color: colors.marine, textAlign: 'center', marginTop: 40 },
    card: {
        flexDirection: 'row',
        backgroundColor: colors.white,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.marine + '20',
        overflow: 'hidden',
    },
    image: { width: 88, height: 88 },
    imagePlaceholder: { backgroundColor: colors.marine + '15' },
    cardContent: { flex: 1, padding: 12, justifyContent: 'center' },
    nom: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.textPrimary, marginBottom: 4 },
    prix: { fontFamily: fonts.regular, fontSize: 14, color: colors.primary, marginBottom: 2 },
    categorie: { fontFamily: fonts.regular, fontSize: 12, color: colors.marine },
});