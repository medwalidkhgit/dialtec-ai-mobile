import React, { useState } from 'react';
import {
    View,
    Text,
    Image,
    ImageBackground,
    ScrollView,
    StyleSheet,
    Pressable,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
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
                        <Text style={styles.title}>Inscription commerçant</Text>

                        <TextInput label="Email" required value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                        <TextInput label="Mot de passe" required value={password} onChangeText={setPassword} secureTextEntry />
                        <TextInput
                            label="Confirmer le mot de passe"
                            required
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                        />
                        <TextInput label="Nom complet" required value={fullName} onChangeText={setFullName} />

                        <Text style={styles.label}>
                            Catégorie de boutique <Text style={styles.required}>*</Text>
                        </Text>
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

                        <TextInput label="Téléphone" required value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
                        <TextInput label="Adresse" required value={address} onChangeText={setAddress} />
                        <TextInput label="Ville" required value={city} onChangeText={setCity} />
                        <TextInput label="Code postal" required value={postalCode} onChangeText={setPostalCode} keyboardType="number-pad" />
                        <TextInput
                            label="Description (optionnel)"
                            value={description}
                            onChangeText={setDescription}
                            multiline
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
    // La carte remplit l'espace restant (flex: 1) au lieu de grandir avec le
    // contenu — c'est ce qui rend le défilement INTERNE nécessaire, et fait
    // apparaître la barre de scroll sur le bord droit de la carte elle-même,
    // pas de tout l'écran.
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
    label: {
        fontFamily: fonts.semiBold,
        fontSize: 14,
        color: colors.textPrimary,
        marginBottom: 8,
    },
    required: {
        color: '#D32F2F',
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