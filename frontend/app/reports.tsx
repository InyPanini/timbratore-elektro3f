import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import SignatureCanvas from 'react-native-signature-canvas';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Logo from '../src/components/Logo';
import HamburgerMenu from '../src/components/HamburgerMenu';
import { getMonthlyReport, signMonthlyReport } from '../src/services/api';
import { isRTL } from '../src/i18n';

const months = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];

const API_URL = 'https://timbratore-elektro3f-backend.onrender.com';

export default function Reports() {
  const { t, i18n } = useTranslation();
  const rtl = isRTL(i18n.language);
  const signatureRef = useRef<any>(null);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signing, setSigning] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const data = await getMonthlyReport(selectedYear, selectedMonth);
      setReport(data);
    } catch (error: any) {
      Alert.alert(t('error'), error.response?.data?.detail || 'Failed to load report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSign = async (signature: string) => {
    if (!signature || signature === 'data:image/png;base64,' || signature.length < 100) {
      Alert.alert(t('error'), 'Please provide a signature');
      return;
    }

    setSigning(true);
    try {
      await signMonthlyReport(selectedYear, selectedMonth, signature);
      setShowSignatureModal(false);
      await loadReport();
      Alert.alert(t('success'), 'Report signed successfully');
    } catch (error: any) {
      Alert.alert(t('error'), error.response?.data?.detail || 'Failed to sign report');
    } finally {
      setSigning(false);
    }
  };

  const handleSignatureEnd = () => {
    if (signatureRef.current) {
      signatureRef.current.readSignature();
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const generatePDF = async () => {
    if (!report) {
      Alert.alert(t('error'), 'Load the report first');
      return;
    }

    setDownloadingPdf(true);

    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        Alert.alert(t('error'), 'Authentication token not found');
        return;
      }

      const url = `${API_URL}/api/reports/monthly/${selectedYear}/${selectedMonth}/pdf`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const reader = new FileReader();

      const base64: string = await new Promise((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          const commaIndex = result.indexOf(',');
          if (commaIndex === -1) {
            reject(new Error('Failed to convert PDF to base64'));
            return;
          }
          resolve(result.slice(commaIndex + 1));
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const safeMonth = String(selectedMonth).padStart(2, '0');
      const fileName = `report_mensile_${selectedYear}_${safeMonth}.pdf`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert(t('error'), 'Sharing is not available on this device');
        return;
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Apri o salva il report PDF',
        UTI: 'com.adobe.pdf',
      });
    } catch (error: any) {
      console.error('PDF download error:', error);
      Alert.alert(t('error'), 'Errore durante la generazione del PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <SafeAreaView style={styles.container}>
      <HamburgerMenu currentRoute="/reports" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Logo size="small" />
          <Text style={[styles.title, rtl && styles.rtlText]}>
            {t('monthlyReport')}
          </Text>
        </View>

        <View style={styles.selectorContainer}>
          <Text style={[styles.selectorLabel, rtl && styles.rtlText]}>
            {t('selectMonth')}
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearSelector}>
            {years.map((year) => (
              <TouchableOpacity
                key={year}
                style={[
                  styles.yearButton,
                  selectedYear === year && styles.yearButtonActive
                ]}
                onPress={() => setSelectedYear(year)}
              >
                <Text
                  style={[
                    styles.yearButtonText,
                    selectedYear === year && styles.yearButtonTextActive
                  ]}
                >
                  {year}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.monthsGrid}>
            {months.map((month, index) => (
              <TouchableOpacity
                key={month}
                style={[
                  styles.monthButton,
                  selectedMonth === index + 1 && styles.monthButtonActive
                ]}
                onPress={() => setSelectedMonth(index + 1)}
              >
                <Text
                  style={[
                    styles.monthButtonText,
                    selectedMonth === index + 1 && styles.monthButtonTextActive
                  ]}
                >
                  {t(month).substring(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.loadButton, isLoading && styles.buttonDisabled]}
            onPress={loadReport}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.loadButtonText}>Carica Report</Text>
            )}
          </TouchableOpacity>
        </View>

        {report && (
          <View style={styles.reportContainer}>
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>
                {t(months[report.month - 1])} {report.year}
              </Text>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{report.total_hours.toFixed(1)}</Text>
                <Text style={styles.statLabel}>{t('totalHours')}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{report.days_worked}</Text>
                <Text style={styles.statLabel}>{t('daysWorked')}</Text>
              </View>
            </View>

            <View style={styles.dailyList}>
              {report.daily_summaries.map((day: any, index: number) => (
                <View key={index} style={styles.dailyItem}>
                  <View style={[styles.dailyRow, rtl && styles.dailyRowRTL]}>
                    <Text style={styles.dailyDate}>{day.date}</Text>
                    <Text style={styles.dailyHours}>
                      {day.work_hours?.toFixed(1) || '0'} h
                    </Text>
                  </View>
                  <View style={[styles.dailyRow, rtl && styles.dailyRowRTL]}>
                    <Text style={styles.dailyTime}>
                      {day.start_time || '-'} - {day.end_time || '-'}
                    </Text>
                    {day.notes && (
                      <Text style={styles.dailyNotes} numberOfLines={1}>
                        {day.notes}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.signaturesSection}>
              <Text style={styles.sectionTitle}>Firme</Text>

              <View style={styles.signatureStatus}>
                <View style={[styles.signatureRow, rtl && styles.signatureRowRTL]}>
                  <Text style={styles.signatureLabel}>{t('employeeSignature')}:</Text>
                  {report.employee_signature ? (
                    <View style={styles.signedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                      <Text style={styles.signedText}>{t('signed')}</Text>
                    </View>
                  ) : (
                    <View style={styles.unsignedBadge}>
                      <Ionicons name="close-circle" size={16} color="#f44336" />
                      <Text style={styles.unsignedText}>{t('notSigned')}</Text>
                    </View>
                  )}
                </View>

                <View style={[styles.signatureRow, rtl && styles.signatureRowRTL]}>
                  <Text style={styles.signatureLabel}>{t('adminSignature')}:</Text>
                  {report.admin_signature ? (
                    <View style={styles.signedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                      <Text style={styles.signedText}>{t('signed')}</Text>
                    </View>
                  ) : (
                    <View style={styles.unsignedBadge}>
                      <Ionicons name="time" size={16} color="#FF9800" />
                      <Text style={styles.pendingText}>In attesa</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.actionsContainer}>
              {!report.employee_signature && (
                <TouchableOpacity
                  style={styles.signButton}
                  onPress={() => setShowSignatureModal(true)}
                >
                  <Ionicons name="create" size={20} color="#000" />
                  <Text style={styles.signButtonText}>{t('signReport')}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.downloadButton, downloadingPdf && styles.buttonDisabled]}
                onPress={generatePDF}
                disabled={downloadingPdf}
              >
                {downloadingPdf ? (
                  <ActivityIndicator color="#4CAF50" />
                ) : (
                  <>
                    <Ionicons name="download" size={20} color="#4CAF50" />
                    <Text style={styles.downloadButtonText}>{t('downloadPDF')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showSignatureModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSignatureModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('employeeSignature')}</Text>
              <TouchableOpacity onPress={() => setShowSignatureModal(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.signatureContainer}>
              <SignatureCanvas
                ref={signatureRef}
                onOK={handleSign}
                onEnd={handleSignatureEnd}
                onEmpty={() => Alert.alert(t('error'), 'Please sign first')}
                autoClear={false}
                descriptionText=""
                clearText={t('clearSignature')}
                confirmText={t('saveSignature')}
                webStyle={`
                  .m-signature-pad {
                    box-shadow: none;
                    border: none;
                    background-color: #fff;
                    width: 100%;
                    height: 100%;
                  }
                  .m-signature-pad--body {
                    border: none;
                  }
                  .m-signature-pad--footer {
                    display: flex;
                    flex-direction: row;
                    justify-content: space-between;
                    margin: 0;
                    padding: 10px;
                    background: #1a1a1a;
                  }
                  .m-signature-pad--footer .button {
                    background-color: #4CAF50;
                    color: #000;
                    padding: 15px 30px;
                    border-radius: 8px;
                    font-weight: bold;
                  }
                  .m-signature-pad--footer .button.clear {
                    background-color: #333;
                    color: #fff;
                  }
                `}
                backgroundColor="#fff"
                penColor="#000"
                dataURL=""
              />
            </View>

            {signing && (
              <View style={styles.signingOverlay}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.signingText}>Saving signature...</Text>
              </View>
            )}
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
  selectorContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  selectorLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 12,
  },
  yearSelector: {
    marginBottom: 16,
  },
  yearButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
  },
  yearButtonActive: {
    backgroundColor: '#4CAF50',
  },
  yearButtonText: {
    color: '#888',
    fontSize: 16,
  },
  yearButtonTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  monthButton: {
    width: '23%',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
  },
  monthButtonActive: {
    backgroundColor: '#4CAF50',
  },
  monthButtonText: {
    color: '#888',
    fontSize: 14,
  },
  monthButtonTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  loadButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loadButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  reportContainer: {
    padding: 16,
  },
  reportHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  reportTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    color: '#4CAF50',
    fontSize: 32,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  dailyList: {
    marginBottom: 20,
  },
  dailyItem: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  dailyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dailyRowRTL: {
    flexDirection: 'row-reverse',
  },
  dailyDate: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  dailyHours: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dailyTime: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  dailyNotes: {
    color: '#666',
    fontSize: 12,
    maxWidth: '50%',
  },
  signaturesSection: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  signatureStatus: {
    gap: 12,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  signatureRowRTL: {
    flexDirection: 'row-reverse',
  },
  signatureLabel: {
    color: '#888',
    fontSize: 14,
  },
  signedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  signedText: {
    color: '#4CAF50',
    fontSize: 14,
  },
  unsignedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unsignedText: {
    color: '#f44336',
    fontSize: 14,
  },
  pendingText: {
    color: '#FF9800',
    fontSize: 14,
  },
  actionsContainer: {
    gap: 12,
  },
  signButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  signButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
    gap: 8,
  },
  downloadButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  signatureContainer: {
    height: 350,
    backgroundColor: '#fff',
  },
  signingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signingText: {
    color: '#fff',
    marginTop: 12,
  },
});