import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput as RNTextInput, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import { AuthBackground } from '../../components/AuthBackground';
import { Card } from '../../components/Card';
import { verifyOtp, resendOtp } from '../../api/authApi';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { AuthStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'OtpVerification'>;
type RouteProps = RouteProp<AuthStackParamList, 'OtpVerification'>;

const RESEND_COOLDOWN_SECONDS = 60;
const CODE_LENGTH = 6;

export function OtpVerificationScreen() {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<RouteProps>();
    const { email } = route.params;

    const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
    const inputRefs = useRef<Array<RNTextInput | null>>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (cooldown === 0) return;
        const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    function handleDigitChange(text: string, index: number) {
        const value = text.replace(/[^0-9]/g, '').slice(-1);
        const newDigits = [...digits];
        newDigits[index] = value;
        setDigits(newDigits);

        if (value && index < CODE_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    }

    function handleKeyPress(e: any, index: number) {
        if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    }

    async function handleVerify() {
        const code = digits.join('');
        if (code.length !== CODE_LENGTH) {
            setErrorMessage('Saisis les 6 chiffres du code.');
            return;
        }

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
        <AuthBackground>
            <Image
                source={require('../../../assets/OpenShelf_Black_Variant.png')}
                style={styles.logo}
                resizeMode="contain"
            />

            <TouchableOpacity
                onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })}
                style={styles.backButton}
            >
                <Text style={styles.backButtonText}>← Retour</Text>
            </TouchableOpacity>

            <Card>
                <Text style={styles.title}>Code de Validation du Compte</Text>
                <Text style={styles.subtitle}>Un code à 6 chiffres a été envoyé à{'\n'}{email}</Text>

                <View style={styles.otpRow}>
                    {digits.map((digit, index) => (
                        <RNTextInput
                            key={index}
                            ref={(ref) => {
                                inputRefs.current[index] = ref;
                            }}
                            value={digit}
                            onChangeText={(text) => handleDigitChange(text, index)}
                            onKeyPress={(e) => handleKeyPress(e, index)}
                            style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                            keyboardType="number-pad"
                            maxLength={1}
                        />
                    ))}
                </View>

                {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
                {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}

                <Button title="Vérifier" onPress={handleVerify} loading={isLoading} />

                <TouchableOpacity onPress={handleResend} disabled={cooldown > 0} style={styles.resendLink}>
                    <Text style={[styles.resendText, cooldown > 0 && styles.resendTextDisabled]}>
                        {cooldown > 0 ? `Renvoyer le code (${cooldown}s)` : 'Renvoyer le code'}
                    </Text>
                </TouchableOpacity>
            </Card>
        </AuthBackground>
    );
}

const styles = StyleSheet.create({
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
        marginBottom: 20,
    },
    backButtonText: {
        fontFamily: fonts.semiBold,
        fontSize: 14,
        color: colors.white,
    },
    title: {
        fontFamily: fonts.bold,
        fontSize: 22,
        color: colors.textPrimary,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.marine,
        textAlign: 'center',
        marginBottom: 24,
    },
    otpRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    otpBox: {
        width: 46,
        height: 56,
        borderWidth: 1.5,
        borderColor: colors.marine + '40',
        borderRadius: 12,
        textAlign: 'center',
        fontFamily: fonts.bold,
        fontSize: 22,
        color: colors.textPrimary,
    },
    otpBoxFilled: {
        borderColor: colors.primary,
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
    resendLink: {
        marginTop: 16,
        alignItems: 'center',
    },
    resendText: {
        fontFamily: fonts.semiBold,
        fontSize: 14,
        color: colors.accent,
    },
    resendTextDisabled: {
        color: colors.marine,
        opacity: 0.5,
    },
});