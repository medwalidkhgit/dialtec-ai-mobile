import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import { TextInput } from '../../components/TextInput';
import { registerCommercant } from '../../api/authApi';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { AuthStackParamList } from '../../navigation/types';
import { SHOP_CATEGORIES, SHOP_CATEGORY_LABELS, ShopCategory } from '../../constants/shopCategories';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'RegisterCommercant'>;

export function RegisterCommercantScreen() {
    const navigation = useNavigation<NavigationProp>();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [shopCategory, setShopCategory] = useState<ShopCategory | null>(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [description, setDescription] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    async function handleRegister() {
        if (password !== confirmPassword) {
            setErrorMessage('Les mots de passe ne correspondent pas.');
            return;
        }

        if (!shopCategory) {
            setErrorMessage('Choisis une catégorie de boutique.');
            return;
        }

        setErrorMessage('');
        setIsLoading(true);
        try {
            await registerCommercant({
                email: email.trim(),
                password,
                fullName,
                shopCategory,
                phoneNumber,
                address,
                city,
                postalCode,
                description: description || undefined,
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
                <Text style={styles.title}>Inscription commerçant</Text>

                <TextInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                <TextInput label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry />
                <TextInput
                    label="Confirmer le mot de passe"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                />
                <TextInput label="Nom complet" value={fullName} onChangeText={setFullName} />

                <Text style={styles.label}>Catégorie de boutique</Text>
                <View style={styles.chipsContainer}>
                    {SHOP_CATEGORIES.map((category) => {
                        const isSelected = category === shopCategory;
                        return (
                            <Pressable
                                key={category}
                                onPress={() => setShopCategory(category)}
                                style={[styles.chip, isSelected && styles.chipSelected]}
                            >
                                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                                    {SHOP_CATEGORY_LABELS[category]}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>

                <TextInput label="Téléphone" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
                <TextInput label="Adresse" value={address} onChangeText={setAddress} />
                <TextInput label="Ville" value={city} onChangeText={setCity} />
                <TextInput label="Code postal" value={postalCode} onChangeText={setPostalCode} keyboardType="number-pad" />
                <TextInput label="Description (optionnel)" value={description} onChangeText={setDescription} multiline />

                {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

                <Button title="S'inscrire" onPress={handleRegister} loading={isLoading} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.white },
    container: { paddingHorizontal: 24, paddingVertical: 40 },
    title: {
        fontFamily: fonts.bold,
        fontSize: 24,
        color: colors.textPrimary,
        marginBottom: 24,
        textAlign: 'center',
    },
    label: {
        fontFamily: fonts.semiBold,
        fontSize: 14,
        color: colors.textPrimary,
        marginBottom: 8,
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    chip: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: colors.marine + '40',
    },
    chipSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    chipText: {
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.textPrimary,
    },
    chipTextSelected: {
        color: colors.white,
    },
    error: {
        fontFamily: fonts.regular,
        fontSize: 14,
        color: '#D32F2F',
        marginBottom: 16,
        textAlign: 'center',
    },
});