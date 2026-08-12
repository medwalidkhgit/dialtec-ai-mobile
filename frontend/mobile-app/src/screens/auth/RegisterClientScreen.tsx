import React, { useState } from 'react';
import { Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
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
            const message = error?.response?.data?.message ?? 'Une erreur est survenue. Réessaie.';
            setErrorMessage(message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                <Text style={styles.title}>Inscription client</Text>

                <TextInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                <TextInput label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry />
                <TextInput
                    label="Confirmer le mot de passe"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                />
                <TextInput label="Nom complet" value={fullName} onChangeText={setFullName} />
                <TextInput label="Téléphone" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />

                {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

                <Button title="S'inscrire" onPress={handleRegister} loading={isLoading} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.white },
    container: { paddingHorizontal: 24, paddingVertical: 40, justifyContent: 'center', flexGrow: 1 },
    title: {
        fontFamily: fonts.bold,
        fontSize: 24,
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
});