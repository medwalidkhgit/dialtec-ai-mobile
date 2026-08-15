import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Header } from '../../components/Header';
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
                <ActivityIndicator color={colors.accent} size="large" />
            </View>
        );
    }

    const barData = [
        { label: 'Commerçants', value: stats.totalCommercants, color: colors.accent },
        { label: 'Clients', value: stats.totalClients, color: colors.gold },
        { label: 'Comptes bloqués', value: stats.totalComptesBloques, color: '#D32F2F' },
        { label: 'En attente de vérification', value: stats.totalComptesEnAttenteVerification, color: colors.darkTextSecondary },
    ];
    const maxValue = Math.max(...barData.map((b) => b.value), 1);

    return (
        <View style={styles.wrapper}>
            <Header role="admin" />

            <ScrollView
                contentContainerStyle={styles.container}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.accent} />}
            >
                <Text style={styles.title}>Tableau de bord</Text>

                <View style={styles.statsGrid}>
                    <StatCard label="Commerçants" value={stats.totalCommercants} />
                    <StatCard label="Clients" value={stats.totalClients} />
                </View>

                <Text style={styles.sectionTitle}>Vue d'ensemble</Text>
                <View style={styles.chartCard}>
                    {barData.map((bar) => (
                        <View key={bar.label} style={styles.barRow}>
                            <View style={styles.barLabelRow}>
                                <Text style={styles.barLabel}>{bar.label}</Text>
                                <Text style={styles.barValue}>{bar.value}</Text>
                            </View>
                            <View style={styles.barTrack}>
                                <View
                                    style={[
                                        styles.barFill,
                                        { width: `${(bar.value / maxValue) * 100}%`, backgroundColor: bar.color },
                                    ]}
                                />
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
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
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.darkBackground },
    wrapper: { flex: 1, backgroundColor: colors.darkBackground },
    container: { padding: 20, paddingBottom: 40 },
    title: { fontFamily: fonts.bold, fontSize: 24, color: colors.darkTextPrimary, marginBottom: 20 },
    statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 28 },
    statCard: {
        flex: 1,
        backgroundColor: colors.darkSurface,
        borderRadius: 14,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.darkBorder,
    },
    statValue: { fontFamily: fonts.bold, fontSize: 32, color: colors.accent, marginBottom: 4 },
    statLabel: { fontFamily: fonts.regular, fontSize: 13, color: colors.darkTextSecondary },
    sectionTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.darkTextPrimary, marginBottom: 14 },
    chartCard: {
        backgroundColor: colors.darkSurface,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.darkBorder,
    },
    barRow: { marginBottom: 18 },
    barLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    barLabel: { fontFamily: fonts.regular, fontSize: 13, color: colors.darkTextPrimary },
    barValue: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.darkTextPrimary },
    barTrack: {
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.darkBorder,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 5,
    },
});