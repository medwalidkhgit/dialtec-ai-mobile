import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import {
    AudioModule,
    RecordingPresets,
    setAudioModeAsync,
    useAudioRecorder,
    useAudioRecorderState,
} from 'expo-audio';
import { Button } from '../../components/Button';
import { Header } from '../../components/Header';
import { uploadPhoto, uploadAudio } from '../../api/mediaApi';
import { declencherGeneration, consulterGeneration } from '../../api/produitApi';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { GenerationStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<GenerationStackParamList, 'GenerationCapture'>;

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 20;

export function GenerationScreen() {
    const navigation = useNavigation<NavigationProp>();

    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [audioUri, setAudioUri] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    const recorderState = useAudioRecorderState(audioRecorder);

    // Sans cette configuration explicite, l'enregistrement peut échouer
    // silencieusement, notamment sur iOS — trouvé dans la documentation
    // officielle expo-audio, absent de notre première version.
    useEffect(() => {
        setAudioModeAsync({
            playsInSilentMode: true,
            allowsRecording: true,
        });
    }, []);

    async function handleTakePhoto() {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission requise', "L'accès à la caméra est nécessaire.");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
        if (!result.canceled) {
            setPhotoUri(result.assets[0].uri);
        }
    }

    async function handleStartRecording() {
        const permission = await AudioModule.requestRecordingPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission requise', "L'accès au micro est nécessaire.");
            return;
        }

        await audioRecorder.prepareToRecordAsync();
        audioRecorder.record();
    }

    async function handleStopRecording() {
        await audioRecorder.stop();
        setAudioUri(audioRecorder.uri ?? null);
    }

    async function handleSubmit() {
        if (!photoUri || !audioUri) {
            Alert.alert('Incomplet', "Prends une photo et enregistre l'audio avant d'envoyer.");
            return;
        }

        setIsSubmitting(true);
        try {
            setStatusMessage('Envoi de la photo...');
            const photo = await uploadPhoto(photoUri);

            setStatusMessage("Envoi de l'audio...");
            const audio = await uploadAudio(audioUri);

            setStatusMessage('Lancement de la génération...');
            const generationId = await declencherGeneration(photo.url, photo.key, audio.url, audio.key);

            setStatusMessage('Génération en cours, patiente quelques instants...');
            await pollGeneration(generationId);
        } catch {
            Alert.alert('Erreur', "Une erreur est survenue pendant l'envoi.");
            setIsSubmitting(false);
            setStatusMessage('');
        }
    }

    async function pollGeneration(generationId: string, attempt = 0) {
        if (attempt >= POLL_MAX_ATTEMPTS) {
            Alert.alert(
                'Délai dépassé',
                'La génération prend plus de temps que prévu. Réessaie plus tard depuis le catalogue.'
            );
            setIsSubmitting(false);
            setStatusMessage('');
            return;
        }

        try {
            const produit = await consulterGeneration(generationId);
            setIsSubmitting(false);
            setStatusMessage('');
            setPhotoUri(null);
            setAudioUri(null);
            navigation.navigate('ProduitDetail', { produitId: produit.id });
        } catch {
            setTimeout(() => pollGeneration(generationId, attempt + 1), POLL_INTERVAL_MS);
        }
    }

    return (
        <View style={styles.wrapper}>
            <Header role="commercant" />

            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Nouvelle fiche produit</Text>

                <View style={styles.captureRow}>
                    {photoUri ? (
                        <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                    ) : (
                        <View style={[styles.photoPreview, styles.photoPlaceholder]}>
                            <Text style={styles.placeholderText}>Aucune photo</Text>
                        </View>
                    )}
                    <Button
                        title={photoUri ? 'Reprendre la photo' : 'Prendre une photo'}
                        variant="outline"
                        dark
                        onPress={handleTakePhoto}
                    />
                </View>

                <View style={styles.captureRow}>
                    <Text style={styles.audioStatus}>
                        {audioUri ? 'Audio enregistré ✓' : recorderState.isRecording ? 'Enregistrement en cours...' : 'Aucun audio'}
                    </Text>
                    <Button
                        title={recorderState.isRecording ? "Arrêter l'enregistrement" : audioUri ? 'Réenregistrer' : 'Enregistrer'}
                        variant="outline"
                        dark
                        onPress={recorderState.isRecording ? handleStopRecording : handleStartRecording}
                    />
                </View>

                {isSubmitting ? (
                    <View style={styles.submittingContainer}>
                        <ActivityIndicator color={colors.accent} size="large" />
                        <Text style={styles.statusText}>{statusMessage}</Text>
                    </View>
                ) : (
                    <Button title="Générer la fiche" onPress={handleSubmit} style={styles.submitButton} />
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: colors.darkBackground },
    container: { padding: 20 },
    title: {
        fontFamily: fonts.bold,
        fontSize: 22,
        color: colors.darkTextPrimary,
        marginBottom: 24,
        textAlign: 'center',
    },
    captureRow: { marginBottom: 24, alignItems: 'center' },
    photoPreview: { width: '100%', height: 200, borderRadius: 12, marginBottom: 12 },
    photoPlaceholder: {
        backgroundColor: colors.darkSurface,
        borderWidth: 1,
        borderColor: colors.darkBorder,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: { fontFamily: fonts.regular, color: colors.darkTextSecondary },
    audioStatus: { fontFamily: fonts.regular, fontSize: 14, color: colors.darkTextPrimary, marginBottom: 12 },
    submittingContainer: { alignItems: 'center', marginTop: 20 },
    statusText: {
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.darkTextSecondary,
        marginTop: 12,
        textAlign: 'center',
    },
    submitButton: { marginTop: 12 },
});