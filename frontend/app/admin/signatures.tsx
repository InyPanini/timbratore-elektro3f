import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import SignatureCanvas from 'react-native-signature-canvas';
import Logo from '../../src/components/Logo';
import HamburgerMenu from '../../src/components/HamburgerMenu';
import { getUnsignedReports, counterSignReport } from '../../src/services/api';
import { isRTL } from '../../src/i18n';
import { Alert } from 'react-native';

const months = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];

export default function AdminSignatures() {
  const { t, i18n } = useTranslation();
  const rtl = isRTL(i18n.language);
  const signatureRef = useRef<any>(null);

  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const data = await getUnsignedReports();
      setReports(data);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const handleCounterSign = async (signature: string) => {
    console.log('handleCounterSign called, signature length:', signature?.length);
    
    if (!signature || signature === 'data:image/png;base64,' || signature.length < 100) {
      Alert.alert(t('error'), 'Please provide a signature');
      return;
    }
    
    if (!selectedReport) {
      Alert.alert(t('error'), 'No report selected');
      return;
    }

    setSigning(true);
    try {
      console.log('Calling counterSignReport for:', selectedReport.id);
      await counterSignReport(selectedReport.id, signature);
      console.log('Counter-sign successful');
      setSelectedReport(null);
      await loadReports();
      Alert.alert(t('success'), 'Report counter-signed successfully');
    } catch (error: any) {
      console.error('Counter-sign error:', error);
      Alert.alert(t('error'), error.response?.data?.detail || 'Failed to sign');
    } finally {
      setSigning(false);
    }
  };

  const handleSignatureEmpty = () => {
    Alert.alert(t('error'), 'Please sign first');
  };

  const renderReport = ({ item }: { item: any }) => (
    <View style={styles.reportCard}>
      <View style={[styles.reportHeader, rtl && styles.reportHeaderRTL]}>
        <View>
          <Text style={styles.reportEmployee}>{item.user_name}</Text>
          <Text style={styles.reportEmail}>{item.user_email}</Text>
        </View>
        <View style={styles.reportPeriod}>
          <Text style={styles.reportMonth}>
            {t(months[item.month - 1])} {item.year}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.total_hours.toFixed(1)}h</Text>
          <Text style={styles.statLabel}>{t('totalHours')}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.days_worked}</Text>
          <Text style={styles.statLabel}>{t('daysWorked')}</Text>
        </View>
      </View>

      <View style={styles.signatureInfo}>
        <View style={styles.signatureRow}>
          <Text style={styles.signatureLabel}>{t('employeeSignature')}:</Text>
          <View style={styles.signedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.signedText}>
              {format(new Date(item.employee_signed_at), 'dd/MM/yyyy HH:mm')}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.counterSignButton}
        onPress={() => setSelectedReport(item)}
      >
        <Ionicons name="create" size={20} color="#000" />
        <Text style={styles.counterSignText}>{t('counterSign')}</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <HamburgerMenu currentRoute="/admin/signatures" />
      
      <View style={styles.header}>
        <Logo size="small" />
        <Text style={[styles.title, rtl && styles.rtlText]}>
          {t('pendingSignatures')}
        </Text>
        <Text style={styles.subtitle}>{reports.length} reports pending</Text>
      </View>

      {reports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-done-circle-outline" size={64} color="#4CAF50" />
          <Text style={styles.emptyText}>All reports have been signed!</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={renderReport}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#4CAF50"
            />
          }
        />
      )}

      {/* Signature Modal */}
      <Modal
        visible={!!selectedReport}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedReport(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{t('adminSignature')}</Text>
                {selectedReport && (
                  <Text style={styles.modalSubtitle}>
                    {selectedReport.user_name} - {t(months[selectedReport.month - 1])} {selectedReport.year}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setSelectedReport(null)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.signatureContainer}>
              <SignatureCanvas
                ref={signatureRef}
                onOK={handleCounterSign}
                onEmpty={handleSignatureEmpty}
                autoClear={false}
                descriptionText=""
                clearText=""
                confirmText=""
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
                    display: none;
                  }
                `}
                backgroundColor="#fff"
                penColor="#000"
              />
            </View>

            <View style={styles.signatureButtons}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => signatureRef.current?.clearSignature()}
              >
                <Text style={styles.clearButtonText}>{t('clearSignature')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => signatureRef.current?.readSignature()}
                disabled={signing}
              >
                {signing ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.saveButtonText}>{t('saveSignature')}</Text>
                )}
              </TouchableOpacity>
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
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
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
  subtitle: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  reportCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  reportHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  reportEmployee: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  reportEmail: {
    color: '#888',
    fontSize: 14,
    marginTop: 2,
  },
  reportPeriod: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  reportMonth: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    color: '#4CAF50',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  signatureInfo: {
    marginBottom: 16,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  counterSignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  counterSignText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    marginTop: 16,
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
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  modalSubtitle: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
  signatureContainer: {
    height: 300,
    backgroundColor: '#fff',
  },
  signatureButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
    backgroundColor: '#1a1a1a',
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
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
