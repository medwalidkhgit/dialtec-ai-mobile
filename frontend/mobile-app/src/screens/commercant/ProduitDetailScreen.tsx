import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import { TextInput } from '../../components/TextInput';
import {
    consulterMonProduit,
    modifierProduit,
    validerProduit,
    mettreAJourStock,
    supprimerImage,
    supprimerProduit,
} from '../../api/produitApi';
import { ProduitResponse } from '../../types/produit';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { CommercantStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<CommercantStackParamList, 'ProduitDetail'>;
type RouteProps = RouteProp<CommercantStackParamList, 'ProduitDetail'>;

export function ProduitDetailScreen() {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<RouteProps>();
    const { produitId } = route.params;

    const [produit, setProduit] = useState<ProduitResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

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
        } catch {
            Alert.alert('Erreur', "Impossible d'enregistrer les modifications.");
        } finally {
            setIsSaving(false);
        }
    }

    async function handleValider() {
        setIsSaving(true);
        try {
            await validerProduit(produitId);
            await chargerProduit();
        } catch {
            Alert.alert('Erreur', 'Impossible de valider la fiche.');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleSaveStock() {
        setIsSaving(true);
        try {
            await mettreAJourStock(produitId, parseInt(quantite, 10), parseInt(seuilAlerte, 10));
            await chargerProduit();
        } catch {
            Alert.alert('Erreur', 'Impossible de mettre à jour le stock.');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleSupprimerImage(imageId: string) {
        try {
            await supprimerImage(produitId, imageId);
            await chargerProduit();
        } catch {
            Alert.alert('Erreur', "Impossible de supprimer l'image.");
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
                    } catch {
                        Alert.alert('Erreur', 'Impossible de supprimer le produit.');
                    }
                },
            },
        ]);
    }

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
                    <View key={image.id} style={styles.imageWrapper}>
                        <Image source={{ uri: image.imageUrl }} style={styles.image} />
                        <TouchableOpacity style={styles.deleteImageButton} onPress={() => handleSupprimerImage(image.id)}>
                            <Text style={styles.deleteImageText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>

            {produit.statut === 'EN_ATTENTE_VALIDATION' && (
                <View style={styles.pendingBanner}>
                    <Text style={styles.pendingText}>Cette fiche n'est pas encore validée.</Text>
                    <Button title="Valider" variant="accent" onPress={handleValider} loading={isSaving} />
                </View>
            )}

            {isEditing ? (
                <>
                    <TextInput label="Nom" value={nom} onChangeText={setNom} />
                    <TextInput label="Description" value={description} onChangeText={setDescription} multiline />
                    <TextInput label="Catégorie" value={categorie} onChangeText={setCategorie} />
                    <TextInput label="Caractéristiques" value={caracteristiques} onChangeText={setCaracteristiques} multiline />
                    <TextInput label="Prix (MAD)" value={prix} onChangeText={setPrix} keyboardType="decimal-pad" />

                    <Button title="Enregistrer" onPress={handleSaveEdit} loading={isSaving} />
                    <Button title="Annuler" variant="outline" onPress={() => setIsEditing(false)} style={styles.spacedButton} />
                </>
            ) : (
                <>
                    <Text style={styles.nom}>{produit.nom}</Text>
                    <Text style={styles.prix}>{produit.prix ? `${produit.prix} MAD` : 'Prix non défini'}</Text>
                    <Text style={styles.categorie}>{produit.categorie}</Text>
                    <Text style={styles.description}>{produit.description}</Text>
                    {produit.caracteristiques ? <Text style={styles.description}>{produit.caracteristiques}</Text> : null}

                    <Button title="Modifier" variant="outline" onPress={() => setIsEditing(true)} style={styles.spacedButton} />
                </>
            )}

            <View style={styles.stockSection}>
                <Text style={styles.sectionTitle}>Stock</Text>
                <TextInput label="Quantité" value={quantite} onChangeText={setQuantite} keyboardType="number-pad" />
                <TextInput label="Seuil d'alerte" value={seuilAlerte} onChangeText={setSeuilAlerte} keyboardType="number-pad" />
                <Button title="Mettre à jour le stock" variant="outline" onPress={handleSaveStock} loading={isSaving} />
            </View>

            <TouchableOpacity onPress={handleSupprimerProduit} style={styles.deleteProductButton}>
                <Text style={styles.deleteProductText}>Supprimer ce produit</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    container: { padding: 20, paddingBottom: 60 },
    backLink: { marginBottom: 16 },
    backText: { fontFamily: fonts.regular, fontSize: 16, color: colors.primary },
    imagesRow: { marginBottom: 16 },
    imageWrapper: { marginRight: 10, position: 'relative' },
    image: { width: 140, height: 140, borderRadius: 12 },
    deleteImageButton: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: colors.black + 'AA',
        borderRadius: 12,
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteImageText: { color: colors.white, fontSize: 13, fontFamily: fonts.bold },
    pendingBanner: {
        backgroundColor: colors.accent + '20',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    pendingText: {
        fontFamily: fonts.semiBold,
        fontSize: 14,
        color: colors.textPrimary,
        marginBottom: 12,
    },
    nom: { fontFamily: fonts.bold, fontSize: 22, color: colors.textPrimary, marginBottom: 6 },
    prix: { fontFamily: fonts.semiBold, fontSize: 18, color: colors.primary, marginBottom: 4 },
    categorie: { fontFamily: fonts.regular, fontSize: 14, color: colors.marine, marginBottom: 12 },
    description: { fontFamily: fonts.regular, fontSize: 15, color: colors.textPrimary, marginBottom: 8, lineHeight: 22 },
    spacedButton: { marginTop: 12 },
    sectionTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.textPrimary, marginTop: 28, marginBottom: 12 },
    stockSection: { marginTop: 8 },
    deleteProductButton: { marginTop: 32, alignItems: 'center' },
    deleteProductText: { fontFamily: fonts.semiBold, fontSize: 15, color: '#D32F2F' },
});