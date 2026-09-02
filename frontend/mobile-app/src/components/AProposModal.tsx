import React from 'react';
import { Modal, View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { Button } from './Button';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

interface AProposModalProps {
    visible: boolean;
    onClose: () => void;
}

/**
 * Modal "À propos d'OpenShelf" — accessible depuis l'écran de connexion,
 * avant même toute authentification, pour donner à un nouvel utilisateur
 * une idée générale de l'application. Hauteur limitée avec défilement
 * interne, pour rester lisible même sur les petits écrans.
 */
export function AProposModal({ visible, onClose }: AProposModalProps) {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <Image
                        source={require('../../assets/OpenShelf_Black_Variant.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />

                    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                        <Text style={styles.paragraphe}>
                            Au Maroc, de nombreux commerçants de proximité — droguistes, épiceries,
                            quincailliers — n'ont pas de catalogue numérique de leurs produits. La saisie
                            manuelle prend du temps, et beaucoup sont plus à l'aise à l'oral, en darija, qu'à
                            l'écrit en français.
                        </Text>

                        <Text style={styles.paragraphe}>
                            OpenShelf simplifie tout ça. Le commerçant prend une photo du produit et décrit
                            ce qu'il vend à voix haute, dans sa langue de tous les jours. L'application
                            transcrit la description, comprend les informations essentielles et génère
                            automatiquement une fiche produit complète : nom, description, catégorie,
                            caractéristiques et prix — prête à être relue et publiée.
                        </Text>

                        <Text style={styles.paragraphe}>
                            Une fois le catalogue en ligne, le commerçant peut le consulter et le modifier à
                            tout moment, suivre son stock et recevoir une alerte visuelle en cas de rupture.
                        </Text>

                        <Text style={[styles.paragraphe, styles.dernierParagraphe]}>
                            Du côté des clients, OpenShelf permet de découvrir les commerçants du quartier,
                            parcourir leurs produits par catégorie et repérer facilement les nouveautés —
                            sans jamais avoir à se déplacer pour savoir ce qu'un magasin a en rayon.
                        </Text>
                    </ScrollView>

                    <Button title="Retour" variant="outline" onPress={onClose} style={styles.bouton} />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: 20,
        paddingTop: 28,
        paddingHorizontal: 24,
        paddingBottom: 20,
        width: '100%',
        maxWidth: 380,
        maxHeight: '80%',
        alignItems: 'center',
    },
    logo: {
        width: 130,
        height: 36,
        marginBottom: 20,
    },
    scroll: {
        alignSelf: 'stretch',
    },
    paragraphe: {
        fontFamily: fonts.regular,
        fontSize: 14,
        lineHeight: 21,
        color: colors.black,
        textAlign: 'center',
        marginBottom: 14,
    },
    dernierParagraphe: {
        marginBottom: 4,
    },
    bouton: {
        marginTop: 16,
        alignSelf: 'stretch',
    },
});