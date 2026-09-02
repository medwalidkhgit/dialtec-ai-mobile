import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import { TextInput } from '../../components/TextInput';
import { AuthBackground } from '../../components/AuthBackground';
import { Card } from '../../components/Card';
import { AlertBanner } from '../../components/AlertBanner';
import { forgotPassword } from '../../api/authApi';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { AuthStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen() {
    const navigation = useNavigation<NavigationProp>();

    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    async function handleEnvoyer() {
        setErrorMessage('');
        setIsLoading(true);
        try {
            await forgotPassword(email.trim());
            navigation.navigate('ResetPassword', { email: email.trim() });
        } catch (error: any) {
            const erreursParChamp = error?.response?.data?.data;
            const message =
                erreursParChamp && typeof erreursParChamp === 'object'
                    ? Object.values(erreursParChamp).join('\n')
                    : (error?.response?.data?.message ?? "Impossible d'envoyer le code.");
            setErrorMessage(message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <AuthBackground>
            <Card>
                <Text style={styles.title}>Mot de passe oublié</Text>
                <Text style={styles.subtitle}>
                    Indique l'email de ton compte — un code de vérification te sera envoyé pour créer un
                    nouveau mot de passe.
                </Text>

                <TextInput
                    label="Email"
                    required
                    value={email}
                    onChangeText={setEmail}
                    placeholder="votre@email.com"
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <AlertBanner message={errorMessage} variant="error" />

                <Button title="Envoyer le code" onPress={handleEnvoyer} loading={isLoading} />

                <Text style={styles.retourLink} onPress={() => navigation.goBack()}>
                    ← Retour à la connexion
                </Text>
            </Card>
        </AuthBackground>
    );
}

const styles = StyleSheet.create({
    title: {
        fontFamily: fonts.bold,
        fontSize: 24,
        color: colors.textPrimary,
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.marine,
        marginBottom: 24,
        textAlign: 'center',
        lineHeight: 20,
    },
    retourLink: {
        fontFamily: fonts.semiBold,
        fontSize: 14,
        color: colors.accent,
        textAlign: 'center',
        marginTop: 20,
    },
});