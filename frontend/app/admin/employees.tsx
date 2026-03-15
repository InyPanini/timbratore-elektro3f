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
  Image,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import Logo from '../../src/components/Logo';
import HamburgerMenu from '../../src/components/HamburgerMenu';
import { getAllEmployees } from '../../src/services/api';
import { isRTL } from '../../src/i18n';

export default function AdminEmployees() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const rtl = isRTL(i18n.language);

  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await getAllEmployees();
      setEmployees(data);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadEmployees();
  };

  const renderEmployee = ({ item }: { item: any }) => (
    <View style={styles.employeeCard}>
      <View style={[styles.employeeHeader, rtl && styles.employeeHeaderRTL]}>
        {item.profile_picture ? (
          <Image source={{ uri: item.profile_picture }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={24} color="#4CAF50" />
          </View>
        )}
        <View style={[styles.employeeInfo, rtl && styles.employeeInfoRTL]}>
          <Text style={styles.employeeName}>{item.name}</Text>
          <Text style={styles.employeeEmail}>{item.email}</Text>
          <Text style={styles.employeeDate}>
            Member since: {format(new Date(item.created_at), 'MMM d, yyyy')}
          </Text>
        </View>
      </View>
      
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push(`/admin/employee-shifts?id=${item.id}&name=${item.name}`)}
        >
          <Ionicons name="time" size={20} color="#4CAF50" />
          <Text style={styles.actionButtonText}>{t('viewShifts')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push(`/admin/employee-locations?id=${item.id}&name=${item.name}`)}
        >
          <Ionicons name="location" size={20} color="#4CAF50" />
          <Text style={styles.actionButtonText}>{t('viewLocations')}</Text>
        </TouchableOpacity>
      </View>
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
      <HamburgerMenu currentRoute="/admin/employees" />
      
      <View style={styles.header}>
        <Logo size="small" />
        <Text style={[styles.title, rtl && styles.rtlText]}>{t('employees')}</Text>
        <Text style={styles.subtitle}>{employees.length} registered employees</Text>
      </View>

      {employees.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#333" />
          <Text style={styles.emptyText}>No employees registered yet</Text>
        </View>
      ) : (
        <FlatList
          data={employees}
          keyExtractor={(item) => item.id}
          renderItem={renderEmployee}
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
  employeeCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  employeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  employeeHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeInfoRTL: {
    alignItems: 'flex-end',
    marginRight: 16,
    marginLeft: 0,
  },
  employeeName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  employeeEmail: {
    color: '#888',
    fontSize: 14,
    marginTop: 2,
  },
  employeeDate: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
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
