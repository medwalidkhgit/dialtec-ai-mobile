import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Button } from '../../components/Button';
import { TextInput } from '../../components/TextInput';
import {
    consulterMonProduit,
    modifierProduit,
    validerProduit,
    mettreAJourStock,
    supprimerImage,
    ajouterImage,
    supprimerProduit,
} from '../../api/produitApi';
import { uploadPhoto } from '../../api/mediaApi';
import { ProduitResponse } from '../../types/produit';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { CommercantStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<CommercantStackParamList, 'ProduitDetail'>;
type RouteProps = RouteProp<CommercantStackParamList, 'ProduitDetail'>;

export function ProduitDetailScreen() {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<RouteProps>();
    const insets = useSafeAreaInsets();
    const { produitId } = route.params;

    const [produit, setProduit] = useState<ProduitResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isAddingImage, setIsAddingImage] = useState(false);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
    const [isDeletingSelection, setIsDeletingSelection] = useState(false);

    const [nom, setNom] = useState('');
    const [description, setDescription] = useState('');
    const [categorie, setCategorie] = useState('');
    const [caracteristiques, setCaracteristiques] = useState('');
    const [prix, setPrix] = useState('');

    const [quantite, setQuantite] = useState('');
    const [seuilAlerte, setSeuilAlerte] = useState('');

    const chargerProduit = useCallback(async () => {
        try {
            const data = await consulterMonProduit(produitId);
            console.log('[chargerProduit] nombre d\'images reçues:', (data.images ?? []).length, JSON.stringify(data.images));
            setProduit(data);
            setNom(data.nom);
            setDescription(data.description);
            setCategorie(data.categorie);
            setCaracteristiques(data.caracteristiques ?? '');
            setPrix(data.prix?.toString() ?? '');
            setQuantite(data.quantite.toString());
            setSeuilAlerte(data.seuilAlerte.toString());
        } catch (error) {
            console.error('Erreur chargement produit', error);
        } finally {
            setIsLoading(false);
        }
    }, [produitId]);

    useFocusEffect(
        useCallback(() => {
            chargerProduit();
        }, [chargerProduit])
    );

    async function handleSaveEdit() {
        setIsSaving(true);
        try {
            await modifierProduit(produitId, {
                nom,
                description,
                categorie,
                caracteristiques: caracteristiques || null,
                prix: prix ? parseFloat(prix) : null,
            });
            await chargerProduit();
            setIsEditing(false);
        } catch (error: any) {
            const message = error?.response?.data?.message ?? "Impossible d'enregistrer les modifications.";
            Alert.alert('Erreur', message);
        } finally {
            setIsSaving(false);
        }
    }

    async function handleValider() {
        setIsSaving(true);
        try {
            await validerProduit(produitId);
            await chargerProduit();
        } catch (error: any) {
            const message = error?.response?.data?.message ?? 'Impossible de valider la fiche.';
            Alert.alert('Erreur', message);
        } finally {
            setIsSaving(false);
        }
    }

    async function handleSaveStock() {
        setIsSaving(true);
        try {
            await mettreAJourStock(produitId, parseInt(quantite, 10), parseInt(seuilAlerte, 10));
            await chargerProduit();
        } catch (error: any) {
            const message = error?.response?.data?.message ?? 'Impossible de mettre à jour le stock.';
            Alert.alert('Erreur', message);
        } finally {
            setIsSaving(false);
        }
    }

    async function handleSupprimerImage(imageId: string) {
        try {
            await supprimerImage(produitId, imageId);
            await chargerProduit();
        } catch (error: any) {
            const message = error?.response?.data?.message ?? "Impossible de supprimer l'image.";
            Alert.alert('Erreur', message);
        }
    }

    function toggleSelectionMode() {
        setSelectionMode((prev) => !prev);
        setSelectedImageIds([]);
    }

    function toggleImageSelectionnee(imageId: string) {
        setSelectedImageIds((prev) =>
            prev.includes(imageId) ? prev.filter((id) => id !== imageId) : [...prev, imageId]
        );
    }

    async function handleSupprimerSelection() {
        if (selectedImageIds.length === 0) return;

        Alert.alert(
            'Supprimer les photos',
            `Supprimer définitivement ${selectedImageIds.length} photo(s) sélectionnée(s) ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        setIsDeletingSelection(true);
                        try {
                            // Le backend ne propose pas de suppression groupée en un seul
                            // appel — on déclenche donc les suppressions en parallèle,
                            // puis on recharge une seule fois à la fin.
                            await Promise.all(selectedImageIds.map((id) => supprimerImage(produitId, id)));
                            await chargerProduit();
                            setSelectionMode(false);
                            setSelectedImageIds([]);
                        } catch (error: any) {
                            const message = error?.response?.data?.message ?? "Certaines images n'ont pas pu être supprimées.";
                            Alert.alert('Erreur', message);
                            await chargerProduit();
                        } finally {
                            setIsDeletingSelection(false);
                        }
                    },
                },
            ]
        );
    }

    async function handleAjouterImage() {
        Alert.alert(
            'Ajouter une photo',
            'Comment veux-tu ajouter cette photo ?',
            [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Prendre une photo', onPress: () => lancerCapture('camera') },
                { text: 'Choisir depuis la galerie', onPress: () => lancerCapture('galerie') },
            ]
        );
    }

    async function lancerCapture(source: 'camera' | 'galerie') {
        let result;
        if (source === 'camera') {
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (!permission.granted) {
                Alert.alert('Permission requise', "L'accès à la caméra est nécessaire.");
                return;
            }
            result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true });
        } else {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                Alert.alert('Permission requise', "L'accès à la galerie est nécessaire.");
                return;
            }
            result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true });
        }
        console.log('[ajout photo] résultat picker:', JSON.stringify({ canceled: result.canceled }));
        if (result.canceled) {
            console.log('[ajout photo] annulé par le picker — sortie ici, avant même le try/catch');
            return;
        }

        setIsAddingImage(true);
        try {
            // Sur iOS, une photo choisie dans la galerie (contrairement à la
            // caméra) peut avoir une adresse spéciale (ph://...), pas un vrai
            // fichier local — cette normalisation la convertit systématiquement
            // en fichier classique, exploitable pour l'upload.
            const normalized = await ImageManipulator.manipulateAsync(result.assets[0].uri, [], {
                compress: 0.8,
                format: ImageManipulator.SaveFormat.JPEG,
            });
            console.log('[ajout photo] normalisation OK, uri:', normalized.uri);

            const uploaded = await uploadPhoto(normalized.uri);
            console.log('[ajout photo] upload OK:', JSON.stringify(uploaded));

            await ajouterImage(produitId, uploaded.url, uploaded.key);
            console.log('[ajout photo] ajout en base OK');

            await chargerProduit();
            console.log('[ajout photo] rechargement OK');
        } catch (error) {
            console.error('Erreur ajout image', error);
            Alert.alert('Erreur', "Impossible d'ajouter cette image.");
        } finally {
            setIsAddingImage(false);
        }
    }

    function handleSupprimerProduit() {
        Alert.alert('Supprimer ce produit ?', 'Cette action est définitive et supprimera aussi ses images.', [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Supprimer',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await supprimerProduit(produitId);
                        navigation.goBack();
                    } catch (error: any) {
                        const message = error?.response?.data?.message ?? 'Impossible de supprimer le produit.';
                        Alert.alert('Erreur', message);
                    }
                },
            },
        ]);
    }

    if (isLoading || !produit) {
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

            <View style={styles.imagesHeaderRow}>
                <Text style={styles.sectionLabel}>Photos</Text>
                {(produit.images ?? []).length > 0 && (
                    <TouchableOpacity onPress={toggleSelectionMode}>
                        <Text style={styles.selectionToggleText}>{selectionMode ? 'Annuler' : 'Gérer les photos'}</Text>
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesRow}>
                {(produit.images ?? []).map((image) => {
                    const estSelectionnee = selectedImageIds.includes(image.id);
                    return (
                        <TouchableOpacity
                            key={image.id}
                            style={styles.imageWrapper}
                            activeOpacity={selectionMode ? 0.7 : 1}
                            onPress={() => selectionMode && toggleImageSelectionnee(image.id)}
                        >
                            <Image
                                source={{ uri: image.imageUrl }}
                                onError={(e) => console.log('[Image] ÉCHEC CHARGEMENT:', image.imageUrl, JSON.stringify(e.nativeEvent))}
                                onLoad={() => console.log('[Image] succès:', image.imageUrl)}
                                style={[styles.image, selectionMode && estSelectionnee && styles.imageSelectionnee]}
                            />
                            {selectionMode ? (
                                <View style={[styles.checkboxBadge, estSelectionnee && styles.checkboxBadgeCochee]}>
                                    {estSelectionnee && <Text style={styles.checkboxCheckmark}>✓</Text>}
                                </View>
                            ) : (
                                <TouchableOpacity style={styles.deleteImageButton} onPress={() => handleSupprimerImage(image.id)}>
                                    <Text style={styles.deleteImageText}>✕</Text>
                                </TouchableOpacity>
                            )}
                        </TouchableOpacity>
                    );
                })}

                {!selectionMode && (
                    <TouchableOpacity style={styles.addImageButton} onPress={handleAjouterImage} disabled={isAddingImage}>
                        {isAddingImage ? (
                            <ActivityIndicator color={colors.accent} />
                        ) : (
                            <Text style={styles.addImageText}>+</Text>
                        )}
                    </TouchableOpacity>
                )}
            </ScrollView>

            {selectionMode && (
                <View style={styles.selectionActionBar}>
                    <Text style={styles.selectionCountText}>
                        {selectedImageIds.length} sélectionnée{selectedImageIds.length > 1 ? 's' : ''}
                    </Text>
                    <Button
                        title="Supprimer"
                        variant="danger"
                        onPress={handleSupprimerSelection}
                        loading={isDeletingSelection}
                        disabled={selectedImageIds.length === 0}
                    />
                </View>
            )}

            {produit.statut === 'EN_ATTENTE_VALIDATION' && (
                <View style={styles.pendingBanner}>
                    <Text style={styles.pendingText}>Cette fiche n'est pas encore validée.</Text>
                    <Button title="Valider" variant="accent" onPress={handleValider} loading={isSaving} />
                </View>
            )}

            {isEditing ? (
                <>
                    <TextInput label="Nom" dark value={nom} onChangeText={setNom} />
                    <TextInput label="Description" dark value={description} onChangeText={setDescription} multiline />
                    <TextInput label="Catégorie" dark value={categorie} onChangeText={setCategorie} />
                    <TextInput
                        label="Caractéristiques"
                        dark
                        value={caracteristiques}
                        onChangeText={setCaracteristiques}
                        multiline
                    />
                    <TextInput label="Prix (MAD)" dark value={prix} onChangeText={setPrix} keyboardType="decimal-pad" />

                    <Button title="Enregistrer" onPress={handleSaveEdit} loading={isSaving} />
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
                    <Text style={styles.nom}>{produit.nom}</Text>
                    <Text style={styles.prix}>{produit.prix ? `${produit.prix} MAD` : 'Prix non défini'}</Text>
                    <Text style={styles.categorie}>{produit.categorie}</Text>
                    <Text style={styles.description}>{produit.description}</Text>
                    {produit.caracteristiques ? <Text style={styles.description}>{produit.caracteristiques}</Text> : null}

                    <Button
                        title="Modifier"
                        variant="outline"
                        dark
                        onPress={() => setIsEditing(true)}
                        style={styles.spacedButton}
                    />
                </>
            )}

            <View style={styles.stockSection}>
                <Text style={styles.sectionTitle}>Stock</Text>
                <TextInput label="Quantité" dark value={quantite} onChangeText={setQuantite} keyboardType="number-pad" />
                <TextInput
                    label="Seuil d'alerte"
                    dark
                    value={seuilAlerte}
                    onChangeText={setSeuilAlerte}
                    keyboardType="number-pad"
                />
                <Button title="Mettre à jour le stock" variant="outline" dark onPress={handleSaveStock} loading={isSaving} />
            </View>

            <TouchableOpacity onPress={handleSupprimerProduit} style={styles.deleteProductButton}>
                <Text style={styles.deleteProductText}>Supprimer ce produit</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.darkBackground },
    wrapper: { flex: 1, backgroundColor: colors.darkBackground },
    container: { padding: 20, paddingBottom: 60 },
    backLink: { marginBottom: 16 },
    backText: { fontFamily: fonts.regular, fontSize: 16, color: colors.accent },
    imagesHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionLabel: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.darkTextPrimary },
    selectionToggleText: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.accent },
    imagesRow: { marginBottom: 16 },
    imageWrapper: { marginRight: 10, position: 'relative' },
    image: { width: 140, height: 140, borderRadius: 12 },
    imageSelectionnee: { opacity: 0.5 },
    checkboxBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.white,
        backgroundColor: colors.black + '55',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxBadgeCochee: {
        backgroundColor: colors.accent,
        borderColor: colors.accent,
    },
    checkboxCheckmark: { color: colors.white, fontSize: 13, fontFamily: fonts.bold },
    selectionActionBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.darkSurface,
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
    },
    selectionCountText: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.darkTextPrimary },
    deleteImageButton: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: colors.black + 'CC',
        borderRadius: 12,
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteImageText: { color: colors.white, fontSize: 13, fontFamily: fonts.bold },
    addImageButton: {
        width: 140,
        height: 140,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: colors.darkBorder,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addImageText: { fontFamily: fonts.bold, fontSize: 32, color: colors.accent },
    pendingBanner: {
        backgroundColor: colors.darkSurface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.accent + '40',
    },
    pendingText: {
        fontFamily: fonts.semiBold,
        fontSize: 14,
        color: colors.darkTextPrimary,
        marginBottom: 12,
    },
    nom: { fontFamily: fonts.bold, fontSize: 22, color: colors.darkTextPrimary, marginBottom: 6 },
    prix: { fontFamily: fonts.semiBold, fontSize: 18, color: colors.accent, marginBottom: 4 },
    categorie: { fontFamily: fonts.regular, fontSize: 14, color: colors.darkTextSecondary, marginBottom: 12 },
    description: {
        fontFamily: fonts.regular,
        fontSize: 15,
        color: colors.darkTextPrimary,
        marginBottom: 8,
        lineHeight: 22,
    },
    spacedButton: { marginTop: 12 },
    sectionTitle: {
        fontFamily: fonts.bold,
        fontSize: 17,
        color: colors.darkTextPrimary,
        marginTop: 28,
        marginBottom: 12,
    },
    stockSection: { marginTop: 8 },
    deleteProductButton: { marginTop: 32, alignItems: 'center' },
    deleteProductText: { fontFamily: fonts.semiBold, fontSize: 15, color: '#D32F2F' },
});