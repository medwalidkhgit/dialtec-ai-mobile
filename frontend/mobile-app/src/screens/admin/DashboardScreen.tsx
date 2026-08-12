import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getStatsAdmin } from '../../api/userApi';
import { AdminStatsResponse } from '../../types/user';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';

export function DashboardScreen() {
    const [stats, setStats] = useState<AdminStatsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const charger = useCallback(async () => {
        try {
            const data = await getStatsAdmin();
            setStats(data);
        } catch (error) {
            console.error('Erreur chargement stats', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            charger();
        }, [charger])
    );

    function handleRefresh() {
        setIsRefreshing(true);
        charger();
    }

    if (isLoading || !stats) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator color={colors.primary} size="large" />
            </View>
        );
    }

    return (
        <ScrollView
            contentContainerStyle={styles.container}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        >
            <Text style={styles.title}>Tableau de bord</Text>

            <View style={styles.statsGrid}>
                <StatCard label="Commerçants" value={stats.totalCommercants} />
                <StatCard label="Clients" value={stats.totalClients} />
                <StatCard label="Produits" value={stats.totalProduits} />
                <StatCard label="Fiches générées" value={stats.totalFichesGenerees} />
            </View>
        </ScrollView>
    );
}

function StatCard({ label, value }: { label: string; value: number }) {
    return (
        <View style={styles.statCard}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    container: { padding: 20 },
    title: { fontFamily: fonts.bold, fontSize: 24, color: colors.textPrimary, marginBottom: 24 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    statCard: {
        width: '47%',
        backgroundColor: colors.primary,
        borderRadius: 14,
        padding: 20,
        alignItems: 'center',
    },
    statValue: { fontFamily: fonts.bold, fontSize: 32, color: colors.white, marginBottom: 4 },
    statLabel: { fontFamily: fonts.regular, fontSize: 13, color: colors.white },
});