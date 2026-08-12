import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, PressableProps } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

type ButtonVariant = 'primary' | 'accent' | 'outline';

interface ButtonProps extends PressableProps {
    title: string;
    variant?: ButtonVariant;
    loading?: boolean;
}

export function Button({ title, variant = 'primary', loading = false, disabled, style, ...rest }: ButtonProps) {
    const isDisabled = disabled || loading;

    return (
        <Pressable
            style={({ pressed }) => [
                styles.base,
                variantStyles[variant],
                isDisabled && styles.disabled,
                pressed && !isDisabled && styles.pressed,
                style as any,
            ]}
            disabled={isDisabled}
            {...rest}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'accent' ? colors.accentText : colors.white} />
            ) : (
                <Text style={[styles.text, textVariantStyles[variant]]}>{title}</Text>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    base: {
        height: 52,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    text: {
        fontFamily: fonts.semiBold,
        fontSize: 16,
    },
    disabled: {
        opacity: 0.5,
    },
    pressed: {
        opacity: 0.85,
    },
});

const variantStyles = StyleSheet.create({
    primary: {
        backgroundColor: colors.primary,
    },
    accent: {
        backgroundColor: colors.accent,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: colors.primary,
    },
});

const textVariantStyles = StyleSheet.create({
    primary: {
        color: colors.white,
    },
    accent: {
        color: colors.accentText, // noir, jamais orange — règle fixée avec la palette
    },
    outline: {
        color: colors.primary,
    },
});