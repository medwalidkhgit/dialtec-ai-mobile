import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import { TextInput } from '../../components/TextInput';
import { AuthBackground } from '../../components/AuthBackground';
import { Card } from '../../components/Card';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { AuthStackParamList } from '../../navigation/types';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export function LoginScreen() {
    const navigation = useNavigation<LoginScreenNavigationProp>();
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Sélecteur de langue purement visuel pour l'instant — le vrai travail
    // d'internationalisation est prévu plus tard, si le temps le permet.
    const [langue, setLangue] = useState<'FR' | 'EN'>('FR');

    async function handleLogin() {
        setErrorMessage('');
        setIsLoading(true);
        try {
            await login(email.trim(), password);
        } catch (error: any) {
            const message = error?.response?.data?.message ?? 'Une erreur est survenue. Réessaie.';
            setErrorMessage(message);
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
                <View style={styles.langueSelector}>
                    <TouchableOpacity onPress={() => setLangue('FR')}>
                        <Text style={[styles.langueText, langue === 'FR' && styles.langueTextActive]}>FR</Text>
                    </TouchableOpacity>
                    <Text style={styles.langueSeparator}>/</Text>
                    <TouchableOpacity onPress={() => setLangue('EN')}>
                        <Text style={[styles.langueText, langue === 'EN' && styles.langueTextActive]}>EN</Text>
                    </TouchableOpacity>
                </View>
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

                {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

                <Button title="Se connecter" onPress={handleLogin} loading={isLoading} />

                <TouchableOpacity onPress={() => navigation.navigate('RegisterChoice')} style={styles.linkContainer}>
                    <Text style={styles.linkText}>
                        Vous n'avez pas de compte ?{'\n'}
                        <Text style={styles.linkTextBold}>Inscrivez-vous maintenant !</Text>
                    </Text>
                </TouchableOpacity>
            </Card>
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
    langueSelector: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    langueText: {
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.black,
        opacity: 0.5,
        paddingHorizontal: 4,
    },
    langueTextActive: {
        fontFamily: fonts.bold,
        opacity: 1,
    },
    langueSeparator: {
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.black,
        opacity: 0.5,
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