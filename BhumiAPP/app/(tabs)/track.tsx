import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline } from '../../components/MapViewProxy';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';

import { useAuthStore } from '../../src/store/authStore';
import { GovtAssetGISView } from '../../src/components/GovtAssetGISView';

const MOCK_LOCATION = {
  latitude: 23.2599,
  longitude: 77.4126, // Bhopal Rural Plot
  latitudeDelta: 0.03,
  longitudeDelta: 0.03,
};

const TECH_LOCATION = {
  latitude: 23.2520,
  longitude: 77.4080,
};

const HOME_LOCATION = {
  latitude: 23.2599,
  longitude: 77.4126,
};

export default function TrackScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const role = useAuthStore((state) => state.role);

  if (role === 'govt_body') {
    return <GovtAssetGISView />;
  }

  return (
    <View style={styles.container}>
      {/* Header overlay */}
      <View style={styles.headerOverlay}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sentinel Dispatch</Text>
        <TouchableOpacity style={styles.helpButton}>
          <MaterialCommunityIcons name="help-circle-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Map View */}
      {Platform.OS === 'web' ? (
        <View style={styles.webMapFallback}>
          <MaterialCommunityIcons name="map-marker-radius" size={60} color={COLORS.primary} />
          <Text style={styles.webMapText}>Drone live telemetry is active.</Text>
          <Text style={styles.webMapSubText}>Live GPS map tracking is fully optimized for iOS/Android builds.</Text>
        </View>
      ) : (
        <MapView
          style={styles.map}
          initialRegion={MOCK_LOCATION}
        >
          {/* Technician Marker */}
          <Marker coordinate={TECH_LOCATION} title="Soil Officer" description="Rahul Kumar is en route with Drone kit">
            <View style={styles.techMarker}>
              <MaterialCommunityIcons name="drone" size={22} color="#fff" />
            </View>
          </Marker>

          {/* Home Marker */}
          <Marker coordinate={HOME_LOCATION} title="Farm Plot" description="Plot #103 Boundary">
            <View style={styles.homeMarker}>
              <MaterialCommunityIcons name="image-filter-hdr" size={18} color="#fff" />
            </View>
          </Marker>

          {/* Route Line */}
          <Polyline
            coordinates={[TECH_LOCATION, HOME_LOCATION]}
            strokeColor={COLORS.primary}
            strokeWidth={4}
            lineDashPattern={[5, 5]}
          />
        </MapView>
      )}

      {/* ETA and Tech Details Card */}
      <View style={[styles.bottomSheet, { paddingBottom: 24 + insets.bottom }]}>
        <View style={styles.etaContainer}>
          <LinearGradient colors={['#ECFDF5', '#D1FAE5']} style={styles.etaBadge}>
            <MaterialCommunityIcons name="drone" size={20} color={COLORS.primary} />
            <Text style={styles.etaText}>Drone arriving in 15 mins</Text>
          </LinearGradient>
          <Text style={styles.bookingId}>Inspection: INS-102934</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.techProfileRow}>
          <View style={styles.avatarContainer}>
            <MaterialCommunityIcons name="account-cowboy-hat" size={50} color={COLORS.primary} />
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>4.9</Text>
              <MaterialCommunityIcons name="star" size={10} color="#fff" />
            </View>
          </View>
          
          <View style={styles.techInfo}>
            <Text style={styles.techName}>Rahul Kumar</Text>
            <Text style={styles.techRole}>Certified Soil & GIS Officer</Text>
            <Text style={styles.tempText}>DGCA Drone License: Active</Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.iconButton}>
              <MaterialCommunityIcons name="message-processing" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconButton, { backgroundColor: COLORS.success }]}>
              <MaterialCommunityIcons name="phone" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.preparationBox}>
          <MaterialCommunityIcons name="information" size={20} color="#B45309" />
          <Text style={styles.prepText}>
            Plot Reminder: Ensure topsoil access is cleared, boundary points mapped on your Aadhaar profile, and active drone paths marked.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4FDF9',
  },
  headerOverlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primaryDark,
    fontWeight: 'bold',
  },
  helpButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
  },
  webMapFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 30,
  },
  webMapText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primaryDark,
    marginTop: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  webMapSubText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  techMarker: {
    backgroundColor: COLORS.primary,
    padding: 8,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#fff',
    ...SHADOWS.glow,
  },
  homeMarker: {
    backgroundColor: COLORS.textDark,
    padding: 8,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#fff',
    ...SHADOWS.soft,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  etaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  etaText: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bookingId: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 20,
  },
  techProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  ratingText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 2,
  },
  techInfo: {
    flex: 1,
  },
  techName: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textDark,
  },
  techRole: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  tempText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primaryLight,
    fontSize: 10,
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  preparationBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB', // Amber 50
    padding: 16,
    borderRadius: 16,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  prepText: {
    ...TYPOGRAPHY.caption,
    color: '#B45309',
    marginLeft: 12,
    flex: 1,
    lineHeight: 18,
    fontWeight: '600',
  },
});
