import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TextInput } from '../../components/TextInput';
import { Header } from '../../components/Header';
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

    // Note pour plus tard : un filtre par TYPE DE BOUTIQUE (pas par
    // catégorie de produit, qui est un texte libre généré par l'IA et donc
    // incompatible avec une liste fixe) serait une vraie amélioration
    // future — mais nécessite un appel entre product-service et
    // user-service (la catégorie de boutique n'est connue que de
    // user-service), un vrai chantier backend, pas fait ce soir.
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
            <Header role="client" />

            <View style={styles.searchContainer}>
                <TextInput
                    label="Rechercher"
                    dark
                    value={recherche}
                    onChangeText={setRecherche}
                    placeholder="Recherche par nom du produit..."
                    onSubmitEditing={handleRechercheSubmit}
                    returnKeyType="search"
                />
            </View>

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
                    ListEmptyComponent={<Text style={styles.emptyText}>Aucun produit trouvé.</Text>}
                    renderItem={({ item }) => {
                        const image = (item.images ?? []).find((img) => img.estPrincipale) ?? item.images?.[0];
                        return (
                            <TouchableOpacity
                                style={styles.card}
                                activeOpacity={0.75}
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
    wrapper: { flex: 1, backgroundColor: colors.darkBackground },
    searchContainer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
    loader: { marginTop: 60 },
    list: { padding: 16 },
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
        borderRadius: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.darkBorder,
        overflow: 'hidden',
    },
    image: { width: 100, height: 100 },
    imagePlaceholder: { backgroundColor: colors.darkBorder },
    cardContent: { flex: 1, padding: 12, justifyContent: 'center' },
    nom: { fontFamily: fonts.bold, fontSize: 16, color: colors.darkTextPrimary, marginBottom: 4 },
    prix: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.accent, marginBottom: 4 },
    categorie: { fontFamily: fonts.regular, fontSize: 12, color: colors.darkTextSecondary },
});