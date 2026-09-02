import React, { useState } from 'react';
import { Modal, View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from './Button';
import { supprimerImage, ajouterImage } from '../api/produitApi';
import { uploadPhoto } from '../api/mediaApi';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { ProduitImage } from '../types/produit';

interface GererPhotosModalProps {
    visible: boolean;
    produitId: string;
    images: ProduitImage[];
    onClose: () => void;
    /** Appelé après toute modification réussie (ajout ou suppression), pour
     * que l'écran parent recharge la vraie liste à jour. */
    onChanged: () => void;
}

/**
 * Modal dédié à la gestion des photos d'une fiche produit — regroupe ici,
 * exclusivement, la sélection multiple pour suppression et l'ajout de
 * nouvelles photos. L'écran principal (ProduitDetailScreen) reste, lui,
 * purement visuel pour les photos : aucune icône de suppression n'y
 * apparaît, seul ce modal permet de les modifier.
 */
export function GererPhotosModal({ visible, produitId, images, onClose, onChanged }: GererPhotosModalProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDeletingSelection, setIsDeletingSelection] = useState(false);
    const [isAddingImage, setIsAddingImage] = useState(false);

    function toggleSelection(imageId: string) {
        setSelectedIds((prev) => (prev.includes(imageId) ? prev.filter((id) => id !== imageId) : [...prev, imageId]));
    }

    async function handleSupprimerSelection() {
        if (selectedIds.length === 0) return;

        Alert.alert(
            'Supprimer les photos',
            `Supprimer définitivement ${selectedIds.length} photo(s) sélectionnée(s) ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        setIsDeletingSelection(true);
                        try {
                            // Le backend ne propose pas de suppression groupée en un
                            // seul appel — on déclenche donc les suppressions en
                            // parallèle, plutôt qu'une par une.
                            await Promise.all(selectedIds.map((id) => supprimerImage(produitId, id)));
                            setSelectedIds([]);
                            onChanged();
                        } catch (error: any) {
                            const message = error?.response?.data?.message ?? "Certaines images n'ont pas pu être supprimées.";
                            Alert.alert('Erreur', message);
                            onChanged();
                        } finally {
                            setIsDeletingSelection(false);
                        }
                    },
                },
            ]
        );
    }

    function handleAjouterImage() {
        Alert.alert('Ajouter une photo', 'Comment veux-tu ajouter cette photo ?', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Prendre une photo', onPress: () => lancerCapture('camera') },
            { text: 'Choisir depuis la galerie', onPress: () => lancerCapture('galerie') },
        ]);
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
        if (result.canceled) return;

        setIsAddingImage(true);
        try {
            const uploaded = await uploadPhoto(result.assets[0].uri);
            await ajouterImage(produitId, uploaded.url, uploaded.key);
            onChanged();
        } catch (error) {
            console.error('Erreur ajout image', error);
            Alert.alert('Erreur', "Impossible d'ajouter cette image.");
        } finally {
            setIsAddingImage(false);
        }
    }

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={styles.wrapper}>
                <View style={styles.header}>
                    <Text style={styles.titre}>Gérer les photos</Text>
                    {selectedIds.length > 0 && (
                        <Text style={styles.compteur}>{selectedIds.length} sélectionnée{selectedIds.length > 1 ? 's' : ''}</Text>
                    )}
                </View>

                <ScrollView contentContainerStyle={styles.grille}>
                    {images.map((image) => {
                        const estSelectionnee = selectedIds.includes(image.id);
                        return (
                            <TouchableOpacity
                                key={image.id}
                                style={styles.vignetteWrapper}
                                activeOpacity={0.7}
                                onPress={() => toggleSelection(image.id)}
                            >
                                <Image
                                    source={{ uri: image.imageUrl }}
                                    style={[styles.vignette, estSelectionnee && styles.vignetteSelectionnee]}
                                />
                                <View style={[styles.checkbox, estSelectionnee && styles.checkboxCochee]}>
                                    {estSelectionnee && <Text style={styles.checkboxCoche}>✓</Text>}
                                </View>
                            </TouchableOpacity>
                        );
                    })}

                    <TouchableOpacity style={styles.ajouterBouton} onPress={handleAjouterImage} disabled={isAddingImage}>
                        {isAddingImage ? (
                            <ActivityIndicator color={colors.accent} />
                        ) : (
                            <Text style={styles.ajouterTexte}>+</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>

                <View style={styles.footer}>
                    {selectedIds.length > 0 && (
                        <Button
                            title="Supprimer la sélection"
                            variant="danger"
                            onPress={handleSupprimerSelection}
                            loading={isDeletingSelection}
                            style={styles.boutonFooter}
                        />
                    )}
                    <Button title="Retour" variant="outline" dark onPress={onClose} style={styles.boutonFooter} />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: colors.darkBackground, paddingTop: 60, paddingHorizontal: 20 },
    header: { marginBottom: 20 },
    titre: { fontFamily: fonts.bold, fontSize: 20, color: colors.darkTextPrimary, marginBottom: 4 },
    compteur: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.accent },
    grille: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    vignetteWrapper: { position: 'relative' },
    vignette: { width: 104, height: 104, borderRadius: 12 },
    vignetteSelectionnee: { opacity: 0.5 },
    checkbox: {
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
    checkboxCochee: { backgroundColor: colors.accent, borderColor: colors.accent },
    checkboxCoche: { color: colors.white, fontSize: 13, fontFamily: fonts.bold },
    ajouterBouton: {
        width: 104,
        height: 104,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: colors.darkBorder,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ajouterTexte: { fontFamily: fonts.bold, fontSize: 32, color: colors.accent },
    footer: { paddingVertical: 20, gap: 10 },
    boutonFooter: { width: '100%' },
});