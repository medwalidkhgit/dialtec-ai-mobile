import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Header } from '../../components/Header';
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
    EN_ATTENTE_VERIFICATION: colors.gold,
};

const statusTextColors: Record<string, string> = {
    ACTIF: colors.white,
    BLOQUE: colors.white,
    EN_ATTENTE_VERIFICATION: colors.black,
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

    return (
        <View style={styles.wrapper}>
            <Header role="admin" />

            {isLoading ? (
                <ActivityIndicator color={colors.accent} size="large" style={styles.loader} />
            ) : (
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
                                <Text style={[styles.statusText, { color: statusTextColors[item.accountStatus] }]}>
                                    {statusLabels[item.accountStatus]}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: colors.darkBackground },
    loader: { marginTop: 60 },
    list: { padding: 20 },
    title: { fontFamily: fonts.bold, fontSize: 24, color: colors.darkTextPrimary, marginBottom: 16 },
    emptyText: {
        fontFamily: fonts.regular,
        fontSize: 15,
        color: colors.darkTextSecondary,
        textAlign: 'center',
        marginTop: 40,
    },
    card: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.darkSurface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.darkBorder,
    },
    cardInfo: { flex: 1 },
    cardName: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.darkTextPrimary, marginBottom: 2 },
    cardDetail: { fontFamily: fonts.regular, fontSize: 13, color: colors.darkTextSecondary },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    statusText: { fontFamily: fonts.semiBold, fontSize: 11 },
});