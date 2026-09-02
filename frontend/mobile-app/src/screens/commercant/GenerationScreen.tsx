import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, Alert, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Slider from '@react-native-community/slider';
import * as ImagePicker from 'expo-image-picker';
import {
    AudioModule,
    RecordingPresets,
    setAudioModeAsync,
    useAudioRecorder,
    useAudioRecorderState,
    useAudioPlayer,
    useAudioPlayerStatus,
} from 'expo-audio';
import { Button } from '../../components/Button';
import { Header } from '../../components/Header';
import { SuccessModal } from '../../components/SuccessModal';
import { uploadPhoto, uploadAudio } from '../../api/mediaApi';
import { declencherGeneration, consulterGeneration } from '../../api/produitApi';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { GenerationStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<GenerationStackParamList, 'GenerationCapture'>;

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 40; // 120 secondes au total — plus de marge sur un vrai réseau internet qu'en local

const ETAPES_ENVOI = [
    'Envoi de la photo et de l\'audio',
    'Lancement de la génération',
    'Génération en cours',
] as const;

/** Convertit des millisecondes en format mm:ss, pour l'affichage du chronomètre. */
function formatDuree(ms: number): string {
    const secondesTotales = Math.floor(ms / 1000);
    const minutes = Math.floor(secondesTotales / 60);
    const secondes = secondesTotales % 60;
    return `${minutes}:${secondes.toString().padStart(2, '0')}`;
}

export function GenerationScreen() {
    const navigation = useNavigation<NavigationProp>();

    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [audioUri, setAudioUri] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [etapeEnvoiActuelle, setEtapeEnvoiActuelle] = useState(0);
    const [generationReussie, setGenerationReussie] = useState(false);
    const [produitGenereId, setProduitGenereId] = useState<string | null>(null);

    // Régulièrement rafraîchi (toutes les 200ms) pour un chronomètre fluide
    // pendant l'enregistrement, plutôt que des sauts par à-coups.
    const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    const recorderState = useAudioRecorderState(audioRecorder, 200);

    // Le player n'a besoin d'exister qu'une fois un audio réellement
    // enregistré — sans URI, on lui donne "null" et il reste inactif.
    const audioPlayer = useAudioPlayer(audioUri ? { uri: audioUri } : null);
    const playerStatus = useAudioPlayerStatus(audioPlayer);

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

        const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true });
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

    // "Pause" finalise directement l'enregistrement (stop, pas pause) — la
    // méthode pause() native s'est révélée peu fiable en test (réinitialise
    // le chronomètre au lieu de vraiment mettre en pause). stop() est,
    // lui, confirmé fiable — préférence pour la stabilité, à quelques
    // minutes de la démo, plutôt qu'une fonctionnalité de reprise risquée.
    async function handlePauseRecording() {
        await audioRecorder.stop();
        setAudioUri(audioRecorder.uri ?? null);
    }

    function handleAnnulerTout() {
        Alert.alert(
            'Annuler et recommencer ?',
            'La photo et l\'audio en cours seront définitivement perdus.',
            [
                { text: 'Non', style: 'cancel' },
                {
                    text: 'Oui, tout annuler',
                    style: 'destructive',
                    onPress: async () => {
                        if (recorderState.isRecording) {
                            await audioRecorder.stop();
                        }
                        if (playerStatus.playing) {
                            audioPlayer.pause();
                        }
                        setPhotoUri(null);
                        setAudioUri(null);
                    },
                },
            ]
        );
    }

    // Distincte de handleSupprimerAudio — celle-ci s'utilise PENDANT
    // l'enregistrement actif (pas après). Elle doit réellement arrêter le
    // micro (l'ancienne version ne le faisait pas, d'où le bouton qui ne
    // semblait "rien faire"), puis relance directement un nouvel
    // enregistrement à zéro, sans repasser par l'écran d'attente.
    async function handleRecommencerEnregistrement() {
        await audioRecorder.stop();
        await audioRecorder.prepareToRecordAsync();
        audioRecorder.record();
    }

    function handleSupprimerAudio() {
        if (playerStatus.playing) {
            audioPlayer.pause();
        }
        setAudioUri(null);
    }

    function handleTogglePlayback() {
        if (playerStatus.playing) {
            audioPlayer.pause();
        } else {
            // Si la lecture précédente est arrivée à la fin, on repart du début
            // plutôt que de rester bloqué sur une position déjà terminée.
            if (playerStatus.didJustFinish) {
                audioPlayer.seekTo(0);
            }
            audioPlayer.play();
        }
    }

    async function handleSubmit() {
        if (!photoUri || !audioUri) {
            Alert.alert('Incomplet', "Prends une photo et enregistre l'audio avant d'envoyer.");
            return;
        }

        setIsSubmitting(true);
        try {
            setEtapeEnvoiActuelle(0);
            // Les deux uploads sont indépendants l'un de l'autre — les lancer
            // en parallèle (plutôt que l'un après l'autre) réduit le temps
            // d'attente total, environ de moitié.
            const [photo, audio] = await Promise.all([uploadPhoto(photoUri), uploadAudio(audioUri)]);

            setEtapeEnvoiActuelle(1);
            const generationId = await declencherGeneration(photo.url, photo.key, audio.url, audio.key);

            setEtapeEnvoiActuelle(2);
            await pollGeneration(generationId);
        } catch (error: any) {
            console.error('Erreur génération - détail complet:', JSON.stringify(error?.response?.data ?? error?.message ?? error, null, 2));
            const message = error?.response?.data?.message ?? "Une erreur est survenue pendant l'envoi.";
            Alert.alert('Erreur', message);
            setIsSubmitting(false);
            setEtapeEnvoiActuelle(0);
        }
    }

    async function pollGeneration(generationId: string, attempt = 0) {
        if (attempt >= POLL_MAX_ATTEMPTS) {
            Alert.alert(
                'Délai dépassé',
                'La génération prend plus de temps que prévu. Réessaie plus tard depuis le catalogue.'
            );
            setIsSubmitting(false);
            setEtapeEnvoiActuelle(0);
            return;
        }

        try {
            const produit = await consulterGeneration(generationId);
            setIsSubmitting(false);
            setEtapeEnvoiActuelle(0);
            setPhotoUri(null);
            setAudioUri(null);
            setProduitGenereId(produit.id);
            setGenerationReussie(true);
        } catch (error: any) {
            console.log(
                `[pollGeneration] tentative ${attempt + 1}/${POLL_MAX_ATTEMPTS} échouée:`,
                error?.response?.status,
                error?.response?.data?.message ?? error?.message
            );
            setTimeout(() => pollGeneration(generationId, attempt + 1), POLL_INTERVAL_MS);
        }
    }

    const photoValidee = !!photoUri;
    const audioValide = !!audioUri;

    return (
        <View style={styles.wrapper}>
            <Header role="commercant" />

            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Générer une nouvelle fiche de produit</Text>
                <Text style={styles.subtitle}>
                    Utilisez votre caméra pour prendre une photo du produit, puis enregistrez votre
                    description audio en renseignant les informations nécessaires.
                </Text>

                {(photoUri || audioUri || recorderState.isRecording) && (
                    <TouchableOpacity onPress={handleAnnulerTout} style={styles.annulerLink}>
                        <Text style={styles.annulerLinkText}>✕ Annuler et recommencer</Text>
                    </TouchableOpacity>
                )}

                {/* Étape 1 — Photo */}
                <View style={styles.etapeBlock}>
                    <View style={styles.etapeHeader}>
                        <View style={[styles.etapeBadge, photoValidee && styles.etapeBadgeValidee]}>
                            <Text style={styles.etapeBadgeText}>{photoValidee ? '✓' : '1'}</Text>
                        </View>
                        <Text style={[styles.etapeLabel, photoValidee && styles.etapeLabelValidee]}>
                            {photoValidee ? 'Étape 1 : Photo validée' : 'Étape 1 : Prendre une photo'}
                        </Text>
                    </View>

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

                {/* Étape 2 — Audio, style WhatsApp */}
                <View style={styles.etapeBlock}>
                    <View style={styles.etapeHeader}>
                        <View style={[styles.etapeBadge, audioValide && styles.etapeBadgeValidee]}>
                            <Text style={styles.etapeBadgeText}>{audioValide ? '✓' : '2'}</Text>
                        </View>
                        <Text style={[styles.etapeLabel, audioValide && styles.etapeLabelValidee]}>
                            {audioValide ? 'Étape 2 : Audio validé' : 'Étape 2 : Enregistrer la description'}
                        </Text>
                    </View>

                    {/* État 1 — inactif, rien enregistré */}
                    {!recorderState.isRecording && !audioUri && (
                        <Button title="🎙 Enregistrer" variant="outline" dark onPress={handleStartRecording} />
                    )}

                    {/* État 2 — enregistrement actif */}
                    {recorderState.isRecording && (
                        <View style={styles.audioActifContainer}>
                            <View style={styles.dureeRow}>
                                <View style={styles.pointRouge} />
                                <Text style={styles.dureeText}>{formatDuree(recorderState.durationMillis ?? 0)}</Text>
                            </View>
                            <View style={styles.audioButtonsRow}>
                                <Button title="Pause" style={styles.pauseButton} onPress={handlePauseRecording} />
                                <Button title="Recommencer" variant="danger" onPress={handleRecommencerEnregistrement} />
                            </View>
                        </View>
                    )}

                    {/* État 3 — finalisé, écoute avec curseur déplaçable */}
                    {audioUri && (
                        <View style={styles.lectureContainer}>
                            <View style={styles.lectureRow}>
                                <Button
                                    title={playerStatus.playing ? '⏸' : '▶'}
                                    variant="accent"
                                    onPress={handleTogglePlayback}
                                    style={styles.boutonLecture}
                                />
                                <Slider
                                    style={styles.slider}
                                    minimumValue={0}
                                    maximumValue={playerStatus.duration || 1}
                                    value={playerStatus.currentTime || 0}
                                    onSlidingComplete={(valeur) => audioPlayer.seekTo(valeur)}
                                    minimumTrackTintColor={colors.accent}
                                    maximumTrackTintColor={colors.darkBorder}
                                    thumbTintColor={colors.accent}
                                />
                                <Text style={styles.dureeCourte}>
                                    {formatDuree((playerStatus.currentTime ?? 0) * 1000)}
                                </Text>
                            </View>
                            <Button title="Supprimer" variant="danger" onPress={handleSupprimerAudio} style={styles.supprimerLecture} />
                        </View>
                    )}
                </View>

                {/* Progression de l'envoi, en étapes colorées */}
                {isSubmitting && (
                    <View style={styles.progressionContainer}>
                        {ETAPES_ENVOI.map((libelle, index) => {
                            const estTerminee = index < etapeEnvoiActuelle;
                            const estActive = index === etapeEnvoiActuelle;
                            return (
                                <View key={libelle} style={styles.progressionRow}>
                                    <View
                                        style={[
                                            styles.progressionPuce,
                                            estTerminee && styles.progressionPuceTerminee,
                                            estActive && styles.progressionPuceActive,
                                        ]}
                                    >
                                        <Text style={styles.progressionPuceText}>{estTerminee ? '✓' : index + 1}</Text>
                                    </View>
                                    <Text
                                        style={[
                                            styles.progressionLabel,
                                            estTerminee && styles.progressionLabelTerminee,
                                            estActive && styles.progressionLabelActive,
                                        ]}
                                    >
                                        {libelle}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                )}

                {!isSubmitting && (
                    <Button
                        title="Générer la fiche"
                        onPress={handleSubmit}
                        disabled={!photoValidee || !audioValide}
                        style={styles.submitButton}
                    />
                )}
            </ScrollView>

            <SuccessModal
                visible={generationReussie}
                title="Fiche générée avec succès"
                onDone={() => {
                    setGenerationReussie(false);
                    if (produitGenereId) navigation.navigate('ProduitDetail', { produitId: produitGenereId });
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: colors.darkBackground },
    container: { padding: 20, paddingBottom: 40 },
    title: {
        fontFamily: fonts.bold,
        fontSize: 22,
        color: colors.darkTextPrimary,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.darkTextSecondary,
        marginBottom: 28,
        textAlign: 'center',
        lineHeight: 20,
    },
    annulerLink: { alignItems: 'center', marginBottom: 20, marginTop: -12 },
    annulerLinkText: { fontFamily: fonts.semiBold, fontSize: 13, color: '#D32F2F' },
    etapeBlock: { marginBottom: 24 },
    etapeHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    etapeBadge: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: colors.darkSurface,
        borderWidth: 1,
        borderColor: colors.darkBorder,
        alignItems: 'center',
        justifyContent: 'center',
    },
    etapeBadgeValidee: {
        backgroundColor: colors.success,
        borderColor: colors.success,
    },
    etapeBadgeText: { fontFamily: fonts.bold, fontSize: 13, color: colors.darkTextPrimary },
    etapeLabel: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.darkTextPrimary },
    etapeLabelValidee: { color: colors.success },
    photoPreview: { width: '100%', height: 200, borderRadius: 12, marginBottom: 12 },
    photoPlaceholder: {
        backgroundColor: colors.darkSurface,
        borderWidth: 1,
        borderColor: colors.darkBorder,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: { fontFamily: fonts.regular, color: colors.darkTextSecondary },
    audioActifContainer: { alignItems: 'center' },
    dureeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
    pointRouge: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#D32F2F' },
    dureeText: {
        fontFamily: fonts.semiBold,
        fontSize: 18,
        color: colors.darkTextPrimary,
        marginBottom: 14,
    },
    audioButtonsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center' },
    pauseButton: { backgroundColor: '#E8B93A' },
    lectureContainer: { alignItems: 'stretch' },
    lectureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    boutonLecture: { width: 52, paddingHorizontal: 0 },
    slider: { flex: 1, height: 40 },
    dureeCourte: { fontFamily: fonts.regular, fontSize: 12, color: colors.darkTextSecondary, width: 40 },
    supprimerLecture: { alignSelf: 'center' },
    progressionContainer: { marginTop: 8, marginBottom: 20 },
    progressionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
    progressionPuce: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.darkSurface,
        borderWidth: 1,
        borderColor: colors.darkBorder,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressionPuceActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    progressionPuceTerminee: { backgroundColor: colors.success, borderColor: colors.success },
    progressionPuceText: { fontFamily: fonts.bold, fontSize: 13, color: colors.white },
    progressionLabel: { fontFamily: fonts.regular, fontSize: 14, color: colors.darkTextSecondary },
    progressionLabelActive: { fontFamily: fonts.semiBold, color: colors.accent },
    progressionLabelTerminee: { color: colors.success },
    submitButton: { marginTop: 8 },
});