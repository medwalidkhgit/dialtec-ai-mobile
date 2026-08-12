import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { listerCatalogueParCommercant } from '../../api/produitApi';
import { PublicProduitResponse } from '../../types/produit';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { FournisseursStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<FournisseursStackParamList, 'CommercantCatalogue'>;
type RouteProps = RouteProp<FournisseursStackParamList, 'CommercantCatalogue'>;

export function CommercantCatalogueScreen() {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<RouteProps>();
    const { commercantId, commercantName } = route.params;

    const [produits, setProduits] = useState<PublicProduitResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            listerCatalogueParCommercant(commercantId)
                .then((result) => setProduits(result.content))
                .catch((error) => console.error('Erreur chargement catalogue commerçant', error))
                .finally(() => setIsLoading(false));
        }, [commercantId])
    );

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
                <Text style={styles.backText}>← Retour</Text>
            </TouchableOpacity>

            <Text style={styles.title}>{commercantName}</Text>

            {isLoading ? (
                <ActivityIndicator color={colors.primary} size="large" style={styles.loader} />
            ) : (
                <FlatList
                    data={produits}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>Ce commerçant n'a pas encore de produits.</Text>}
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
    container: { flex: 1, backgroundColor: colors.white, padding: 20 },
    backLink: { marginBottom: 12 },
    backText: { fontFamily: fonts.regular, fontSize: 16, color: colors.primary },
    title: { fontFamily: fonts.bold, fontSize: 22, color: colors.textPrimary, marginBottom: 16 },
    loader: { marginTop: 40 },
    list: { paddingBottom: 40 },
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
    prix: { fontFamily: fonts.regular, fontSize: 14, color: colors.primary },
});