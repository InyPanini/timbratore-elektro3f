import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import Logo from '../../src/components/Logo';
import HamburgerMenu from '../../src/components/HamburgerMenu';
import { getTodayActivity } from '../../src/services/api';
import { isRTL } from '../../src/i18n';

export default function AdminActivity() {
  const { t, i18n } = useTranslation();
  const rtl = isRTL(i18n.language);

  const [activity, setActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadActivity();
  }, []);

  const loadActivity = async () => {
    try {
      const data = await getTodayActivity();
      setActivity(data);
    } catch (error) {
      console.error('Error loading activity:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadActivity();
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

  const getCurrentStatus = (actions: any[]) => {
    let inShift = false;
    let onBreak = false;
    
    actions.forEach(action => {
      if (action.action_type === 'start') {
        inShift = true;
        onBreak = false;
      } else if (action.action_type === 'end') {
        inShift = false;
        onBreak = false;
      } else if (action.action_type === 'pause_start') {
        onBreak = true;
      } else if (action.action_type === 'pause_end') {
        onBreak = false;
      }
    });

    return { inShift, onBreak };
  };

  const renderUserActivity = ({ item }: { item: any }) => {
    const { inShift, onBreak } = getCurrentStatus(item.actions);
    const sortedActions = [...item.actions].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return (
      <View style={styles.userCard}>
        <View style={[styles.userHeader, rtl && styles.userHeaderRTL]}>
          <View style={[styles.userInfo, rtl && styles.userInfoRTL]}>
            <Text style={styles.userName}>{item.user_name}</Text>
            <Text style={styles.userEmail}>{item.user_email}</Text>
          </View>
          <View style={[
            styles.statusBadge,
            inShift 
              ? (onBreak ? styles.statusBreak : styles.statusActive)
              : styles.statusInactive
          ]}>
            <Ionicons
              name={inShift ? (onBreak ? 'pause' : 'checkmark') : 'close'}
              size={14}
              color="#fff"
            />
            <Text style={styles.statusText}>
              {inShift 
                ? (onBreak ? t('onBreak') : t('inShift'))
                : t('notInShift')
              }
            </Text>
          </View>
        </View>

        <View style={styles.actionsTimeline}>
          {sortedActions.slice(0, 5).map((action: any, index: number) => (
            <View key={action.id || index} style={[styles.actionItem, rtl && styles.actionItemRTL]}>
              <View
                style={[
                  styles.actionDot,
                  { backgroundColor: getActionTypeColor(action.action_type) }
                ]}
              />
              <View style={styles.actionContent}>
                <Text style={styles.actionType}>
                  {getActionTypeLabel(action.action_type)}
                </Text>
                <Text style={styles.actionTime}>
                  {format(new Date(action.timestamp), 'HH:mm:ss')}
                </Text>
              </View>
              {action.address && (
                <Text style={styles.actionAddress} numberOfLines={1}>
                  {action.address}
                </Text>
              )}
            </View>
          ))}
        </View>
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
      <HamburgerMenu currentRoute="/admin/activity" />
      
      <View style={styles.header}>
        <Logo size="small" />
        <Text style={[styles.title, rtl && styles.rtlText]}>
          {t('todayActivity')}
        </Text>
        <Text style={styles.subtitle}>
          {format(new Date(), 'EEEE, d MMMM yyyy')}
        </Text>
      </View>

      {activity.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="pulse-outline" size={64} color="#333" />
          <Text style={styles.emptyText}>No activity today</Text>
        </View>
      ) : (
        <FlatList
          data={activity}
          keyExtractor={(item) => item.user_id}
          renderItem={renderUserActivity}
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
  subtitle: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  userCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  userHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  userInfo: {
    flex: 1,
  },
  userInfoRTL: {
    alignItems: 'flex-end',
  },
  userName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  userEmail: {
    color: '#888',
    fontSize: 14,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
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
    fontSize: 12,
    fontWeight: '600',
  },
  actionsTimeline: {
    borderLeftWidth: 2,
    borderLeftColor: '#333',
    paddingLeft: 16,
    marginLeft: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionItemRTL: {
    flexDirection: 'row-reverse',
  },
  actionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: -21,
    marginRight: 12,
  },
  actionContent: {
    minWidth: 120,
  },
  actionType: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  actionTime: {
    color: '#888',
    fontSize: 12,
  },
  actionAddress: {
    flex: 1,
    color: '#666',
    fontSize: 12,
    marginLeft: 12,
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
