import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { isRTL } from '../i18n';

const { width } = Dimensions.get('window');

interface HamburgerMenuProps {
  currentRoute?: string;
}

export default function HamburgerMenu({ currentRoute }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const router = useRouter();
  const rtl = isRTL(i18n.language);

  const menuItems = [
    { key: 'dashboard', icon: 'home-outline', route: '/dashboard' },
    { key: 'history', icon: 'time-outline', route: '/history' },
    { key: 'reports', icon: 'document-text-outline', route: '/reports' },
    { key: 'profile', icon: 'person-outline', route: '/profile' },
  ];

  // Add admin menu items
  if (user?.role === 'admin') {
    menuItems.splice(1, 0, 
      { key: 'employees', icon: 'people-outline', route: '/admin/employees' },
      { key: 'pendingSignatures', icon: 'create-outline', route: '/admin/signatures' },
      { key: 'todayActivity', icon: 'pulse-outline', route: '/admin/activity' }
    );
  }

  const handleNavigate = (route: string) => {
    setIsOpen(false);
    router.push(route as any);
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    router.replace('/login');
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.menuButton, rtl && styles.menuButtonRTL]}
        onPress={() => setIsOpen(true)}
      >
        <Ionicons name="menu" size={28} color="#4CAF50" />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.overlayTouchable}
            activeOpacity={1}
            onPress={() => setIsOpen(false)}
          />
          <View style={[styles.menuContainer, rtl && styles.menuContainerRTL]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsOpen(false)}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>

            <ScrollView 
              style={styles.menuScrollView}
              contentContainerStyle={styles.menuScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* User Info */}
              <View style={styles.userSection}>
                {user?.profile_picture ? (
                  <Image
                    source={{ uri: user.profile_picture }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={40} color="#4CAF50" />
                  </View>
                )}
                <Text style={styles.userName}>{user?.name}</Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>
                    {user?.role === 'admin' ? 'Admin' : 'Employee'}
                  </Text>
                </View>
              </View>

              {/* Menu Items */}
              <View style={styles.menuItems}>
                {menuItems.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.menuItem,
                      currentRoute === item.route && styles.menuItemActive,
                      rtl && styles.menuItemRTL
                    ]}
                    onPress={() => handleNavigate(item.route)}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={24}
                      color={currentRoute === item.route ? '#4CAF50' : '#fff'}
                    />
                    <Text
                      style={[
                        styles.menuItemText,
                        currentRoute === item.route && styles.menuItemTextActive,
                        rtl && styles.menuItemTextRTL
                      ]}
                    >
                      {t(item.key)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Logout */}
              <TouchableOpacity
                style={[styles.logoutButton, rtl && styles.menuItemRTL]}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={24} color="#ff5252" />
                <Text style={[styles.logoutText, rtl && styles.menuItemTextRTL]}>
                  {t('logout')}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 16,
    zIndex: 100,
    padding: 8,
  },
  menuButtonRTL: {
    right: undefined,
    left: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  menuContainer: {
    width: width * 0.75,
    maxWidth: 300,
    height: '100%',
    backgroundColor: '#1a1a1a',
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingHorizontal: 20,
  },
  menuContainerRTL: {
    alignSelf: 'flex-start',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 16,
    padding: 8,
    zIndex: 10,
  },
  menuScrollView: {
    flex: 1,
  },
  menuScrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  userSection: {
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  menuItems: {
    paddingVertical: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  menuItemRTL: {
    flexDirection: 'row-reverse',
  },
  menuItemActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  menuItemText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 16,
  },
  menuItemTextRTL: {
    marginLeft: 0,
    marginRight: 16,
  },
  menuItemTextActive: {
    color: '#4CAF50',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
    marginTop: 20,
    marginBottom: 40,
  },
  logoutText: {
    color: '#ff5252',
    fontSize: 16,
    marginLeft: 16,
  },
});
