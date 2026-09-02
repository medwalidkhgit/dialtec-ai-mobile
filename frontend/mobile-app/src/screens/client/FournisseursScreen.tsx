import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import { Header } from '../../components/Header';
import { listerMesFournisseurs } from '../../api/userApi';
import { PublicCommercantResponse } from '../../types/user';
import { SHOP_CATEGORY_LABELS } from '../../constants/shopCategories';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { FournisseursStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<FournisseursStackParamList, 'FournisseursList'>;

export function FournisseursScreen() {
    const navigation = useNavigation<NavigationProp>();
    const [fournisseurs, setFournisseurs] = useState<PublicCommercantResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            listerMesFournisseurs()
                .then(setFournisseurs)
                .catch((error) => console.error('Erreur chargement fournisseurs', error))
                .finally(() => setIsLoading(false));
        }, [])
    );

    return (
        <View style={styles.wrapper}>
            <Header role="client" />

            <View style={styles.contentPadding}>
                <Text style={styles.title}>Mes fournisseurs</Text>

                <Button
                    title="Découvrir des commerçants"
                    variant="outline"
                    dark
                    onPress={() => navigation.navigate('DecouvrirCommercants')}
                    style={styles.discoverButton}
                />
            </View>

            {isLoading ? (
                <ActivityIndicator color={colors.accent} size="large" style={styles.loader} />
            ) : (
                <FlatList
                    data={fournisseurs}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>
                            Aucun fournisseur pour l'instant. Un commerçant doit t'ajouter depuis son espace.
                        </Text>
                    }
                    renderItem={({ item }) => {
                        const initiale = item.fullName?.charAt(0)?.toUpperCase() ?? '?';
                        return (
                            <TouchableOpacity
                                style={styles.card}
                                activeOpacity={0.75}
                                onPress={() => navigation.navigate('CommercantCatalogue', { commercant: item })}
                            >
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{initiale}</Text>
                                </View>
                                <View style={styles.cardInfo}>
                                    <Text style={styles.cardName}>{item.fullName}</Text>
                                    <View style={styles.categorieBadge}>
                                        <Text style={styles.categorieBadgeText}>{SHOP_CATEGORY_LABELS[item.shopCategory]}</Text>
                                    </View>
                                    <Text style={styles.cardVille}>📍 {item.city}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: colors.darkBackground },
    contentPadding: { paddingHorizontal: 20 },
    title: { fontFamily: fonts.bold, fontSize: 22, color: colors.darkTextPrimary, marginBottom: 16 },
    discoverButton: { marginBottom: 20 },
    loader: { marginTop: 40 },
    list: { paddingHorizontal: 20, paddingBottom: 40 },
    emptyText: {
        fontFamily: fonts.regular,
        fontSize: 15,
        color: colors.darkTextSecondary,
        textAlign: 'center',
        marginTop: 40,
        lineHeight: 22,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: colors.darkSurface,
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.darkBorder,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: { fontFamily: fonts.bold, fontSize: 20, color: colors.accentText },
    cardInfo: { flex: 1 },
    cardName: { fontFamily: fonts.bold, fontSize: 16, color: colors.darkTextPrimary, marginBottom: 6 },
    categorieBadge: {
        alignSelf: 'flex-start',
        backgroundColor: colors.bleuNuit,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        marginBottom: 6,
    },
    categorieBadgeText: { fontFamily: fonts.semiBold, fontSize: 11, color: colors.white },
    cardVille: { fontFamily: fonts.regular, fontSize: 13, color: colors.darkTextSecondary },
});