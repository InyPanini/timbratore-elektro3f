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

export default function ForgotPassword() {
  const { t, i18n } = useTranslation();
  const { forgotPassword, resetPassword } = useAuth();
  const router = useRouter();
  const rtl = isRTL(i18n.language);

  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [receivedCode, setReceivedCode] = useState('');

  const handleSendCode = async () => {
    if (!email) {
      Alert.alert(t('error'), 'Please enter your email');
      return;
    }

    setIsLoading(true);
    try {
      const response = await forgotPassword(email.toLowerCase().trim());
      if (response.reset_code) {
        setReceivedCode(response.reset_code);
        Alert.alert(
          'Demo Mode',
          `Reset code (MOCKED): ${response.reset_code}\n\nIn production, this would be sent via email.`,
          [{ text: 'OK', onPress: () => setStep('reset') }]
        );
      } else {
        setStep('reset');
      }
    } catch (error: any) {
      Alert.alert(
        t('error'),
        error.response?.data?.detail || 'Failed to send reset code'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetCode || !newPassword) {
      Alert.alert(t('error'), 'Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(t('error'), 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(email, resetCode, newPassword);
      Alert.alert(t('success'), 'Password reset successfully', [
        { text: 'OK', onPress: () => router.replace('/login') },
      ]);
    } catch (error: any) {
      Alert.alert(
        t('error'),
        error.response?.data?.detail || 'Failed to reset password'
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
          <Text style={[styles.title, rtl && styles.rtlText]}>
            {t('resetPassword')}
          </Text>

          {step === 'email' ? (
            <>
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

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSendCode}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.buttonText}>{t('sendResetCode')}</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              {receivedCode && (
                <View style={styles.codeHint}>
                  <Text style={styles.codeHintText}>
                    Demo code: {receivedCode}
                  </Text>
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={[styles.label, rtl && styles.rtlText]}>
                  {t('resetCode')}
                </Text>
                <TextInput
                  style={[styles.input, rtl && styles.rtlInput]}
                  value={resetCode}
                  onChangeText={setResetCode}
                  placeholder="Enter code"
                  placeholderTextColor="#666"
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, rtl && styles.rtlText]}>
                  {t('newPassword')}
                </Text>
                <TextInput
                  style={[styles.input, rtl && styles.rtlInput]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor="#666"
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.buttonText}>{t('confirmReset')}</Text>
                )}
              </TouchableOpacity>
            </>
          )}
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
  codeHint: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  codeHintText: {
    color: '#4CAF50',
    fontSize: 14,
    textAlign: 'center',
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
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
  },
});
