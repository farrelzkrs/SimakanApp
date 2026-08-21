import React, { createContext, useContext, useState, ReactNode } from 'react';
import { BackHandler } from 'react-native';

export type ScreenType = 'dashboard' | 'inventory' | 'statistics' | 'rekap-pemasukan' | 'rekap-pengeluaran';

interface NavigationContextType {
  currentScreen: ScreenType;
  navigate: (screen: ScreenType) => void;
  goBack: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<ScreenType[]>(['dashboard']);
  const currentScreen = history[history.length - 1];

  const navigate = (screen: ScreenType) => {
    if (screen !== currentScreen) {
      setHistory(prev => [...prev, screen]);
    }
  };

  const goBack = () => {
    setHistory(prev => {
      if (prev.length > 1) {
        return prev.slice(0, -1);
      }
      BackHandler.exitApp();
      return prev;
    });
  };

  React.useEffect(() => {
    const backAction = () => {
      if (history.length > 1) {
        goBack();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [history]);

  return (
    <NavigationContext.Provider value={{ currentScreen, navigate, goBack }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useAppNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useAppNavigation must be used within a NavigationProvider');
  }
  return context;
}
