import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Pressable } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { decouvrirCommercants } from '../../api/userApi';
import { PublicCommercantResponse } from '../../types/user';
import { SHOP_CATEGORIES, SHOP_CATEGORY_LABELS, ShopCategory } from '../../constants/shopCategories';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { FournisseursStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<FournisseursStackParamList, 'DecouvrirCommercants'>;

export function DecouvrirCommercantsScreen() {
    const navigation = useNavigation<NavigationProp>();
    const insets = useSafeAreaInsets();
    const [commercants, setCommercants] = useState<PublicCommercantResponse[]>([]);
    const [categorieFiltre, setCategorieFiltre] = useState<ShopCategory | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const charger = useCallback((categorie: ShopCategory | null) => {
        setIsLoading(true);
        decouvrirCommercants(categorie ?? undefined)
            .then((result) => setCommercants(result.content))
            .catch((error) => console.error('Erreur découverte commerçants', error))
            .finally(() => setIsLoading(false));
    }, []);

    useFocusEffect(
        useCallback(() => {
            charger(categorieFiltre);
        }, [charger, categorieFiltre])
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
                <Text style={styles.backText}>← Retour</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Découvrir des commerçants</Text>

            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={[null, ...SHOP_CATEGORIES]}
                keyExtractor={(item) => item ?? 'ALL'}
                style={styles.chipsRow}
                renderItem={({ item }) => {
                    const isSelected = item === categorieFiltre;
                    return (
                        <Pressable
                            onPress={() => setCategorieFiltre(item)}
                            style={[styles.chip, isSelected && styles.chipSelected]}
                        >
                            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                                {item ? SHOP_CATEGORY_LABELS[item] : 'Toutes'}
                            </Text>
                        </Pressable>
                    );
                }}
            />

            {isLoading ? (
                <ActivityIndicator color={colors.accent} size="large" style={styles.loader} />
            ) : (
                <FlatList
                    data={commercants}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>Aucun commerçant trouvé.</Text>}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.card}
                            onPress={() => navigation.navigate('CommercantCatalogue', { commercant: item })}
                        >
                            <Text style={styles.cardName}>{item.fullName}</Text>
                            <Text style={styles.cardDetail}>{SHOP_CATEGORY_LABELS[item.shopCategory]}</Text>
                            <Text style={styles.cardDetail}>{item.city}</Text>
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.darkBackground, paddingHorizontal: 20 },
    backLink: { marginBottom: 12 },
    backText: { fontFamily: fonts.regular, fontSize: 16, color: colors.accent },
    title: { fontFamily: fonts.bold, fontSize: 22, color: colors.darkTextPrimary, marginBottom: 16 },
    chipsRow: { marginBottom: 16, maxHeight: 44 },
    chip: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: colors.darkBorder,
        marginRight: 8,
    },
    chipSelected: {
        backgroundColor: colors.gold,
        borderColor: colors.gold,
    },
    chipText: { fontFamily: fonts.regular, fontSize: 13, color: colors.darkTextSecondary },
    chipTextSelected: { color: colors.black, fontFamily: fonts.semiBold },
    loader: { marginTop: 40 },
    list: { paddingBottom: 40 },
    emptyText: {
        fontFamily: fonts.regular,
        fontSize: 15,
        color: colors.darkTextSecondary,
        textAlign: 'center',
        marginTop: 40,
    },
    card: {
        backgroundColor: colors.darkSurface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.darkBorder,
    },
    cardName: { fontFamily: fonts.semiBold, fontSize: 16, color: colors.darkTextPrimary, marginBottom: 4 },
    cardDetail: { fontFamily: fonts.regular, fontSize: 13, color: colors.darkTextSecondary },
});