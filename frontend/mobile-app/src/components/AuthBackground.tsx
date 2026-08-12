import React, { ReactNode } from 'react';
import { ImageBackground, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

interface AuthBackgroundProps {
    children: ReactNode;
}

export function AuthBackground({ children }: AuthBackgroundProps) {
    return (
        <ImageBackground
            source={require('../../assets/background.png')}
            style={styles.background}
            resizeMode="cover"
        >
            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    {children}
                </ScrollView>
            </KeyboardAvoidingView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: { flex: 1 },
    flex: { flex: 1 },
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
});