import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { listerCommercantsAdmin } from '../../api/userApi';
import { CommercantProfileResponse } from '../../types/user';
import { SHOP_CATEGORY_LABELS } from '../../constants/shopCategories';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { CommercantsStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<CommercantsStackParamList, 'CommercantsListAdmin'>;

const statusLabels: Record<string, string> = {
    ACTIF: 'Actif',
    BLOQUE: 'Bloqué',
    EN_ATTENTE_VERIFICATION: 'En attente',
};

const statusColors: Record<string, string> = {
    ACTIF: '#2E7D32',
    BLOQUE: '#D32F2F',
    EN_ATTENTE_VERIFICATION: colors.marine,
};

export function CommercantsListScreen() {
    const navigation = useNavigation<NavigationProp>();
    const [commercants, setCommercants] = useState<CommercantProfileResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            listerCommercantsAdmin()
                .then(setCommercants)
                .catch((error) => console.error('Erreur chargement commerçants', error))
                .finally(() => setIsLoading(false));
        }, [])
    );

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator color={colors.primary} size="large" />
            </View>
        );
    }

    return (
        <FlatList
            data={commercants}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListHeaderComponent={<Text style={styles.title}>Commerçants</Text>}
            ListEmptyComponent={<Text style={styles.emptyText}>Aucun commerçant inscrit.</Text>}
            renderItem={({ item }) => (
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate('CommercantDetailAdmin', { commercantId: item.id })}
                >
                    <View style={styles.cardInfo}>
                        <Text style={styles.cardName}>{item.fullName}</Text>
                        <Text style={styles.cardDetail}>{item.email}</Text>
                        <Text style={styles.cardDetail}>{SHOP_CATEGORY_LABELS[item.shopCategory]}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColors[item.accountStatus] }]}>
                        <Text style={styles.statusText}>{statusLabels[item.accountStatus]}</Text>
                    </View>
                </TouchableOpacity>
            )}
        />
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list: { padding: 20 },
    title: { fontFamily: fonts.bold, fontSize: 24, color: colors.textPrimary, marginBottom: 16 },
    emptyText: { fontFamily: fonts.regular, fontSize: 15, color: colors.marine, textAlign: 'center', marginTop: 40 },
    card: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.marine + '20',
    },
    cardInfo: { flex: 1 },
    cardName: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.textPrimary, marginBottom: 2 },
    cardDetail: { fontFamily: fonts.regular, fontSize: 13, color: colors.marine },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    statusText: { fontFamily: fonts.semiBold, fontSize: 11, color: colors.white },
});