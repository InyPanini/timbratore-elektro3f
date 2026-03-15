import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../src/context/AuthContext';
import Logo from '../src/components/Logo';
import { Ionicons } from '@expo/vector-icons';
import { isRTL } from '../src/i18n';

export default function Register() {
  const { t, i18n } = useTranslation();
  const { register } = useAuth();
  const router = useRouter();
  const rtl = isRTL(i18n.language);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert(t('error'), 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert(t('error'), 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      await register(email.toLowerCase().trim(), password, name.trim());
      router.replace('/dashboard');
    } catch (error: any) {
      Alert.alert(
        t('error'),
        error.response?.data?.detail || 'Registration failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={[styles.backButton, rtl && styles.backButtonRTL]}
          onPress={() => router.back()}
        >
          <Ionicons
            name={rtl ? 'arrow-forward' : 'arrow-back'}
            size={24}
            color="#4CAF50"
          />
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <Logo size="medium" />
        </View>

        <View style={styles.formContainer}>
          <Text style={[styles.title, rtl && styles.rtlText]}>{t('register')}</Text>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, rtl && styles.rtlText]}>{t('name')}</Text>
            <TextInput
              style={[styles.input, rtl && styles.rtlInput]}
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
              placeholderTextColor="#666"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, rtl && styles.rtlText]}>{t('email')}</Text>
            <TextInput
              style={[styles.input, rtl && styles.rtlInput]}
              value={email}
              onChangeText={setEmail}
              placeholder="email@example.com"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, rtl && styles.rtlText]}>{t('password')}</Text>
            <TextInput
              style={[styles.input, rtl && styles.rtlInput]}
              value={password}
              onChangeText={setPassword}
              placeholder="Minimum 6 characters"
              placeholderTextColor="#666"
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.registerButtonText}>{t('register')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/login')}
            style={styles.loginLink}
          >
            <Text style={[styles.loginText, rtl && styles.rtlText]}>
              {t('haveAccount')} <Text style={styles.loginTextBold}>{t('login')}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 16,
    padding: 8,
    zIndex: 10,
  },
  backButtonRTL: {
    left: undefined,
    right: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
  },
  rtlText: {
    textAlign: 'right',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  rtlInput: {
    textAlign: 'right',
  },
  registerButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
  },
  loginText: {
    color: '#888',
    fontSize: 14,
  },
  loginTextBold: {
    color: '#4CAF50',
    fontWeight: '600',
  },
});
