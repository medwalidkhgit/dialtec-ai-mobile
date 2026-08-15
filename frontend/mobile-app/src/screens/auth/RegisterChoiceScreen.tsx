import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthBackground } from '../../components/AuthBackground';
import { Card } from '../../components/Card';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { AuthStackParamList } from '../../navigation/types';

type RegisterChoiceNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'RegisterChoice'>;

export function RegisterChoiceScreen() {
    const navigation = useNavigation<RegisterChoiceNavigationProp>();

    return (
        <AuthBackground>
            <Image
                source={require('../../../assets/OpenShelf_Black_Variant.png')}
                style={styles.logo}
                resizeMode="contain"
            />

            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Text style={styles.backButtonText}>← Retour</Text>
            </TouchableOpacity>

            <Card>
                <Text style={styles.title}>Créer un compte</Text>
                <Text style={styles.subtitle}>Vous êtes...</Text>

                <TouchableOpacity
                    style={styles.optionCard}
                    onPress={() => navigation.navigate('RegisterCommercant')}
                    activeOpacity={0.85}
                >
                    <View style={styles.iconCircle}>
                        <Ionicons name="storefront-outline" size={28} color={colors.white} />
                    </View>
                    <View style={styles.cardTextContainer}>
                        <Text style={styles.cardTitle}>S'inscrire en tant que{'\n'}Commerçant</Text>
                        <Text style={styles.cardDescription}>
                            Génère automatiquement tes fiches produits par photo et voix, gère ton catalogue et tes clients.
                        </Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.optionCard, styles.lastOptionCard]}
                    onPress={() => navigation.navigate('RegisterClient')}
                    activeOpacity={0.85}
                >
                    <View style={styles.iconCircle}>
                        <Ionicons name="people-outline" size={28} color={colors.white} />
                    </View>
                    <View style={styles.cardTextContainer}>
                        <Text style={styles.cardTitle}>S'inscrire en tant que{'\n'}Client</Text>
                        <Text style={styles.cardDescription}>
                            Découvre les commerçants près de chez toi et suis les nouveautés de tes boutiques préférées.
                        </Text>
                    </View>
                </TouchableOpacity>
            </Card>
        </AuthBackground>
    );
}

const styles = StyleSheet.create({
    backButton: {
        alignSelf: 'center',
        backgroundColor: colors.black,
        borderRadius: 24,
        paddingHorizontal: 18,
        paddingVertical: 8,
        marginBottom: 16,
    },
    backButtonText: {
        fontFamily: fonts.semiBold,
        fontSize: 14,
        color: colors.white,
    },
    logo: {
        width: 170,
        height: 46,
        alignSelf: 'center',
        marginBottom: 24,
    },
    title: {
        fontFamily: fonts.bold,
        fontSize: 24,
        color: colors.textPrimary,
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: {
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.marine,
        textAlign: 'center',
        marginBottom: 24,
    },
    optionCard: {
        flexDirection: 'row',
        backgroundColor: colors.marine,
        borderRadius: 20,
        padding: 18,
        marginBottom: 16,
        alignItems: 'center',
    },
    lastOptionCard: {
        marginBottom: 0,
    },
    iconCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    cardTextContainer: { flex: 1 },
    cardTitle: {
        fontFamily: fonts.bold,
        fontSize: 15,
        color: colors.white,
        marginBottom: 5,
    },
    cardDescription: {
        fontFamily: fonts.regular,
        fontSize: 12,
        color: colors.white,
        opacity: 0.8,
        lineHeight: 16,
    },
});