import React from 'react';
import { View, Text, TextInput as RNTextInput, StyleSheet, TextInputProps as RNTextInputProps } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

interface TextInputProps extends RNTextInputProps {
    label: string;
    required?: boolean;
    error?: string;
    dark?: boolean;
}

export function TextInput({ label, required, error, dark, style, ...rest }: TextInputProps) {
    return (
        <View style={styles.container}>
            <Text style={[styles.label, dark && styles.labelDark]}>
                {label}
                {required ? <Text style={styles.required}> *</Text> : null}
            </Text>
            <RNTextInput
                style={[styles.input, dark && styles.inputDark, error ? styles.inputError : null, style as any]}
                placeholderTextColor={dark ? colors.darkTextSecondary : colors.marine + '80'}
                {...rest}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontFamily: fonts.semiBold,
        fontSize: 14,
        color: colors.textPrimary,
        marginBottom: 6,
    },
    labelDark: {
        color: colors.darkTextPrimary,
    },
    required: {
        color: '#D32F2F',
    },
    input: {
        height: 52,
        borderWidth: 1.5,
        borderColor: colors.marine + '30',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontFamily: fonts.regular,
        fontSize: 16,
        color: colors.textPrimary,
        backgroundColor: colors.white,
    },
    inputDark: {
        borderColor: colors.darkBorder,
        backgroundColor: colors.darkSurface,
        color: colors.darkTextPrimary,
    },
    // Rouge d'erreur : seule exception volontaire à la palette de marque —
    // convention universelle attendue par les utilisateurs pour un état
    // d'erreur, indépendamment de l'identité visuelle.
    inputError: {
        borderColor: '#D32F2F',
    },
    errorText: {
        fontFamily: fonts.regular,
        fontSize: 13,
        color: '#D32F2F',
        marginTop: 4,
    },
});