import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '../src/context/AuthContext';
import Logo from '../src/components/Logo';
import HamburgerMenu from '../src/components/HamburgerMenu';
import { recordShiftAction, getCurrentShiftStatus } from '../src/services/api';
import { isRTL } from '../src/i18n';
import { format } from 'date-fns';

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const rtl = isRTL(i18n.language);

  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [status, setStatus] = useState<{
    in_shift: boolean;
    on_break: boolean;
    shift_started_at: string | null;
    current_break_started_at: string | null;
  }>({
    in_shift: false,
    on_break: false,
    shift_started_at: null,
    current_break_started_at: null,
  });
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [shiftNotes, setShiftNotes] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadStatus();
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const data = await getCurrentShiftStatus();
      setStatus(data);
    } catch (error) {
      console.error('Error loading status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getLocation = async (): Promise<{ latitude: number; longitude: number; address?: string } | null> => {
    try {
      const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
      if (permStatus !== 'granted') {
        Alert.alert(t('error'), t('locationError'));
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      let address;
      try {
        const [geocode] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        if (geocode) {
          address = `${geocode.street || ''}, ${geocode.city || ''}, ${geocode.region || ''}`;
        }
      } catch (e) {
        console.log('Geocoding error:', e);
      }

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address,
      };
    } catch (error) {
      console.error('Location error:', error);
      return null;
    }
  };

  const handleAction = async (actionType: 'start' | 'end' | 'pause_start' | 'pause_end', notes?: string) => {
    setActionLoading(true);
    try {
      const location = await getLocation();
      
      await recordShiftAction({
        action_type: actionType,
        latitude: location?.latitude,
        longitude: location?.longitude,
        address: location?.address,
        notes,
      });

      Alert.alert(t('success'), t('locationCaptured'));
      await loadStatus();
    } catch (error: any) {
      Alert.alert(t('error'), error.response?.data?.detail || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartShift = () => handleAction('start');
  
  const handleEndShift = () => {
    setShowNotesModal(true);
  };

  const confirmEndShift = () => {
    if (!shiftNotes.trim()) {
      Alert.alert(t('error'), t('shiftNotesRequired'));
      return;
    }
    setShowNotesModal(false);
    handleAction('end', shiftNotes);
    setShiftNotes('');
  };

  const handleBreak = () => {
    if (status.on_break) {
      handleAction('pause_end');
    } else {
      handleAction('pause_start');
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '--:--';
    return format(new Date(dateString), 'HH:mm');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <HamburgerMenu currentRoute="/dashboard" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Logo size="medium" />
        </View>

        <View style={styles.timeContainer}>
          <Text style={styles.currentTime}>
            {format(currentTime, 'HH:mm:ss')}
          </Text>
          <Text style={styles.currentDate}>
            {format(currentTime, 'EEEE, d MMMM yyyy')}
          </Text>
        </View>

        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge,
            status.in_shift 
              ? (status.on_break ? styles.statusBreak : styles.statusActive)
              : styles.statusInactive
          ]}>
            <Ionicons
              name={status.in_shift ? (status.on_break ? 'pause-circle' : 'checkmark-circle') : 'close-circle'}
              size={24}
              color="#fff"
            />
            <Text style={styles.statusText}>
              {status.in_shift 
                ? (status.on_break ? t('onBreak') : t('inShift'))
                : t('notInShift')
              }
            </Text>
          </View>

          {status.shift_started_at && (
            <Text style={[styles.statusInfo, rtl && styles.rtlText]}>
              {t('shiftStartedAt')}: {formatTime(status.shift_started_at)}
            </Text>
          )}
          {status.current_break_started_at && (
            <Text style={[styles.statusInfo, rtl && styles.rtlText]}>
              {t('breakStartedAt')}: {formatTime(status.current_break_started_at)}
            </Text>
          )}
        </View>

        <View style={styles.actionsContainer}>
          {!status.in_shift ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.startButton]}
              onPress={handleStartShift}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="#fff" size="large" />
              ) : (
                <>
                  <Ionicons name="play-circle" size={48} color="#fff" />
                  <Text style={styles.actionButtonText}>{t('startShift')}</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.endButton]}
                onPress={handleEndShift}
                disabled={actionLoading || status.on_break}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" size="large" />
                ) : (
                  <>
                    <Ionicons name="stop-circle" size={48} color="#fff" />
                    <Text style={styles.actionButtonText}>{t('endShift')}</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  status.on_break ? styles.resumeButton : styles.breakButton
                ]}
                onPress={handleBreak}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" size="large" />
                ) : (
                  <>
                    <Ionicons
                      name={status.on_break ? 'play' : 'pause'}
                      size={48}
                      color="#fff"
                    />
                    <Text style={styles.actionButtonText}>
                      {status.on_break ? t('endBreak') : t('startBreak')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.welcomeContainer}>
          <Text style={[styles.welcomeText, rtl && styles.rtlText]}>
            {t('dashboard')}
          </Text>
          <Text style={[styles.userName, rtl && styles.rtlText]}>
            {user?.name}
          </Text>
        </View>
      </ScrollView>

      {/* Shift Notes Modal */}
      <Modal
        visible={showNotesModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNotesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, rtl && styles.rtlText]}>
              {t('shiftNotes')}
            </Text>
            <TextInput
              style={[styles.notesInput, rtl && styles.rtlInput]}
              value={shiftNotes}
              onChangeText={setShiftNotes}
              placeholder={t('shiftNotesPlaceholder')}
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowNotesModal(false);
                  setShiftNotes('');
                }}
              >
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmEndShift}
              >
                <Text style={styles.confirmButtonText}>{t('confirm')}</Text>
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
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  currentTime: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  currentDate: {
    fontSize: 16,
    color: '#888',
    marginTop: 4,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 8,
  },
  statusActive: {
    backgroundColor: '#4CAF50',
  },
  statusInactive: {
    backgroundColor: '#666',
  },
  statusBreak: {
    backgroundColor: '#FF9800',
  },
  statusText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusInfo: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
  rtlText: {
    textAlign: 'right',
  },
  actionsContainer: {
    flexDirection: 'column',
    gap: 16,
    marginBottom: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 16,
    minHeight: 100,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  endButton: {
    backgroundColor: '#f44336',
  },
  breakButton: {
    backgroundColor: '#FF9800',
  },
  resumeButton: {
    backgroundColor: '#2196F3',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  welcomeText: {
    color: '#888',
    fontSize: 14,
  },
  userName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  notesInput: {
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
    minHeight: 120,
  },
  rtlInput: {
    textAlign: 'right',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
