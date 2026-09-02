import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

type AlertVariant = 'error' | 'success';

interface AlertBannerProps {
    message: string;
    variant?: AlertVariant;
    /** true sur les écrans à fond sombre (espaces connectés) — false ou
     * omis sur les écrans clairs (authentification). */
    dark?: boolean;
}

/**
 * Bandeau d'alerte avec fond coloré et icône — remplace le simple texte
 * coloré utilisé jusqu'ici pour les messages d'erreur/succès, sur tous
 * les écrans de l'app.
 */
export function AlertBanner({ message, variant = 'error', dark = false }: AlertBannerProps) {
    if (!message) return null;

    const estErreur = variant === 'error';
    const couleurTexte = estErreur ? colors.danger : colors.success;
    const couleurFond = dark
        ? (estErreur ? colors.dangerSoftDark : colors.successSoftDark)
        : (estErreur ? colors.dangerSoft : colors.successSoft);

    return (
        <View style={[styles.container, { backgroundColor: couleurFond }]}>
            <Text style={[styles.icon, { color: couleurTexte }]}>{estErreur ? '⚠' : '✓'}</Text>
            <Text style={[styles.message, { color: couleurTexte }]}>{message}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 16,
        gap: 8,
    },
    icon: {
        fontSize: 15,
        fontFamily: fonts.semiBold,
        lineHeight: 20,
    },
    message: {
        flex: 1,
        fontFamily: fonts.regular,
        fontSize: 14,
        lineHeight: 20,
    },
});