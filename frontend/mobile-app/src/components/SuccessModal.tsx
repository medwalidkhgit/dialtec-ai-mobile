import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

interface SuccessModalProps {
    visible: boolean;
    title: string;
    /** Appelé automatiquement après la brève apparition — généralement pour
     * naviguer vers l'écran suivant. */
    onDone: () => void;
    /** Durée d'affichage avant la fermeture automatique, en millisecondes. */
    duration?: number;
}

/**
 * Modal de confirmation avec coche verte animée — un seul moment
 * orchestré, pas une animation systématique sur chaque action. Réservé
 * aux vraies étapes clés (vérification de compte, inscription terminée).
 */
export function SuccessModal({ visible, title, onDone, duration = 1600 }: SuccessModalProps) {
    const scale = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!visible) return;

        scale.setValue(0);
        Animated.spring(scale, {
            toValue: 1,
            friction: 5,
            tension: 80,
            useNativeDriver: true,
        }).start();

        const minuteur = setTimeout(onDone, duration);
        return () => clearTimeout(minuteur);
    }, [visible]);

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <Animated.View style={[styles.checkCircle, { transform: [{ scale }] }]}>
                        <Text style={styles.checkMark}>✓</Text>
                    </Animated.View>
                    <Text style={styles.title}>{title}</Text>
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
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: 20,
        paddingVertical: 32,
        paddingHorizontal: 40,
        alignItems: 'center',
        minWidth: 220,
    },
    checkCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.success,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    checkMark: {
        color: colors.white,
        fontSize: 32,
        fontFamily: fonts.bold,
    },
    title: {
        fontFamily: fonts.semiBold,
        fontSize: 16,
        color: colors.black,
        textAlign: 'center',
    },
});