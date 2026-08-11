import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// SVG Wave data URI representing the exact organic swoop curve between top teal header and white bottom section
const WAVE_SVG_URI = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzNzUgMTIwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cGF0aCBkPSJNMCwwIEwzNzUsMCBMMzc1LDE1IEMyODAsOTAgMTQwLDEyNSAwLDYwIFoiIGZpbGw9IiMxNEEzOUYiLz48L3N2Zz4=`;

export default function OnboardingScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/dashboard');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Top Header Section (Teal Background + Curve + Character Illustration) */}
      <View style={styles.headerSection}>
        {/* Main Teal Background Area */}
        <View style={styles.tealBackground}>
          {/* Character Illustration */}
          <View style={styles.illustrationContainer}>
            <Image
              source={require('@/assets/images/onboarding_character.png')}
              style={styles.illustrationImage}
              contentFit="contain"
            />
          </View>
        </View>

        {/* Bottom Curved Wave Transition */}
        <View style={styles.waveContainer}>
          <Image
            source={{ uri: WAVE_SVG_URI }}
            style={styles.waveSvg}
            contentFit="fill"
          />
        </View>
      </View>

      {/* Bottom Content Section */}
      <SafeAreaView style={styles.bottomSection}>
        <View style={styles.contentContainer}>
          <Text style={styles.titleText}>Membuat hidup Anda lebih mudah</Text>
          
          <Text style={styles.subtitleText}>
            Kelola pemasukan dan pengeluaran Anda dengan cara termudah menggunakan aplikasi ini
          </Text>
        </View>

        {/* Action Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.getStartedButton}
            onPress={handleGetStarted}
          >
            <Text style={styles.buttonText}>Mulai Sekarang</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7F6',
  },
  headerSection: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.58,
    position: 'relative',
  },
  tealBackground: {
    width: '100%',
    height: '84%',
    backgroundColor: '#14A39F',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  illustrationContainer: {
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_HEIGHT * 0.42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationImage: {
    width: '100%',
    height: '100%',
  },
  waveContainer: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.12,
    marginTop: -1,
  },
  waveSvg: {
    width: '100%',
    height: '100%',
  },
  bottomSection: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === 'ios' ? 24 : 32,
  },
  contentContainer: {
    paddingTop: 10,
  },
  titleText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#21262C',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  subtitleText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#5C6670',
    lineHeight: 22,
    paddingRight: 40,
  },
  buttonContainer: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  getStartedButton: {
    backgroundColor: '#14A39F',
    width: '78%',
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#14A39F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
