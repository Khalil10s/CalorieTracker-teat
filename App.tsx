import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

function RootNavigator() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const { colors: COLORS, mode } = useTheme();
  const [showRegister, setShowRegister] = useState(false);

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: COLORS.background }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!user) {
    return showRegister ? (
      <RegisterScreen onNavigateLogin={() => setShowRegister(false)} />
    ) : (
      <LoginScreen onNavigateRegister={() => setShowRegister(true)} />
    );
  }

  if (profile && !profile.hasCompletedOnboarding) {
    return <OnboardingScreen onComplete={() => refreshProfile()} />;
  }

  return <AppNavigator />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StatusBarWrapper />
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}

function StatusBarWrapper() {
  const { mode } = useTheme();
  return <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
