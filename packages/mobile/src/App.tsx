import './global.css';
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@nestly/shared';
import { useAuthStore } from '@nestly/shared/stores';
import { AuthScreen } from './screens/AuthScreen';
import { MainTabs } from './navigation/MainTabs';

export default function App() {
  const { authEmail, loading, setAuth, clearAuth, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const identifier = user.email || `anon-${user.uid}`;
        setAuth(identifier, user.uid);
      } else {
        clearAuth();
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [setAuth, clearAuth, setLoading]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-rose-50">
        <ActivityIndicator size="large" color="#f43f5e" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      {authEmail ? <MainTabs /> : <AuthScreen />}
    </NavigationContainer>
  );
}
