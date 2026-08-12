import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthBackground } from '../../components/AuthBackground';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { AuthStackParamList } from '../../navigation/types';

type RegisterChoiceNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'RegisterChoice'>;

export function RegisterChoiceScreen() {
    const navigation = useNavigation<RegisterChoiceNavigationProp>();

    return (
        <AuthBackground>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
                <Text style={styles.backText}>← Retour</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Créer un compte</Text>
            <Text style={styles.subtitle}>Vous êtes...</Text>

            <TouchableOpacity
                style={styles.card}
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
                style={styles.card}
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
        </AuthBackground>
    );
}

const styles = StyleSheet.create({
    backLink: { marginBottom: 20 },
    backText: { fontFamily: fonts.regular, fontSize: 16, color: colors.white },
    title: {
        fontFamily: fonts.bold,
        fontSize: 26,
        color: colors.white,
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: {
        fontFamily: fonts.regular,
        fontSize: 15,
        color: colors.white,
        opacity: 0.85,
        textAlign: 'center',
        marginBottom: 32,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: colors.marine,
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        alignItems: 'center',
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    cardTextContainer: { flex: 1 },
    cardTitle: {
        fontFamily: fonts.bold,
        fontSize: 16,
        color: colors.white,
        marginBottom: 6,
    },
    cardDescription: {
        fontFamily: fonts.regular,
        fontSize: 12,
        color: colors.white,
        opacity: 0.8,
        lineHeight: 17,
    },
});