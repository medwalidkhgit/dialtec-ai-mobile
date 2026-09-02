import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput as RNTextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import { TextInput } from '../../components/TextInput';
import { AuthBackground } from '../../components/AuthBackground';
import { Card } from '../../components/Card';
import { AlertBanner } from '../../components/AlertBanner';
import { SuccessModal } from '../../components/SuccessModal';
import { resetPassword, forgotPassword } from '../../api/authApi';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { AuthStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>;
type RouteProps = RouteProp<AuthStackParamList, 'ResetPassword'>;

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

export function ResetPasswordScreen() {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<RouteProps>();
    const { email } = route.params;

    const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
    const inputRefs = useRef<Array<RNTextInput | null>>([]);

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [cooldown, setCooldown] = useState(0);
    const [reinitialisationReussie, setReinitialisationReussie] = useState(false);

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

    async function handleValider() {
        const code = digits.join('');
        if (code.length !== CODE_LENGTH) {
            setErrorMessage('Saisis les 6 chiffres du code.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setErrorMessage('Les mots de passe ne correspondent pas.');
            return;
        }

        setErrorMessage('');
        setIsLoading(true);
        try {
            await resetPassword({ email, code, newPassword });
            setReinitialisationReussie(true);
        } catch (error: any) {
            const message = error?.response?.data?.message ?? 'Code invalide ou expiré.';
            setErrorMessage(message);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleRenvoyer() {
        setErrorMessage('');
        try {
            await forgotPassword(email);
            setCooldown(RESEND_COOLDOWN_SECONDS);
        } catch (error: any) {
            const message = error?.response?.data?.message ?? 'Impossible de renvoyer le code.';
            setErrorMessage(message);
        }
    }

    return (
        <AuthBackground>
            <Card>
                <Text style={styles.title}>Nouveau mot de passe</Text>
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

                <TextInput
                    label="Nouveau mot de passe"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                />
                <TextInput
                    label="Confirmer le nouveau mot de passe"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                />

                <AlertBanner message={errorMessage} variant="error" />

                <Button title="Réinitialiser le mot de passe" onPress={handleValider} loading={isLoading} />

                <TouchableOpacity onPress={handleRenvoyer} disabled={cooldown > 0} style={styles.resendLink}>
                    <Text style={[styles.resendText, cooldown > 0 && styles.resendTextDisabled]}>
                        {cooldown > 0 ? `Renvoyer le code (${cooldown}s)` : 'Renvoyer le code'}
                    </Text>
                </TouchableOpacity>
            </Card>

            <SuccessModal
                visible={reinitialisationReussie}
                title="Mot de passe réinitialisé"
                onDone={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })}
            />
        </AuthBackground>
    );
}

const styles = StyleSheet.create({
    title: {
        fontFamily: fonts.bold,
        fontSize: 22,
        color: colors.textPrimary,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.marine,
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 20,
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
    resendLink: { alignItems: 'center', marginTop: 16 },
    resendText: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.accent },
    resendTextDisabled: { color: colors.marine, opacity: 0.5 },
});