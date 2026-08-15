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
    wrapper: { flex: 1, backgroundColor: colors.darkBackground },
    contentPadding: { paddingHorizontal: 20 },
    title: { fontFamily: fonts.bold, fontSize: 22, color: colors.darkTextPrimary, marginBottom: 16 },
    discoverButton: { marginBottom: 20 },
    loader: { marginTop: 40 },
    list: { paddingHorizontal: 20, paddingBottom: 40 },
    emptyText: {
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.darkTextSecondary,
        textAlign: 'center',
        marginTop: 20,
        lineHeight: 20,
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