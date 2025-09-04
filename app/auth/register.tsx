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
import { authService, RegisterData } from '@/services/authService';
import { useStore } from '@/store/useStore';

export default function RegisterScreen() {
  const colorScheme = useColorScheme();
  const { setCurrentUser } = useStore();
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    name: '',
    role: 'senior',
    phone: '',
    dateOfBirth: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleRegister = async () => {
    // Validation
    if (!formData.email || !formData.password || !formData.name) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (!acceptTerms) {
      Alert.alert('Error', 'Please accept the terms and conditions');
      return;
    }

    setIsLoading(true);
    try {
      // First test the connection
      const isConnected = await authService.testConnection();
      if (!isConnected) {
        Alert.alert(
          'Connection Error',
          'Cannot connect to the server. Please check:\n\n1. Backend server is running (npm run dev)\n2. Network connection\n3. Server URL configuration',
          [
            { text: 'OK' },
            { text: 'Retry', onPress: handleRegister }
          ]
        );
        return;
      }

      const response = await authService.register(formData);
      const storeUser = authService.convertToStoreUser(response.user);
      setCurrentUser(storeUser);
      
      Alert.alert(
        'Registration Successful',
        'Welcome to SeniorCare Connect! Please check your email to verify your account.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'An error occurred';
      if (error instanceof Error) {
        if (error.message.includes('Network error') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check:\n\n1. Backend server is running\n2. Internet connection\n3. Server configuration';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelect = (role: 'senior' | 'family' | 'caregiver') => {
    setFormData({ ...formData, role });
  };

  const getRoleDescription = (role: 'senior' | 'family' | 'caregiver') => {
    switch (role) {
      case 'senior':
        return 'I am a senior looking for care coordination';
      case 'family':
        return 'I am a family member managing care for a senior';
      case 'caregiver':
        return 'I am a professional caregiver';
      default:
        return '';
    }
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
          <ThemedText type="title" style={styles.title}>Join SeniorCare Connect</ThemedText>
          <ThemedText style={styles.subtitle}>Create your account to get started</ThemedText>
        </ThemedView>

        <ThemedView style={styles.form}>
          {/* Role Selection */}
          <ThemedView style={styles.section}>
            <ThemedText style={styles.sectionTitle}>I am a...</ThemedText>
            <ThemedView style={styles.roleButtons}>
              {(['senior', 'family', 'caregiver'] as const).map((role) => (
                <TouchableOpacity
                  key={role}
                  onPress={() => handleRoleSelect(role)}
                  style={[
                    styles.roleButton,
                    formData.role === role && { backgroundColor: Colors[colorScheme ?? 'light'].tint + '20' },
                    { borderColor: formData.role === role ? Colors[colorScheme ?? 'light'].tint : '#ddd' }
                  ]}
                >
                  <ThemedText style={styles.roleEmoji}>
                    {role === 'senior' ? '👵' : role === 'family' ? '👩' : '👩‍🦱'}
                  </ThemedText>
                  <ThemedText style={[
                    styles.roleText,
                    formData.role === role && { color: Colors[colorScheme ?? 'light'].tint }
                  ]}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ThemedView>
            <ThemedText style={styles.roleDescription}>
              {getRoleDescription(formData.role)}
            </ThemedText>
          </ThemedView>

          {/* Personal Information */}
          <ThemedView style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Personal Information</ThemedText>
            
            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.label}>Full Name *</ThemedText>
              <TextInput
                style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
                placeholder="Enter your full name"
                placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                autoCapitalize="words"
              />
            </ThemedView>

            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.label}>Email Address *</ThemedText>
              <TextInput
                style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
                placeholder="Enter your email"
                placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </ThemedView>

            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.label}>Phone Number</ThemedText>
              <TextInput
                style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
                placeholder="(604) 555-0123"
                placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
              />
            </ThemedView>

            {formData.role === 'senior' && (
              <ThemedView style={styles.inputContainer}>
                <ThemedText style={styles.label}>Date of Birth</ThemedText>
                <TextInput
                  style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                  value={formData.dateOfBirth}
                  onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
                />
              </ThemedView>
            )}
          </ThemedView>

          {/* Security */}
          <ThemedView style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Security</ThemedText>
            
            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.label}>Password *</ThemedText>
              <ThemedView style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput, { color: Colors[colorScheme ?? 'light'].text }]}
                  placeholder="Create a password"
                  placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
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

            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.label}>Confirm Password *</ThemedText>
              <ThemedView style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput, { color: Colors[colorScheme ?? 'light'].text }]}
                  placeholder="Confirm your password"
                  placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  <IconSymbol 
                    name={showConfirmPassword ? 'eye.slash' : 'eye'} 
                    size={20} 
                    color={Colors[colorScheme ?? 'light'].tabIconDefault} 
                  />
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          </ThemedView>

          {/* Terms and Conditions */}
          <ThemedView style={styles.termsContainer}>
            <TouchableOpacity
              onPress={() => setAcceptTerms(!acceptTerms)}
              style={styles.checkboxContainer}
            >
              <ThemedView style={[
                styles.checkbox,
                acceptTerms && { backgroundColor: Colors[colorScheme ?? 'light'].tint }
              ]}>
                {acceptTerms && (
                  <IconSymbol name="checkmark" size={16} color="#fff" />
                )}
              </ThemedView>
              <ThemedText style={styles.termsText}>
                I agree to the{' '}
                <ThemedText style={[styles.linkText, { color: Colors[colorScheme ?? 'light'].tint }]}>
                  Terms of Service
                </ThemedText>
                {' '}and{' '}
                <ThemedText style={[styles.linkText, { color: Colors[colorScheme ?? 'light'].tint }]}>
                  Privacy Policy
                </ThemedText>
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>

          <TouchableOpacity
            onPress={handleRegister}
            style={[
              styles.registerButton,
              { backgroundColor: Colors[colorScheme ?? 'light'].tint },
              isLoading && styles.disabledButton
            ]}
            disabled={isLoading}
          >
            <ThemedText style={styles.registerButtonText}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.footer}>
          <ThemedText style={styles.footerText}>Already have an account?</ThemedText>
          <TouchableOpacity onPress={() => router.back()}>
            <ThemedText style={[styles.signInText, { color: Colors[colorScheme ?? 'light'].tint }]}>
              Sign In
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
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  roleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  roleButton: {
    flex: 1,
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  roleEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  roleDescription: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    fontStyle: 'italic',
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
  termsContainer: {
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  linkText: {
    textDecorationLine: 'underline',
  },
  registerButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
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
  signInText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
