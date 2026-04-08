import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signInWithCredential,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '@nestly/shared';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [_request, response, promptAsync] = Google.useAuthRequest({
    // TODO: Add OAuth client IDs from Google Cloud Console
    // androidClientId: 'YOUR_ANDROID_CLIENT_ID',
    // iosClientId: 'YOUR_IOS_CLIENT_ID',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential).catch((err) => {
        setError(err.message || 'Google sign-in failed');
      });
    }
  }, [response]);

  const handleEmailAuth = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymous = async () => {
    setLoading(true);
    setError('');
    try {
      await signInAnonymously(auth);
    } catch (err: any) {
      setError(err.message || 'Anonymous sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    promptAsync();
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-rose-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-8">
          <Text className="text-4xl font-bold text-rose-700 text-center mb-2">Nestly</Text>
          <Text className="text-text-secondary text-center mb-10">
            Your pregnancy and baby companion
          </Text>

          {error ? (
            <View className="bg-red-100 rounded-xl p-3 mb-4">
              <Text className="text-red-700 text-center text-sm">{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            className="bg-white rounded-xl py-4 px-6 mb-4 border border-gray-200 flex-row items-center justify-center"
            onPress={handleGoogle}
          >
            <Text className="text-base font-semibold text-text-primary">Continue with Google</Text>
          </TouchableOpacity>

          <View className="flex-row items-center my-4">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="px-4 text-text-muted text-sm">or</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          <TextInput
            className="bg-white rounded-xl py-4 px-4 mb-3 border border-gray-200 text-base"
            placeholder="Email"
            placeholderTextColor="#94a3b8"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            className="bg-white rounded-xl py-4 px-4 mb-4 border border-gray-200 text-base"
            placeholder="Password"
            placeholderTextColor="#94a3b8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            className="bg-rose-400 rounded-xl py-4 items-center mb-3"
            onPress={handleEmailAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="py-2 items-center mb-6"
            onPress={() => { setIsSignUp(!isSignUp); setError(''); }}
          >
            <Text className="text-rose-400 text-sm">
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="py-3 items-center"
            onPress={handleAnonymous}
            disabled={loading}
          >
            <Text className="text-text-muted text-sm">Continue as Guest</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
