import React, { useState } from 'react';
import {
    View,
    Text,
    Image,
    ImageBackground,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import { TextInput } from '../../components/TextInput';
import { registerClient } from '../../api/authApi';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { AuthStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'RegisterClient'>;

export function RegisterClientScreen() {
    const navigation = useNavigation<NavigationProp>();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    async function handleRegister() {
        if (password !== confirmPassword) {
            setErrorMessage('Les mots de passe ne correspondent pas.');
            return;
        }

        setErrorMessage('');
        setIsLoading(true);
        try {
            await registerClient({
                email: email.trim(),
                password,
                fullName,
                phoneNumber,
            });

            navigation.navigate('OtpVerification', { email: email.trim() });
        } catch (error: any) {
            // Pour une erreur de validation (400), le vrai détail par champ est
            // dans response.data.data (ex: {"password": "ne doit pas être vide"}),
            // jamais dans le simple message générique "Erreur de validation".
            const erreursParChamp = error?.response?.data?.data;
            const message =
                erreursParChamp && typeof erreursParChamp === 'object'
                    ? Object.values(erreursParChamp).join('\n')
                    : (error?.response?.data?.message ?? 'Une erreur est survenue. Réessaie.');
            setErrorMessage(message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <ImageBackground source={require('../../../assets/background.png')} style={styles.background} resizeMode="cover">
            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <Image
                    source={require('../../../assets/OpenShelf_Black_Variant.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />

                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Retour</Text>
                </TouchableOpacity>

                <View style={styles.cardWrapper}>
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator
                        keyboardShouldPersistTaps="handled"
                    >
                        <Text style={styles.title}>Inscription client</Text>

                        <TextInput
                            label="Email"
                            required
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                        <TextInput label="Mot de passe" required value={password} onChangeText={setPassword} secureTextEntry />
                        <TextInput
                            label="Confirmer le mot de passe"
                            required
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                        />
                        <TextInput label="Nom complet" required value={fullName} onChangeText={setFullName} />
                        <TextInput
                            label="Téléphone"
                            required
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            keyboardType="phone-pad"
                        />

                        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

                        <Button title="S'inscrire" onPress={handleRegister} loading={isLoading} />
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: { flex: 1 },
    flex: { flex: 1, paddingTop: 60, paddingHorizontal: 24 },
    logo: {
        width: 170,
        height: 46,
        alignSelf: 'center',
        marginBottom: 12,
    },
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
    cardWrapper: {
        flex: 1,
        backgroundColor: colors.white,
        borderRadius: 20,
        marginBottom: 30,
        overflow: 'hidden',
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
    },
    title: {
        fontFamily: fonts.bold,
        fontSize: 22,
        color: colors.textPrimary,
        marginBottom: 20,
        textAlign: 'center',
    },
    error: {
        fontFamily: fonts.regular,
        fontSize: 14,
        color: '#D32F2F',
        marginBottom: 16,
        textAlign: 'center',
    },
});