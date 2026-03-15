import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { WebView } from 'react-native-webview';
import Logo from '../../src/components/Logo';
import HamburgerMenu from '../../src/components/HamburgerMenu';
import { getEmployeeLocations } from '../../src/services/api';
import { isRTL } from '../../src/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function EmployeeLocations() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { id, name } = useLocalSearchParams();
  const rtl = isRTL(i18n.language);

  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    loadLocations();
  }, [selectedDate]);

  const loadLocations = async () => {
    setIsLoading(true);
    try {
      const data = await getEmployeeLocations(id as string, selectedDate);
      setLocations(data);
    } catch (error) {
      console.error('Error loading locations:', error);
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

  // Generate OpenStreetMap HTML with markers
  const generateMapHTML = () => {
    if (locations.length === 0) return '';

    const markers = locations.map((loc, index) => {
      const color = getActionTypeColor(loc.action_type);
      return `
        L.circleMarker([${loc.latitude}, ${loc.longitude}], {
          radius: 10,
          color: '${color}',
          fillColor: '${color}',
          fillOpacity: 0.8
        }).addTo(map)
          .bindPopup('<strong>${getActionTypeLabel(loc.action_type)}</strong><br/>${format(new Date(loc.timestamp), 'HH:mm:ss')}<br/>${loc.address || ''}');
      `;
    }).join('\n');

    const centerLat = locations.reduce((sum, loc) => sum + loc.latitude, 0) / locations.length;
    const centerLng = locations.reduce((sum, loc) => sum + loc.longitude, 0) / locations.length;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { width: 100%; height: 100vh; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map').setView([${centerLat}, ${centerLng}], 14);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map);
          ${markers}
        </script>
      </body>
      </html>
    `;
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
        <Text style={styles.subtitle}>{t('viewLocations')}</Text>
      </View>

      <View style={styles.dateContainer}>
        <Text style={styles.dateLabel}>{t('date')}:</Text>
        <TextInput
          style={styles.dateInput}
          value={selectedDate}
          onChangeText={setSelectedDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#666"
        />
        <TouchableOpacity
          style={styles.todayButton}
          onPress={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
        >
          <Text style={styles.todayButtonText}>Today</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
      ) : locations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="location-outline" size={64} color="#333" />
          <Text style={styles.emptyText}>No locations recorded on this date</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {/* Map */}
          <View style={styles.mapContainer}>
            <WebView
              source={{ html: generateMapHTML() }}
              style={styles.map}
              scrollEnabled={false}
            />
          </View>

          {/* Location List */}
          <ScrollView style={styles.locationsList}>
            {locations.map((loc, index) => (
              <View key={index} style={[styles.locationItem, rtl && styles.locationItemRTL]}>
                <View
                  style={[
                    styles.locationDot,
                    { backgroundColor: getActionTypeColor(loc.action_type) }
                  ]}
                />
                <View style={styles.locationContent}>
                  <View style={[styles.locationHeader, rtl && styles.locationHeaderRTL]}>
                    <Text style={styles.locationType}>
                      {getActionTypeLabel(loc.action_type)}
                    </Text>
                    <Text style={styles.locationTime}>
                      {format(new Date(loc.timestamp), 'HH:mm:ss')}
                    </Text>
                  </View>
                  <Text style={styles.locationCoords}>
                    {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                  </Text>
                  {loc.address && (
                    <Text style={styles.locationAddress}>{loc.address}</Text>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
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
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  dateLabel: {
    color: '#888',
    fontSize: 14,
  },
  dateInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
  },
  todayButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  todayButtonText: {
    color: '#000',
    fontWeight: '600',
  },
  loader: {
    marginTop: 40,
  },
  content: {
    flex: 1,
  },
  mapContainer: {
    height: 250,
    backgroundColor: '#1a1a1a',
  },
  map: {
    flex: 1,
  },
  locationsList: {
    flex: 1,
    padding: 16,
  },
  locationItem: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  locationItemRTL: {
    flexDirection: 'row-reverse',
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  locationContent: {
    flex: 1,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  locationType: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  locationTime: {
    color: '#4CAF50',
    fontSize: 12,
  },
  locationCoords: {
    color: '#666',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  locationAddress: {
    color: '#888',
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
