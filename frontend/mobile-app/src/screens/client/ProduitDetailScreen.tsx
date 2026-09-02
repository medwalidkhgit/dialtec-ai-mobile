import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ImageView from 'react-native-image-viewing';
import { consulterProduitPublic } from '../../api/produitApi';
import { PublicProduitResponse } from '../../types/produit';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { ClientCatalogueStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<ClientCatalogueStackParamList, 'ProduitDetailPublic'>;
type RouteProps = RouteProp<ClientCatalogueStackParamList, 'ProduitDetailPublic'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function ProduitDetailScreen() {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<RouteProps>();
    const insets = useSafeAreaInsets();
    const { produitId } = route.params;

    const [produit, setProduit] = useState<PublicProduitResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [indexPhotoActuelle, setIndexPhotoActuelle] = useState(0);
    const [zoomVisible, setZoomVisible] = useState(false);

    useEffect(() => {
        consulterProduitPublic(produitId)
            .then(setProduit)
            .catch((error) => console.error('Erreur chargement produit', error))
            .finally(() => setIsLoading(false));
    }, [produitId]);

    function handleScrollPhotos(event: NativeSyntheticEvent<NativeScrollEvent>) {
        const nouvelIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
        setIndexPhotoActuelle(nouvelIndex);
    }

    if (isLoading || !produit) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator color={colors.accent} size="large" />
            </View>
        );
    }

    const images = produit.images ?? [];
    // Le composant de zoom attend un tableau au format {uri}, pas
    // directement nos objets ProduitImage — conversion simple, sans
    // toucher aux données d'origine.
    const imagesPourZoom = images.map((image) => ({ uri: image.imageUrl }));

    return (
        <ScrollView style={styles.wrapper} contentContainerStyle={[styles.container, { paddingTop: insets.top + 20 }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
                <Text style={styles.backText}>← Retour</Text>
            </TouchableOpacity>

            <View style={styles.carouselWrapper}>
                <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleScrollPhotos}
                    scrollEventThrottle={16}
                >
                    {images.map((image, index) => (
                        <TouchableOpacity
                            key={image.id}
                            activeOpacity={0.9}
                            onPress={() => {
                                setIndexPhotoActuelle(index);
                                setZoomVisible(true);
                            }}
                        >
                            <Image source={{ uri: image.imageUrl }} style={styles.imagePleinEcran} />
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {images.length > 1 && (
                    <View style={styles.dotsRow}>
                        {images.map((image, index) => (
                            <View
                                key={image.id}
                                style={[styles.dot, index === indexPhotoActuelle && styles.dotActif]}
                            />
                        ))}
                    </View>
                )}

                {images.length > 0 && (
                    <View style={styles.zoomIndicateur}>
                        <Text style={styles.zoomIndicateurTexte}>🔍 Toucher pour zoomer</Text>
                    </View>
                )}
            </View>

            <View style={styles.categorieBadge}>
                <Text style={styles.categorieBadgeText}>{produit.categorie}</Text>
            </View>

            <Text style={styles.nom}>{produit.nom}</Text>
            <Text style={styles.prix}>{produit.prix ? `${produit.prix} MAD` : 'Prix non défini'}</Text>

            <View style={styles.descriptionCard}>
                <Text style={styles.description}>{produit.description}</Text>
                {produit.caracteristiques ? (
                    <>
                        <View style={styles.separateur} />
                        <Text style={styles.description}>{produit.caracteristiques}</Text>
                    </>
                ) : null}
            </View>

            {/* Visionneuse plein écran — zoom par pincement, double-tap, et
          glissement entre les photos, activée en touchant une image. */}
            <ImageView
                images={imagesPourZoom}
                imageIndex={indexPhotoActuelle}
                visible={zoomVisible}
                onRequestClose={() => setZoomVisible(false)}
                onImageIndexChange={setIndexPhotoActuelle}
                doubleTapToZoomEnabled
                swipeToCloseEnabled
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: colors.darkBackground },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.darkBackground },
    container: { padding: 20, paddingBottom: 60 },
    backLink: { marginBottom: 16 },
    backText: { fontFamily: fonts.regular, fontSize: 16, color: colors.accent },
    carouselWrapper: {
        marginHorizontal: -20, // compense le padding du conteneur parent, pour un vrai plein écran
        marginBottom: 20,
        position: 'relative',
    },
    imagePleinEcran: { width: SCREEN_WIDTH, height: SCREEN_WIDTH, resizeMode: 'cover' },
    dotsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10,
        gap: 6,
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: colors.darkBorder,
    },
    dotActif: {
        backgroundColor: colors.accent,
        width: 18,
    },
    zoomIndicateur: {
        position: 'absolute',
        bottom: 22,
        right: 20,
        backgroundColor: colors.black + '99',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    zoomIndicateurTexte: { fontFamily: fonts.regular, fontSize: 12, color: colors.white },
    categorieBadge: {
        alignSelf: 'flex-start',
        backgroundColor: colors.bleuNuit,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 10,
    },
    categorieBadgeText: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.white },
    nom: { fontFamily: fonts.bold, fontSize: 22, color: colors.darkTextPrimary, marginBottom: 6 },
    prix: { fontFamily: fonts.bold, fontSize: 20, color: colors.accent, marginBottom: 16 },
    descriptionCard: {
        backgroundColor: colors.darkSurface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.darkBorder,
        padding: 16,
    },
    separateur: { height: 1, backgroundColor: colors.darkBorder, marginVertical: 12 },
    description: {
        fontFamily: fonts.regular,
        fontSize: 15,
        color: colors.darkTextPrimary,
        lineHeight: 22,
    },
});