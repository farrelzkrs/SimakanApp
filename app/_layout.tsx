import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, Animated, StyleSheet } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

// Mencegah splash screen bawaan hilang sebelum kita siap
SplashScreen.preventAutoHideAsync().catch(() => {});

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDatabase } from '@/hooks/use-database';
import { InventoryProvider } from '@/context/InventoryContext';
import { TransactionProvider } from '@/context/TransactionContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { db, isReady } = useDatabase();

  if (!isReady || !db) {
    return (
      <View style={{ flex: 1, backgroundColor: '#ffffff' }} />
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <InventoryProvider db={db}>
        <TransactionProvider db={db}>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              animationDuration: 240,
              gestureEnabled: true,
              fullScreenGestureEnabled: true,
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false, animation: 'fade' }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="modal"
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
                animationDuration: 260,
                title: 'Modal',
              }}
            />
          </Stack>
          <StatusBar style="light" />
        </TransactionProvider>
      </InventoryProvider>
    </ThemeProvider>
  );
}
