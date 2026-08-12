import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { consulterProduitPublic } from '../../api/produitApi';
import { PublicProduitResponse } from '../../types/produit';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { ClientCatalogueStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<ClientCatalogueStackParamList, 'ProduitDetailPublic'>;
type RouteProps = RouteProp<ClientCatalogueStackParamList, 'ProduitDetailPublic'>;

export function ProduitDetailScreen() {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<RouteProps>();
    const { produitId } = route.params;

    const [produit, setProduit] = useState<PublicProduitResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        consulterProduitPublic(produitId)
            .then(setProduit)
            .catch((error) => console.error('Erreur chargement produit', error))
            .finally(() => setIsLoading(false));
    }, [produitId]);

    if (isLoading || !produit) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator color={colors.primary} size="large" />
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
                <Text style={styles.backText}>← Retour</Text>
            </TouchableOpacity>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesRow}>
                {produit.images.map((image) => (
                    <Image key={image.id} source={{ uri: image.imageUrl }} style={styles.image} />
                ))}
            </ScrollView>

            <Text style={styles.nom}>{produit.nom}</Text>
            <Text style={styles.prix}>{produit.prix ? `${produit.prix} MAD` : 'Prix non défini'}</Text>
            <Text style={styles.categorie}>{produit.categorie}</Text>
            <Text style={styles.description}>{produit.description}</Text>
            {produit.caracteristiques ? <Text style={styles.description}>{produit.caracteristiques}</Text> : null}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    container: { padding: 20, paddingBottom: 60 },
    backLink: { marginBottom: 16 },
    backText: { fontFamily: fonts.regular, fontSize: 16, color: colors.primary },
    imagesRow: { marginBottom: 16 },
    image: { width: 200, height: 200, borderRadius: 12, marginRight: 10 },
    nom: { fontFamily: fonts.bold, fontSize: 22, color: colors.textPrimary, marginBottom: 6 },
    prix: { fontFamily: fonts.semiBold, fontSize: 18, color: colors.primary, marginBottom: 4 },
    categorie: { fontFamily: fonts.regular, fontSize: 14, color: colors.marine, marginBottom: 12 },
    description: { fontFamily: fonts.regular, fontSize: 15, color: colors.textPrimary, marginBottom: 8, lineHeight: 22 },
});