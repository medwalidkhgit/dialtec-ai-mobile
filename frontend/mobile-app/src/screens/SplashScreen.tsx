import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export function SplashScreen() {
    return (
        <View style={styles.container}>
            <Image
                source={require('../../assets/splash.jpg')}
                style={styles.image}
                resizeMode="cover"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    image: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
});