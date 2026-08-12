import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import { TextInput } from '../../components/TextInput';
import { verifyOtp, resendOtp } from '../../api/authApi';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { AuthStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'OtpVerification'>;
type RouteProps = RouteProp<AuthStackParamList, 'OtpVerification'>;

const RESEND_COOLDOWN_SECONDS = 60;

export function OtpVerificationScreen() {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<RouteProps>();
    const { email } = route.params;

    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (cooldown === 0) return;
        const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    async function handleVerify() {
        setErrorMessage('');
        setIsLoading(true);
        try {
            await verifyOtp(email, code);
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        } catch (error: any) {
            const message = error?.response?.data?.message ?? 'Code invalide. Réessaie.';
            setErrorMessage(message);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleResend() {
        setErrorMessage('');
        setSuccessMessage('');
        try {
            await resendOtp(email);
            setSuccessMessage('Un nouveau code a été envoyé.');
            setCooldown(RESEND_COOLDOWN_SECONDS);
        } catch (error: any) {
            const message = error?.response?.data?.message ?? 'Impossible de renvoyer le code.';
            setErrorMessage(message);
        }
    }

    return (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.container}>
                <Text style={styles.title}>Vérification</Text>
                <Text style={styles.subtitle}>Un code à 6 chiffres a été envoyé à{'\n'}{email}</Text>

                <TextInput
                    label="Code de vérification"
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholder="123456"
                />

                {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
                {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}

                <Button title="Vérifier" onPress={handleVerify} loading={isLoading} />

                <Button
                    title={cooldown > 0 ? `Renvoyer le code (${cooldown}s)` : 'Renvoyer le code'}
                    variant="outline"
                    onPress={handleResend}
                    disabled={cooldown > 0}
                    style={styles.resendButton}
                />
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.white },
    container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
    title: {
        fontFamily: fonts.bold,
        fontSize: 24,
        color: colors.textPrimary,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.marine,
        textAlign: 'center',
        marginBottom: 32,
    },
    error: {
        fontFamily: fonts.regular,
        fontSize: 14,
        color: '#D32F2F',
        marginBottom: 16,
        textAlign: 'center',
    },
    success: {
        fontFamily: fonts.regular,
        fontSize: 14,
        color: '#2E7D32',
        marginBottom: 16,
        textAlign: 'center',
    },
    resendButton: {
        marginTop: 12,
    },
});