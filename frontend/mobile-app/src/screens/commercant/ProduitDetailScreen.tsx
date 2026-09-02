import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { TextInput } from '../../components/TextInput';
import { AlertBanner } from '../../components/AlertBanner';
import { GererPhotosModal } from '../../components/GererPhotosModal';
import {
    consulterMonProduit,
    modifierProduit,
    validerProduit,
    mettreAJourStock,
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
    const insets = useSafeAreaInsets();
    const { produitId } = route.params;

    const [produit, setProduit] = useState<ProduitResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [gererPhotosVisible, setGererPhotosVisible] = useState(false);

    const [nom, setNom] = useState('');
    const [description, setDescription] = useState('');
    const [categorie, setCategorie] = useState('');
    const [caracteristiques, setCaracteristiques] = useState('');
    const [prix, setPrix] = useState('');
    const [quantite, setQuantite] = useState('');
    const [seuilAlerte, setSeuilAlerte] = useState('');

    function afficherSucces(message: string) {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(''), 3000);
    }

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

    // Un seul bouton pour tout enregistrer — informations produit ET stock
    // en même temps. Côté backend, ce sont deux appels distincts (deux
    // responsabilités séparées, comme partout dans ce projet), mais lancés
    // ici en parallèle pour ne faire attendre l'utilisateur qu'une seule
    // fois, avec un seul message de succès à la fin.
    async function handleEnregistrerTout() {
        setIsSaving(true);
        try {
            await Promise.all([
                modifierProduit(produitId, {
                    nom,
                    description,
                    categorie,
                    caracteristiques: caracteristiques || null,
                    prix: prix ? parseFloat(prix) : null,
                }),
                mettreAJourStock(produitId, parseInt(quantite, 10), parseInt(seuilAlerte, 10)),
            ]);
            await chargerProduit();
            afficherSucces('Modifications enregistrées avec succès.');
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
            afficherSucces('Fiche validée avec succès.');
        } catch (error: any) {
            const message = error?.response?.data?.message ?? 'Impossible de valider la fiche.';
            Alert.alert('Erreur', message);
        } finally {
            setIsSaving(false);
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

            <AlertBanner message={successMessage} variant="success" dark />

            {/* Bande de photos — purement visuelle désormais, aucune icône de
          suppression ici. Toute modification passe exclusivement par le
          bouton "Gérer les photos" ci-dessous, qui ouvre un vrai modal
          dédié. */}
            <View style={styles.imagesHeaderRow}>
                <Text style={styles.sectionLabel}>Photos</Text>
                <TouchableOpacity onPress={() => setGererPhotosVisible(true)}>
                    <Text style={styles.gererPhotosText}>Gérer les photos</Text>
                </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesRow}>
                {(produit.images ?? []).map((image) => (
                    <Image key={image.id} source={{ uri: image.imageUrl }} style={styles.image} />
                ))}
                {(produit.images ?? []).length === 0 && (
                    <View style={[styles.image, styles.imagePlaceholder]}>
                        <Text style={styles.placeholderText}>Aucune photo</Text>
                    </View>
                )}
            </ScrollView>

            {produit.statut === 'EN_ATTENTE_VALIDATION' && (
                <View style={styles.pendingBanner}>
                    <Text style={styles.pendingText}>Cette fiche n'est pas encore validée.</Text>
                    <Button title="Valider" variant="accent" onPress={handleValider} loading={isSaving} />
                </View>
            )}

            {/* Tous les champs restent directement modifiables — plus de mode
          "édition" séparé à activer, exactement comme le stock. */}
            <Text style={styles.sectionTitle}>Informations produit</Text>
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
            </View>

            <Button
                title="Enregistrer les modifications"
                onPress={handleEnregistrerTout}
                loading={isSaving}
                style={styles.saveButton}
            />

            <TouchableOpacity onPress={handleSupprimerProduit} style={styles.deleteProductButton}>
                <Text style={styles.deleteProductText}>Supprimer ce produit</Text>
            </TouchableOpacity>

            <GererPhotosModal
                visible={gererPhotosVisible}
                produitId={produitId}
                images={produit.images ?? []}
                onClose={() => setGererPhotosVisible(false)}
                onChanged={chargerProduit}
            />
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
    gererPhotosText: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.accent },
    imagesRow: { marginBottom: 24 },
    image: { width: 140, height: 140, borderRadius: 12, marginRight: 10 },
    imagePlaceholder: {
        backgroundColor: colors.darkSurface,
        borderWidth: 1,
        borderColor: colors.darkBorder,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: { fontFamily: fonts.regular, color: colors.darkTextSecondary },
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
    sectionTitle: {
        fontFamily: fonts.bold,
        fontSize: 17,
        color: colors.darkTextPrimary,
        marginTop: 8,
        marginBottom: 12,
    },
    stockSection: { marginTop: 20 },
    saveButton: { marginTop: 28 },
    deleteProductButton: { marginTop: 24, alignItems: 'center' },
    deleteProductText: { fontFamily: fonts.semiBold, fontSize: 15, color: '#D32F2F' },
});