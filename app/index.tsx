import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ONBOARDING_KEY = '@simakan_has_onboarded';

// SVG Wave data URI representing the exact organic swoop curve between top teal header and white bottom section
const WAVE_SVG_URI = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzNzUgMTIwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cGF0aCBkPSJNMCwwIEwzNzUsMCBMMzc1LDE1IEMyODAsOTAgMTQwLDEyNSAwLDYwIFoiIGZpbGw9IiMxNEEzOUYiLz48L3N2Zz4=`;

function OnboardingScreen({ onFinish }: { onFinish: () => void }) {
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
            onPress={onFinish}
          >
            <Text style={styles.buttonText}>Mulai Sekarang</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

import DashboardScreen from '@/components/screens/DashboardScreen';
import InventoryScreen from '@/components/screens/InventoryScreen';
import RekapPemasukanScreen from '@/components/screens/RekapPemasukanScreen';
import RekapPengeluaranScreen from '@/components/screens/RekapPengeluaranScreen';
import SplashScreen from '@/components/screens/SplashScreen';
import StatisticsScreen from '@/components/screens/StatisticsScreen';
import { NavigationProvider, useAppNavigation } from '@/context/NavigationContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function MainApp() {
  const { currentScreen, navigate } = useAppNavigation();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 12);

  const showBottomNav = currentScreen === 'dashboard' || currentScreen === 'inventory' || currentScreen === 'statistics';

  return (
    <View style={styles.container}>
      <View style={{ flex: 1, display: currentScreen === 'dashboard' ? 'flex' : 'none' }}>
        <DashboardScreen />
      </View>
      <View style={{ flex: 1, display: currentScreen === 'inventory' ? 'flex' : 'none' }}>
        <InventoryScreen />
      </View>
      <View style={{ flex: 1, display: currentScreen === 'statistics' ? 'flex' : 'none' }}>
        <StatisticsScreen />
      </View>
      <View style={{ flex: 1, display: currentScreen === 'rekap-pemasukan' ? 'flex' : 'none' }}>
        <RekapPemasukanScreen />
      </View>
      <View style={{ flex: 1, display: currentScreen === 'rekap-pengeluaran' ? 'flex' : 'none' }}>
        <RekapPengeluaranScreen />
      </View>

      {/* Unified Bottom Nav */}
      {showBottomNav && (
        <View style={[styles.bottomNav, { paddingBottom: bottomInset, height: 60 + bottomInset }]}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.navItem}
            onPress={() => navigate('dashboard')}
          >
            <Ionicons
              name={currentScreen === 'dashboard' ? 'home' : 'home-outline'}
              size={26}
              color={currentScreen === 'dashboard' ? '#14A39F' : '#94A3B8'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.navItem}
            onPress={() => navigate('statistics')}
          >
            <Ionicons
              name={currentScreen === 'statistics' ? 'book' : 'book-outline'}
              size={24}
              color={currentScreen === 'statistics' ? '#14A39F' : '#94A3B8'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.navItem}
            onPress={() => navigate('inventory')}
          >
            <Ionicons
              name={currentScreen === 'inventory' ? 'cube' : 'cube-outline'}
              size={26}
              color={currentScreen === 'inventory' ? '#14A39F' : '#94A3B8'}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function App() {
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [isSplashComplete, setSplashComplete] = useState(false);

  useEffect(() => {
    async function checkFirstLaunch() {
      try {
        const onboarded = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (onboarded === 'true') {
          setHasOnboarded(true);
        }
      } catch (err) {
        console.log('Error checking onboarding status:', err);
      } finally {
        setCheckingOnboarding(false);
      }
    }
    checkFirstLaunch();
  }, []);

  const handleFinishOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch (err) {
      console.log('Error saving onboarding flag:', err);
    }
    setHasOnboarded(true);
  };

  let content;
  if (checkingOnboarding) {
    content = (
      <View style={[styles.container, { backgroundColor: '#14A39F', justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  } else if (!hasOnboarded) {
    content = <OnboardingScreen onFinish={handleFinishOnboarding} />;
  } else {
    content = (
      <NavigationProvider>
        <MainApp />
      </NavigationProvider>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {content}
      {!isSplashComplete && <SplashScreen onFinish={() => setSplashComplete(true)} />}
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
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 10,
    paddingTop: 14,
    position: 'absolute',
    bottom: 0,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
});
