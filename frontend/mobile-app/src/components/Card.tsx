import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface CardProps {
    children: ReactNode;
}

export function Card({ children }: CardProps) {
    return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.white,
        borderRadius: 20,
        padding: 24,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
});