import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';
import { TextInput } from './TextInput';
import { changeEmail, changePassword } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

interface SecuritySectionProps {
    currentEmail: string;
    dark?: boolean;
}

export function SecuritySection({ currentEmail, dark }: SecuritySectionProps) {
    const { logout } = useAuth();

    const [isChangingEmail, setIsChangingEmail] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [emailPassword, setEmailPassword] = useState('');
    const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
    const [emailError, setEmailError] = useState('');

    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    async function handleChangeEmail() {
        setEmailError('');
        setIsSubmittingEmail(true);
        try {
            await changeEmail({ currentEmail, password: emailPassword, newEmail: newEmail.trim() });
            // Le compte repasse en attente de vérification côté backend — on
            // déconnecte immédiatement plutôt que de garder une session locale
            // avec un token qui référence encore l'ancien email. Le flux déjà
            // construit ("compte non vérifié" -> lien -> OTP) prend le relais
            // au prochain login.
            await logout();
        } catch (error: any) {
            const message = error?.response?.data?.message ?? "Impossible de modifier l'email.";
            setEmailError(message);
        } finally {
            setIsSubmittingEmail(false);
        }
    }

    async function handleChangePassword() {
        setPasswordError('');
        setPasswordSuccess('');

        if (newPassword !== confirmNewPassword) {
            setPasswordError('Les nouveaux mots de passe ne correspondent pas.');
            return;
        }

        setIsSubmittingPassword(true);
        try {
            await changePassword({ email: currentEmail, oldPassword, newPassword });
            setPasswordSuccess('Mot de passe modifié avec succès.');
            setOldPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setIsChangingPassword(false);
        } catch (error: any) {
            const message = error?.response?.data?.message ?? 'Impossible de modifier le mot de passe.';
            setPasswordError(message);
        } finally {
            setIsSubmittingPassword(false);
        }
    }

    return (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, dark && styles.sectionTitleDark]}>Sécurité</Text>

            {isChangingEmail ? (
                <View style={styles.subBlock}>
                    <TextInput
                        label="Nouvel email"
                        dark={dark}
                        value={newEmail}
                        onChangeText={setNewEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                    <TextInput
                        label="Mot de passe (confirmation)"
                        dark={dark}
                        value={emailPassword}
                        onChangeText={setEmailPassword}
                        secureTextEntry
                    />
                    {emailError ? <Text style={styles.error}>{emailError}</Text> : null}
                    <Text style={[styles.warningText, dark && styles.warningTextDark]}>
                        Après confirmation, tu devras vérifier la nouvelle adresse par code — tu seras déconnecté
                        automatiquement.
                    </Text>
                    <Button title="Confirmer le changement d'email" onPress={handleChangeEmail} loading={isSubmittingEmail} />
                    <Button
                        title="Annuler"
                        variant="outline"
                        dark={dark}
                        onPress={() => setIsChangingEmail(false)}
                        style={styles.spacedButton}
                    />
                </View>
            ) : (
                <Button
                    title="Changer d'email"
                    variant="outline"
                    dark={dark}
                    onPress={() => setIsChangingEmail(true)}
                    style={styles.spacedButton}
                />
            )}

            {isChangingPassword ? (
                <View style={styles.subBlock}>
                    <TextInput
                        label="Ancien mot de passe"
                        dark={dark}
                        value={oldPassword}
                        onChangeText={setOldPassword}
                        secureTextEntry
                    />
                    <TextInput
                        label="Nouveau mot de passe"
                        dark={dark}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry
                    />
                    <TextInput
                        label="Confirmer le nouveau mot de passe"
                        dark={dark}
                        value={confirmNewPassword}
                        onChangeText={setConfirmNewPassword}
                        secureTextEntry
                    />
                    {passwordError ? <Text style={styles.error}>{passwordError}</Text> : null}
                    <Button
                        title="Confirmer le changement de mot de passe"
                        onPress={handleChangePassword}
                        loading={isSubmittingPassword}
                    />
                    <Button
                        title="Annuler"
                        variant="outline"
                        dark={dark}
                        onPress={() => setIsChangingPassword(false)}
                        style={styles.spacedButton}
                    />
                </View>
            ) : (
                <>
                    {passwordSuccess ? <Text style={styles.success}>{passwordSuccess}</Text> : null}
                    <Button
                        title="Changer de mot de passe"
                        variant="outline"
                        dark={dark}
                        onPress={() => setIsChangingPassword(true)}
                        style={styles.spacedButton}
                    />
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    section: { marginTop: 32 },
    sectionTitle: {
        fontFamily: fonts.bold,
        fontSize: 17,
        color: colors.textPrimary,
        marginBottom: 14,
    },
    sectionTitleDark: {
        color: colors.darkTextPrimary,
    },
    subBlock: { marginBottom: 20 },
    spacedButton: { marginTop: 12 },
    warningText: {
        fontFamily: fonts.regular,
        fontSize: 12,
        color: colors.marine,
        marginBottom: 14,
        lineHeight: 17,
    },
    warningTextDark: {
        color: colors.darkTextSecondary,
    },
    error: {
        fontFamily: fonts.regular,
        fontSize: 13,
        color: '#D32F2F',
        marginBottom: 10,
    },
    success: {
        fontFamily: fonts.regular,
        fontSize: 13,
        color: '#2E7D32',
        marginBottom: 10,
    },
});