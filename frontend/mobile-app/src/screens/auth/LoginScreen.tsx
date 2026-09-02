import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import { TextInput } from '../../components/TextInput';
import { AuthBackground } from '../../components/AuthBackground';
import { Card } from '../../components/Card';
import { useAuth } from '../../context/AuthContext';
import { resendOtp } from '../../api/authApi';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { AlertBanner } from '../../components/AlertBanner';
import { AProposModal } from '../../components/AProposModal';
import { AuthStackParamList } from '../../navigation/types';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export function LoginScreen() {
    const navigation = useNavigation<LoginScreenNavigationProp>();
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [accountNotVerified, setAccountNotVerified] = useState(false);
    const [aProposVisible, setAProposVisible] = useState(false);

    async function handleLogin() {
        setErrorMessage('');
        setAccountNotVerified(false);
        setIsLoading(true);
        try {
            await login(email.trim(), password);
        } catch (error: any) {
            const message = error?.response?.data?.message ?? 'Une erreur est survenue. Réessaie.';
            setErrorMessage(message);

            // Cas précis : compte jamais vérifié — on propose de repartir
            // directement vers l'écran OTP, plutôt que de laisser l'utilisateur
            // bloqué avec un message d'erreur sans issue.
            if (message.toLowerCase().includes('vérifi')) {
                setAccountNotVerified(true);
            }
        } finally {
            setIsLoading(false);
        }
    }

    async function handleVerifyNow() {
        setIsLoading(true);
        try {
            await resendOtp(email.trim());
            navigation.navigate('OtpVerification', { email: email.trim() });
        } catch (error: any) {
            const message = error?.response?.data?.message ?? "Impossible d'envoyer le code.";

            // Un refus "trop tôt" (anti-spam) signifie qu'un code valide a déjà
            // été envoyé très récemment (par exemple lors d'un changement
            // d'email) — on doit quand même laisser l'utilisateur accéder à
            // l'écran de saisie pour l'utiliser, pas le bloquer avec une erreur.
            if (message.toLowerCase().includes('patienter')) {
                navigation.navigate('OtpVerification', { email: email.trim() });
            } else {
                setErrorMessage(message);
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <AuthBackground>
            <View style={styles.headerContainer}>
                <Image
                    source={require('../../../assets/OpenShelf_Black_Variant.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />

                <TouchableOpacity onPress={() => setAProposVisible(true)}>
                    <Text style={styles.aProposText}>À propos d'OpenShelf</Text>
                </TouchableOpacity>
            </View>

            <Card>
                <Text style={styles.title}>Connectez-vous</Text>

                <TextInput
                    label="Email"
                    required
                    value={email}
                    onChangeText={setEmail}
                    placeholder="votre@email.com"
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <TextInput
                    label="Mot de passe"
                    required
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    secureTextEntry
                />

                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotPasswordLink}>
                    <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
                </TouchableOpacity>

                <AlertBanner message={errorMessage} variant="error" />

                {accountNotVerified && (
                    <TouchableOpacity onPress={handleVerifyNow} style={styles.verifyLinkContainer}>
                        <Text style={styles.verifyLinkText}>Vérifier mon compte maintenant</Text>
                    </TouchableOpacity>
                )}

                <Button title="Se connecter" onPress={handleLogin} loading={isLoading} />

                <TouchableOpacity onPress={() => navigation.navigate('RegisterChoice')} style={styles.linkContainer}>
                    <Text style={styles.linkText}>
                        Vous n'avez pas de compte ?{'\n'}
                        <Text style={styles.linkTextBold}>Inscrivez-vous maintenant !</Text>
                    </Text>
                </TouchableOpacity>
            </Card>

            <AProposModal visible={aProposVisible} onClose={() => setAProposVisible(false)} />
        </AuthBackground>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logo: {
        width: 170,
        height: 46,
        marginBottom: 6,
    },
    aProposText: {
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.marine,
        textDecorationLine: 'underline',
    },
    title: {
        fontFamily: fonts.bold,
        fontSize: 26,
        color: colors.textPrimary,
        marginBottom: 24,
        textAlign: 'center',
    },
    error: {
        fontFamily: fonts.regular,
        fontSize: 14,
        color: '#D32F2F',
        marginBottom: 16,
        textAlign: 'center',
    },
    verifyLinkContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    forgotPasswordLink: {
        alignItems: 'flex-end',
        marginBottom: 16,
    },
    forgotPasswordText: {
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.marine,
    },
    verifyLinkText: {
        fontFamily: fonts.semiBold,
        fontSize: 14,
        color: colors.accent,
    },
    linkContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    linkText: {
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.textPrimary,
        textAlign: 'center',
    },
    linkTextBold: {
        fontFamily: fonts.semiBold,
        color: colors.accent,
    },
});