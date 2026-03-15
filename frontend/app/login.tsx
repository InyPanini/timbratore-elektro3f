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
import { isRTL } from '../src/i18n';

export default function Login() {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const router = useRouter();
  const rtl = isRTL(i18n.language);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('error'), 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await login(email.toLowerCase().trim(), password);
      router.replace('/dashboard');
    } catch (error: any) {
      Alert.alert(
        t('error'),
        error.response?.data?.detail || 'Login failed. Please check your credentials.'
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
        <View style={styles.logoContainer}>
          <Logo size="large" />
        </View>

        <View style={styles.formContainer}>
          <Text style={[styles.title, rtl && styles.rtlText]}>{t('login')}</Text>

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
              placeholder="********"
              placeholderTextColor="#666"
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            onPress={() => router.push('/forgot-password')}
            style={styles.forgotButton}
          >
            <Text style={[styles.forgotText, rtl && styles.rtlText]}>
              {t('forgotPassword')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.loginButtonText}>{t('login')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/register')}
            style={styles.registerLink}
          >
            <Text style={[styles.registerText, rtl && styles.rtlText]}>
              {t('noAccount')} <Text style={styles.registerTextBold}>{t('register')}</Text>
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
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
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    color: '#4CAF50',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
  },
  registerLink: {
    alignItems: 'center',
  },
  registerText: {
    color: '#888',
    fontSize: 14,
  },
  registerTextBold: {
    color: '#4CAF50',
    fontWeight: '600',
  },
});
