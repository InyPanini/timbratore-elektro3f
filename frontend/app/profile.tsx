import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Logo from '../src/components/Logo';
import HamburgerMenu from '../src/components/HamburgerMenu';
import { useAuth } from '../src/context/AuthContext';
import { updateProfile, changePassword } from '../src/services/api';
import { setLanguage, isRTL } from '../src/i18n';

const languages = [
  { code: 'it', name: 'Italiano', flag: 'IT' },
  { code: 'en', name: 'English', flag: 'GB' },
  { code: 'fr', name: 'Français', flag: 'FR' },
  { code: 'de', name: 'Deutsch', flag: 'DE' },
  { code: 'ar', name: 'العربية', flag: 'SA' },
  { code: 'ma', name: 'الداريجة', flag: 'MA' },
];

export default function Profile() {
  const { t, i18n } = useTranslation();
  const { user, updateUser, token } = useAuth();
  const rtl = isRTL(i18n.language);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [isLoading, setIsLoading] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('error'), 'Permission to access gallery is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setIsLoading(true);
      try {
        const profilePicture = `data:image/jpeg;base64,${result.assets[0].base64}`;
        await updateProfile({ profile_picture: profilePicture });
        updateUser({ profile_picture: profilePicture });
        Alert.alert(t('success'), 'Profile picture updated');
      } catch (error: any) {
        Alert.alert(t('error'), error.response?.data?.detail || 'Failed to update picture');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSaveName = async () => {
    if (!name.trim()) {
      Alert.alert(t('error'), 'Name cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      await updateProfile({ name: name.trim() });
      updateUser({ name: name.trim() });
      setIsEditing(false);
      Alert.alert(t('success'), 'Name updated');
    } catch (error: any) {
      Alert.alert(t('error'), error.response?.data?.detail || 'Failed to update name');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageChange = async (code: string) => {
    setIsLoading(true);
    try {
      await updateProfile({ language: code });
      await setLanguage(code);
      updateUser({ language: code });
      setShowLanguageModal(false);
    } catch (error: any) {
      Alert.alert(t('error'), error.response?.data?.detail || 'Failed to change language');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(t('error'), 'Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(t('error'), 'New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t('error'), 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert(t('success'), 'Password changed successfully');
    } catch (error: any) {
      Alert.alert(t('error'), error.response?.data?.detail || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <HamburgerMenu currentRoute="/profile" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Logo size="small" />
          <Text style={[styles.title, rtl && styles.rtlText]}>{t('profile')}</Text>
        </View>

        {/* Profile Picture */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} disabled={isLoading}>
            {user?.profile_picture ? (
              <Image source={{ uri: user.profile_picture }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={60} color="#4CAF50" />
              </View>
            )}
            <View style={styles.editAvatarBadge}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.changePictureButton} onPress={pickImage}>
            <Text style={styles.changePictureText}>{t('changePicture')}</Text>
          </TouchableOpacity>
        </View>

        {/* User Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <View style={[styles.infoRow, rtl && styles.infoRowRTL]}>
              <Text style={styles.infoLabel}>{t('name')}</Text>
              {isEditing ? (
                <View style={styles.editNameContainer}>
                  <TextInput
                    style={[styles.nameInput, rtl && styles.rtlInput]}
                    value={name}
                    onChangeText={setName}
                    autoFocus
                  />
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveName}
                    disabled={isLoading}
                  >
                    <Ionicons name="checkmark" size={20} color="#4CAF50" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelEditButton}
                    onPress={() => {
                      setIsEditing(false);
                      setName(user?.name || '');
                    }}
                  >
                    <Ionicons name="close" size={20} color="#f44336" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.editableValue}
                  onPress={() => setIsEditing(true)}
                >
                  <Text style={styles.infoValue}>{user?.name}</Text>
                  <Ionicons name="pencil" size={16} color="#888" />
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.infoRow, rtl && styles.infoRowRTL]}>
              <Text style={styles.infoLabel}>{t('email')}</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>

            <View style={[styles.infoRow, rtl && styles.infoRowRTL]}>
              <Text style={styles.infoLabel}>Role</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>
                  {user?.role === 'admin' ? 'Admin' : 'Employee'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, rtl && styles.rtlText]}>Settings</Text>
          
          <TouchableOpacity
            style={[styles.settingItem, rtl && styles.settingItemRTL]}
            onPress={() => setShowLanguageModal(true)}
          >
            <View style={[styles.settingLeft, rtl && styles.settingLeftRTL]}>
              <Ionicons name="language" size={24} color="#4CAF50" />
              <Text style={[styles.settingText, rtl && styles.settingTextRTL]}>
                {t('language')}
              </Text>
            </View>
            <View style={[styles.settingRight, rtl && styles.settingRightRTL]}>
              <Text style={styles.settingValue}>
                {languages.find(l => l.code === i18n.language)?.name || 'Italiano'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#888" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, rtl && styles.settingItemRTL]}
            onPress={() => setShowPasswordModal(true)}
          >
            <View style={[styles.settingLeft, rtl && styles.settingLeftRTL]}>
              <Ionicons name="lock-closed" size={24} color="#4CAF50" />
              <Text style={[styles.settingText, rtl && styles.settingTextRTL]}>
                {t('changePassword')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </TouchableOpacity>
        </View>

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
        )}
      </ScrollView>

      {/* Language Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('language')}</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.languageList}>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageItem,
                    i18n.language === lang.code && styles.languageItemActive
                  ]}
                  onPress={() => handleLanguageChange(lang.code)}
                >
                  <Text style={styles.languageFlag}>{lang.flag}</Text>
                  <Text style={[
                    styles.languageName,
                    i18n.language === lang.code && styles.languageNameActive
                  ]}>
                    {lang.name}
                  </Text>
                  {i18n.language === lang.code && (
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Password Modal */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('changePassword')}</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.passwordForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('currentPassword')}</Text>
                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                  placeholder="********"
                  placeholderTextColor="#666"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('newPassword')}</Text>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  placeholder="********"
                  placeholderTextColor="#666"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholder="********"
                  placeholderTextColor="#666"
                />
              </View>
              <TouchableOpacity
                style={[styles.submitButton, isLoading && styles.buttonDisabled]}
                onPress={handleChangePassword}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.submitButtonText}>{t('save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
    paddingBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
  },
  rtlText: {
    textAlign: 'right',
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000',
  },
  changePictureButton: {
    marginTop: 12,
  },
  changePictureText: {
    color: '#4CAF50',
    fontSize: 14,
  },
  infoSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  infoRowRTL: {
    flexDirection: 'row-reverse',
  },
  infoLabel: {
    color: '#888',
    fontSize: 14,
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
  },
  editableValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameInput: {
    backgroundColor: '#000',
    color: '#fff',
    padding: 8,
    borderRadius: 4,
    minWidth: 150,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  rtlInput: {
    textAlign: 'right',
  },
  saveButton: {
    padding: 8,
  },
  cancelEditButton: {
    padding: 8,
  },
  roleBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
  },
  settingsSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 12,
    paddingLeft: 4,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingItemRTL: {
    flexDirection: 'row-reverse',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLeftRTL: {
    flexDirection: 'row-reverse',
  },
  settingText: {
    color: '#fff',
    fontSize: 16,
  },
  settingTextRTL: {
    marginRight: 12,
    marginLeft: 0,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingRightRTL: {
    flexDirection: 'row-reverse',
  },
  settingValue: {
    color: '#888',
    fontSize: 14,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  languageList: {
    padding: 16,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#000',
  },
  languageItemActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 16,
  },
  languageName: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  languageNameActive: {
    color: '#4CAF50',
  },
  passwordForm: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
