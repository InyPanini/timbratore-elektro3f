import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import Logo from '../../src/components/Logo';
import HamburgerMenu from '../../src/components/HamburgerMenu';
import { getEmployeeShifts } from '../../src/services/api';
import { isRTL } from '../../src/i18n';

export default function EmployeeShifts() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { id, name } = useLocalSearchParams();
  const rtl = isRTL(i18n.language);

  const [shifts, setShifts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    loadShifts();
  }, [days]);

  const loadShifts = async () => {
    setIsLoading(true);
    try {
      const data = await getEmployeeShifts(id as string, days);
      // Group by date
      const grouped: Record<string, any[]> = {};
      data.forEach((action: any) => {
        const dateKey = format(parseISO(action.timestamp), 'yyyy-MM-dd');
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(action);
      });
      setShifts(Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0])));
    } catch (error) {
      console.error('Error loading shifts:', error);
    } finally {
      setIsLoading(false);
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

  const renderDateSection = ({ item }: { item: [string, any[]] }) => {
    const [date, actions] = item;
    const sortedActions = actions.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return (
      <View style={styles.dateSection}>
        <Text style={styles.dateHeader}>
          {format(parseISO(date), 'EEEE, d MMMM yyyy')}
        </Text>
        <View style={styles.actionsContainer}>
          {sortedActions.map((action, index) => (
            <View key={action.id || index} style={[styles.actionItem, rtl && styles.actionItemRTL]}>
              <View
                style={[
                  styles.actionDot,
                  { backgroundColor: getActionTypeColor(action.action_type) }
                ]}
              />
              <View style={styles.actionContent}>
                <View style={[styles.actionHeader, rtl && styles.actionHeaderRTL]}>
                  <Text style={styles.actionType}>
                    {getActionTypeLabel(action.action_type)}
                  </Text>
                  <Text style={styles.actionTime}>
                    {format(parseISO(action.timestamp), 'HH:mm:ss')}
                  </Text>
                </View>
                {action.address && (
                  <Text style={styles.actionAddress}>
                    <Ionicons name="location" size={12} color="#888" /> {action.address}
                  </Text>
                )}
                {action.notes && (
                  <Text style={styles.actionNotes}>
                    <Ionicons name="document-text" size={12} color="#888" /> {action.notes}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <HamburgerMenu />
      
      <View style={styles.header}>
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
        <Logo size="small" />
        <Text style={[styles.title, rtl && styles.rtlText]}>{name}</Text>
        <Text style={styles.subtitle}>{t('viewShifts')}</Text>
      </View>

      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Last days:</Text>
        <View style={styles.filterButtons}>
          {[7, 14, 30, 60].map((d) => (
            <TouchableOpacity
              key={d}
              style={[
                styles.filterButton,
                days === d && styles.filterButtonActive
              ]}
              onPress={() => setDays(d)}
            >
              <Text style={[
                styles.filterButtonText,
                days === d && styles.filterButtonTextActive
              ]}>
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
      ) : shifts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={64} color="#333" />
          <Text style={styles.emptyText}>No shifts in this period</Text>
        </View>
      ) : (
        <FlatList
          data={shifts}
          keyExtractor={(item) => item[0]}
          renderItem={renderDateSection}
          contentContainerStyle={styles.listContent}
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
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 10 : 40,
    left: 16,
    padding: 8,
    zIndex: 10,
  },
  backButtonRTL: {
    left: undefined,
    right: 16,
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
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  filterLabel: {
    color: '#888',
    fontSize: 14,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
  },
  filterButtonActive: {
    backgroundColor: '#4CAF50',
  },
  filterButtonText: {
    color: '#888',
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  loader: {
    marginTop: 40,
  },
  listContent: {
    padding: 16,
  },
  dateSection: {
    marginBottom: 20,
  },
  dateHeader: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  actionsContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  actionItem: {
    flexDirection: 'row',
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
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  actionType: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionTime: {
    color: '#888',
    fontSize: 12,
  },
  actionAddress: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  actionNotes: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
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
