import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import Logo from '../src/components/Logo';
import HamburgerMenu from '../src/components/HamburgerMenu';
import { getShiftHistory, getDailySummary } from '../src/services/api';
import { isRTL } from '../src/i18n';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function History() {
  const { t, i18n } = useTranslation();
  const rtl = isRTL(i18n.language);
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState<Record<string, any[]>>({});
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [dailySummaries, setDailySummaries] = useState<Record<string, any>>({});

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await getShiftHistory(30);
      setHistory(data);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const loadDailySummary = async (date: string) => {
    if (dailySummaries[date]) return;
    try {
      const summary = await getDailySummary(date);
      setDailySummaries(prev => ({ ...prev, [date]: summary }));
    } catch (error) {
      console.error('Error loading daily summary:', error);
    }
  };

  const toggleDate = (date: string) => {
    if (expandedDate === date) {
      setExpandedDate(null);
    } else {
      setExpandedDate(date);
      loadDailySummary(date);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const generateDailyPDF = async (date: string) => {
    const summary = dailySummaries[date];
    if (!summary) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; background: #fff; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { color: #4CAF50; font-size: 28px; font-weight: bold; }
          .subtitle { color: #666; font-size: 14px; }
          .title { font-size: 24px; margin: 20px 0; }
          .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .label { color: #666; }
          .value { font-weight: bold; }
          .section { margin: 20px 0; }
          .section-title { font-size: 18px; color: #4CAF50; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">ELEKTRO 3F</div>
          <div class="subtitle">Accendi il tuo mondo con noi</div>
        </div>
        <h1 class="title">Daily Report - ${date}</h1>
        <div class="section">
          <div class="info-row">
            <span class="label">${t('name')}:</span>
            <span class="value">${summary.user_name}</span>
          </div>
          <div class="info-row">
            <span class="label">${t('date')}:</span>
            <span class="value">${date}</span>
          </div>
          <div class="info-row">
            <span class="label">${t('start')}:</span>
            <span class="value">${summary.start_time ? format(parseISO(summary.start_time), 'HH:mm') : '-'}</span>
          </div>
          <div class="info-row">
            <span class="label">${t('end')}:</span>
            <span class="value">${summary.end_time ? format(parseISO(summary.end_time), 'HH:mm') : '-'}</span>
          </div>
          <div class="info-row">
            <span class="label">${t('workTime')}:</span>
            <span class="value">${formatDuration(summary.total_work_minutes)}</span>
          </div>
          <div class="info-row">
            <span class="label">${t('breakTime')}:</span>
            <span class="value">${formatDuration(summary.total_break_minutes)}</span>
          </div>
        </div>
        ${summary.breaks.length > 0 ? `
          <div class="section">
            <div class="section-title">Breaks</div>
            ${summary.breaks.map((b: any) => `
              <div class="info-row">
                <span class="label">${format(parseISO(b.start), 'HH:mm')} - ${format(parseISO(b.end), 'HH:mm')}</span>
                <span class="value">${b.minutes} min</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
        ${summary.notes ? `
          <div class="section">
            <div class="section-title">${t('notes')}</div>
            <p>${summary.notes}</p>
          </div>
        ` : ''}
      </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error('PDF generation error:', error);
    }
  };

  const getActionTypeLabel = (type: string) => {
    switch (type) {
      case 'start': return t('startShift');
      case 'end': return t('endShift');
      case 'pause_start': return t('startBreak');
      case 'pause_end': return t('endBreak');
      default: return type;
    }
  };

  const getActionTypeColor = (type: string) => {
    switch (type) {
      case 'start': return '#4CAF50';
      case 'end': return '#f44336';
      case 'pause_start': return '#FF9800';
      case 'pause_end': return '#2196F3';
      default: return '#666';
    }
  };

  const dates = Object.keys(history).sort((a, b) => b.localeCompare(a));

  const renderDateItem = ({ item: date }: { item: string }) => {
    const actions = history[date];
    const isExpanded = expandedDate === date;
    const summary = dailySummaries[date];

    return (
      <View style={styles.dateContainer}>
        <TouchableOpacity
          style={[styles.dateHeader, rtl && styles.dateHeaderRTL]}
          onPress={() => toggleDate(date)}
        >
          <View style={[styles.dateInfo, rtl && styles.dateInfoRTL]}>
            <Text style={styles.dateText}>
              {format(parseISO(date), 'EEEE, d MMM yyyy')}
            </Text>
            <Text style={styles.actionsCount}>
              {actions.length} {actions.length === 1 ? 'action' : 'actions'}
            </Text>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color="#4CAF50"
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent}>
            {summary && (
              <View style={styles.summaryCard}>
                <View style={[styles.summaryRow, rtl && styles.summaryRowRTL]}>
                  <Text style={styles.summaryLabel}>{t('workTime')}:</Text>
                  <Text style={styles.summaryValue}>
                    {formatDuration(summary.total_work_minutes)}
                  </Text>
                </View>
                <View style={[styles.summaryRow, rtl && styles.summaryRowRTL]}>
                  <Text style={styles.summaryLabel}>{t('breakTime')}:</Text>
                  <Text style={styles.summaryValue}>
                    {formatDuration(summary.total_break_minutes)}
                  </Text>
                </View>
                {summary.notes && (
                  <View style={styles.notesSection}>
                    <Text style={styles.notesLabel}>{t('notes')}:</Text>
                    <Text style={styles.notesText}>{summary.notes}</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.pdfButton}
                  onPress={() => generateDailyPDF(date)}
                >
                  <Ionicons name="document-text" size={20} color="#4CAF50" />
                  <Text style={styles.pdfButtonText}>{t('downloadPDF')}</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.actionsList}>
              {actions.sort((a, b) => 
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
              ).map((action, index) => (
                <View key={action.id || index} style={[styles.actionItem, rtl && styles.actionItemRTL]}>
                  <View
                    style={[
                      styles.actionDot,
                      { backgroundColor: getActionTypeColor(action.action_type) }
                    ]}
                  />
                  <View style={styles.actionContent}>
                    <Text style={[styles.actionType, rtl && styles.rtlText]}>
                      {getActionTypeLabel(action.action_type)}
                    </Text>
                    <Text style={[styles.actionTime, rtl && styles.rtlText]}>
                      {format(parseISO(action.timestamp), 'HH:mm')}
                    </Text>
                    {action.address && (
                      <Text style={[styles.actionAddress, rtl && styles.rtlText]}>
                        {action.address}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
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
      <HamburgerMenu currentRoute="/history" />
      
      <View style={styles.header}>
        <Logo size="small" />
        <Text style={[styles.title, rtl && styles.rtlText]}>{t('history')}</Text>
      </View>

      {dates.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={64} color="#333" />
          <Text style={styles.emptyText}>{t('noShiftsToday')}</Text>
        </View>
      ) : (
        <FlatList
          data={dates}
          keyExtractor={(item) => item}
          renderItem={renderDateItem}
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
  listContent: {
    padding: 16,
  },
  dateContainer: {
    marginBottom: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  dateHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  dateInfo: {
    flex: 1,
  },
  dateInfoRTL: {
    alignItems: 'flex-end',
  },
  dateText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionsCount: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryRowRTL: {
    flexDirection: 'row-reverse',
  },
  summaryLabel: {
    color: '#888',
    fontSize: 14,
  },
  summaryValue: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  notesSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  notesLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
  },
  notesText: {
    color: '#fff',
    fontSize: 14,
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  pdfButtonText: {
    color: '#4CAF50',
    marginLeft: 8,
    fontWeight: '600',
  },
  actionsList: {
    borderLeftWidth: 2,
    borderLeftColor: '#333',
    paddingLeft: 16,
    marginLeft: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  actionItemRTL: {
    flexDirection: 'row-reverse',
  },
  actionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginLeft: -22,
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionType: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionTime: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  actionAddress: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
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
});
