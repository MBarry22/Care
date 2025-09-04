import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { authService, LoginCredentials } from '@/services/authService';
import { useStore } from '@/store/useStore';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const { setCurrentUser } = useStore();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!credentials.email || !credentials.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      const storeUser = authService.convertToStoreUser(response.user);
      setCurrentUser(storeUser);
      
      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Login Failed', error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!credentials.email) {
      Alert.alert('Email Required', 'Please enter your email address first');
      return;
    }

    Alert.prompt(
      'Reset Password',
      `Send password reset link to ${credentials.email}?`,
      async (text) => {
        if (text === 'Send') {
          try {
            await authService.forgotPassword(credentials.email);
            Alert.alert('Success', 'Password reset link sent to your email');
          } catch (error) {
            Alert.alert('Error', 'Failed to send password reset email');
          }
        }
      },
      'plain-text',
      'Send'
    );
  };

  const handleDemoLogin = (role: 'senior' | 'family' | 'caregiver') => {
    const demoCredentials = {
      senior: { email: 'margaret@example.com', password: 'password123' },
      family: { email: 'sarah@example.com', password: 'password123' },
      caregiver: { email: 'maria@example.com', password: 'password123' },
    };

    setCredentials(demoCredentials[role]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.header}>
          <IconSymbol name="heart.fill" size={48} color={Colors[colorScheme ?? 'light'].tint} />
          <ThemedText type="title" style={styles.title}>SeniorCare Connect</ThemedText>
          <ThemedText style={styles.subtitle}>Sign in to your account</ThemedText>
        </ThemedView>

        <ThemedView style={styles.form}>
          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.label}>Email Address</ThemedText>
            <TextInput
              style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
              placeholder="Enter your email"
              placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
              value={credentials.email}
              onChangeText={(text) => setCredentials({ ...credentials, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </ThemedView>

          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.label}>Password</ThemedText>
            <ThemedView style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput, { color: Colors[colorScheme ?? 'light'].text }]}
                placeholder="Enter your password"
                placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                value={credentials.password}
                onChangeText={(text) => setCredentials({ ...credentials, password: text })}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <IconSymbol 
                  name={showPassword ? 'eye.slash' : 'eye'} 
                  size={20} 
                  color={Colors[colorScheme ?? 'light'].tabIconDefault} 
                />
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>

          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotButton}>
            <ThemedText style={styles.forgotText}>Forgot Password?</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogin}
            style={[
              styles.loginButton,
              { backgroundColor: Colors[colorScheme ?? 'light'].tint },
              isLoading && styles.disabledButton
            ]}
            disabled={isLoading}
          >
            <ThemedText style={styles.loginButtonText}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </ThemedText>
          </TouchableOpacity>

          <ThemedView style={styles.divider}>
            <ThemedView style={styles.dividerLine} />
            <ThemedText style={styles.dividerText}>or</ThemedText>
            <ThemedView style={styles.dividerLine} />
          </ThemedView>

          <ThemedView style={styles.demoSection}>
            <ThemedText style={styles.demoTitle}>Try Demo Accounts</ThemedText>
            <ThemedView style={styles.demoButtons}>
              <TouchableOpacity
                onPress={() => handleDemoLogin('senior')}
                style={[styles.demoButton, { borderColor: Colors[colorScheme ?? 'light'].tint }]}
              >
                <ThemedText style={styles.demoEmoji}>👵</ThemedText>
                <ThemedText style={styles.demoText}>Senior</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDemoLogin('family')}
                style={[styles.demoButton, { borderColor: Colors[colorScheme ?? 'light'].tint }]}
              >
                <ThemedText style={styles.demoEmoji}>👩</ThemedText>
                <ThemedText style={styles.demoText}>Family</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDemoLogin('caregiver')}
                style={[styles.demoButton, { borderColor: Colors[colorScheme ?? 'light'].tint }]}
              >
                <ThemedText style={styles.demoEmoji}>👩‍🦱</ThemedText>
                <ThemedText style={styles.demoText}>Caregiver</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.footer}>
          <ThemedText style={styles.footerText}>Don't have an account?</ThemedText>
          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <ThemedText style={[styles.signUpText, { color: Colors[colorScheme ?? 'light'].tint }]}>
              Sign Up
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 14,
    color: '#007AFF',
  },
  loginButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    opacity: 0.7,
  },
  demoSection: {
    marginBottom: 24,
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  demoButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  demoButton: {
    flex: 1,
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  demoEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  demoText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    marginRight: 8,
  },
  signUpText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
