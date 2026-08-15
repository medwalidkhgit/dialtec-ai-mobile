import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button } from '../../components/Button';
import { TextInput } from '../../components/TextInput';
import { Header } from '../../components/Header';
import { listerMesClients, ajouterClient, retirerClient } from '../../api/userApi';
import { ClientResumeResponse } from '../../types/user';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';

export function ClientsScreen() {
    const [clients, setClients] = useState<ClientResumeResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [emailRecherche, setEmailRecherche] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const chargerClients = useCallback(async () => {
        try {
            const data = await listerMesClients();
            setClients(data);
        } catch (error) {
            console.error('Erreur chargement clients', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            chargerClients();
        }, [chargerClients])
    );

    async function handleAjouter() {
        if (!emailRecherche.trim()) return;

        setErrorMessage('');
        setIsAdding(true);
        try {
            await ajouterClient(emailRecherche.trim());
            setEmailRecherche('');
            await chargerClients();
        } catch (error: any) {
            const message = error?.response?.data?.message ?? "Impossible d'ajouter ce client.";
            setErrorMessage(message);
        } finally {
            setIsAdding(false);
        }
    }

    function handleRetirer(client: ClientResumeResponse) {
        Alert.alert('Retirer ce client ?', `${client.fullName} sera retiré de ta liste.`, [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Retirer',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await retirerClient(client.id);
                        await chargerClients();
                    } catch {
                        Alert.alert('Erreur', 'Impossible de retirer ce client.');
                    }
                },
            },
        ]);
    }

    return (
        <View style={styles.wrapper}>
            <Header role="commercant" />

            <View style={styles.addSection}>
                <TextInput
                    label="Ajouter un client par email"
                    dark
                    value={emailRecherche}
                    onChangeText={setEmailRecherche}
                    placeholder="client@email.com"
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
                <Button title="Ajouter" variant="outline" dark onPress={handleAjouter} loading={isAdding} />
            </View>

            {isLoading ? (
                <ActivityIndicator color={colors.accent} size="large" style={styles.loader} />
            ) : (
                <FlatList
                    data={clients}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>Aucun client ajouté pour l'instant.</Text>}
                    renderItem={({ item }) => (
                        <View style={styles.clientCard}>
                            <View style={styles.clientInfo}>
                                <Text style={styles.clientName}>{item.fullName}</Text>
                                <Text style={styles.clientDetail}>{item.email}</Text>
                                <Text style={styles.clientDetail}>{item.phoneNumber}</Text>
                            </View>
                            <Text style={styles.removeLink} onPress={() => handleRetirer(item)}>
                                Retirer
                            </Text>
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: colors.darkBackground },
    addSection: { paddingHorizontal: 20, marginBottom: 12 },
    error: {
        fontFamily: fonts.regular,
        fontSize: 13,
        color: '#D32F2F',
        marginBottom: 12,
    },
    loader: { marginTop: 40 },
    list: { paddingHorizontal: 20, paddingBottom: 40 },
    emptyText: {
        fontFamily: fonts.regular,
        fontSize: 15,
        color: colors.darkTextSecondary,
        textAlign: 'center',
        marginTop: 40,
    },
    clientCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.darkBorder,
    },
    clientInfo: { flex: 1 },
    clientName: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.darkTextPrimary, marginBottom: 2 },
    clientDetail: { fontFamily: fonts.regular, fontSize: 13, color: colors.darkTextSecondary },
    removeLink: {
        fontFamily: fonts.semiBold,
        fontSize: 13,
        color: '#D32F2F',
    },
});