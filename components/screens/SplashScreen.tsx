import * as ExpoSplashScreen from 'expo-splash-screen';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [isAppReady, setAppReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const logoTranslateY = useRef(new Animated.Value(-50)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    async function prepare() {
      // Sembunyikan Native Splash Screen
      await ExpoSplashScreen.hideAsync().catch(() => {});
      
      // Animasi masuk
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(logoTranslateY, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        })
      ]).start();

      // Tahan 3 detik
      setTimeout(() => {
        setAppReady(true);
      }, 3000);
    }
    prepare();
  }, []);

  useEffect(() => {
    if (isAppReady) {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }
  }, [isAppReady]);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#ae0f0fff', justifyContent: 'center', alignItems: 'center', opacity: fadeAnim, zIndex: 9999 }]}>
      <Animated.Image 
        source={require('@/assets/images/logo-simakan-remove.png')} 
        style={{ width: SCREEN_WIDTH * 1.5, height: SCREEN_WIDTH * 1.5, opacity: logoOpacity, transform: [{ translateY: logoTranslateY }] }} 
        resizeMode="contain" 
      />
    </Animated.View>
  );
}
