import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootState } from '../../src/store';
import { setAddress } from '../../src/store/slices/bookingSlice';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';

export default function AddressScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  
  // Load real address database from Redux
  const addresses = useSelector((state: RootState) => state.address.addresses);
  
  const [selectedId, setSelectedId] = useState<string | null>(addresses.length > 0 ? addresses[0].id : null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const handleContinue = () => {
    if (!selectedId) return;
    const selected = addresses.find(a => a.id === selectedId);
    if (selected) {
      dispatch(setAddress(selected.address));
      router.push('/checkout/inspection-slot-booking' as any);
    }
  };

  const handleCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          "Location Required",
          "Please enable location services in your device settings to fetch the current address.",
          [{ text: "OK" }]
        );
        setLoadingLocation(false);
        return;
      }

      // Fetch Coordinates
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Reverse Geocoding
      const geocodes = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocodes && geocodes.length > 0) {
        const geo = geocodes[0];
        router.push({
          pathname: '/checkout/add-address',
          params: {
            lat: String(location.coords.latitude),
            lng: String(location.coords.longitude),
            city: geo.city || geo.subregion || '',
            state: geo.region || '',
            pincode: geo.postalCode || '',
            area: geo.district || geo.subregion || '',
            street: geo.street || geo.name || '',
          }
        } as any);
      } else {
        router.push({
          pathname: '/checkout/add-address',
          params: {
            lat: String(location.coords.latitude),
            lng: String(location.coords.longitude),
          }
        } as any);
      }
    } catch (error) {
      console.warn(error);
      Alert.alert("Fetching Failed", "Could not fetch your device location. Please enter it manually.");
    } finally {
      setLoadingLocation(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Address</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <TouchableOpacity 
          style={styles.addAddressCard} 
          onPress={() => router.push('/checkout/add-address')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="plus-circle-outline" size={24} color={COLORS.primary} />
          <Text style={styles.addAddressText}>Add New Address</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textSecondary} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.currentLocationCard, loadingLocation && { opacity: 0.6 }]} 
          onPress={handleCurrentLocation}
          disabled={loadingLocation}
          activeOpacity={0.7}
        >
          {loadingLocation ? (
            <ActivityIndicator color={COLORS.accent} size={22} style={{ marginRight: 4 }} />
          ) : (
            <MaterialCommunityIcons name="crosshairs-gps" size={24} color={COLORS.accent} />
          )}
          <View style={styles.currentLocationTextCol}>
            <Text style={styles.currentLocationTitle}>
              {loadingLocation ? "Accessing GPS..." : "Use Current Location"}
            </Text>
            <Text style={styles.currentLocationSub}>
              {loadingLocation ? "Detecting your device coordinates..." : "Enable GPS to fetch address"}
            </Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Saved Addresses</Text>

        {addresses.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="map-marker-off-outline" size={48} color={COLORS.border} />
            <Text style={styles.emptyText}>No saved addresses yet.</Text>
            <Text style={styles.emptySub}>Add one using the buttons above to continue.</Text>
          </View>
        ) : (
          addresses.map((addr) => (
            <TouchableOpacity 
              key={addr.id} 
              style={[
                styles.addressCard,
                selectedId === addr.id && styles.addressCardSelected
              ]}
              onPress={() => setSelectedId(addr.id)}
              activeOpacity={0.8}
            >
              <View style={styles.addressHeaderRow}>
                <View style={styles.leftHeaderCol}>
                  <Text style={styles.nameText}>{addr.name}</Text>
                  <View style={[styles.typeBadge, selectedId === addr.id && styles.typeBadgeActive]}>
                    <MaterialCommunityIcons 
                      name={
                        addr.type === 'Home' ? 'home-outline' : 
                        addr.type === 'Work' ? 'briefcase-outline' : 
                        'map-marker-outline'
                      } 
                      size={11} 
                      color={selectedId === addr.id ? COLORS.primary : '#64748B'} 
                    />
                    <Text style={[styles.typeText, selectedId === addr.id && styles.typeTextActive]}>{addr.type.toUpperCase()}</Text>
                  </View>
                </View>
                <View style={styles.radioContainer}>
                  {selectedId === addr.id ? (
                    <MaterialCommunityIcons name="radiobox-marked" size={22} color={COLORS.primary} />
                  ) : (
                    <MaterialCommunityIcons name="radiobox-blank" size={22} color="#CBD5E1" />
                  )}
                </View>
              </View>
              
              <Text style={styles.addressText}>{addr.address}</Text>
              <View style={styles.phoneRow}>
                <MaterialCommunityIcons name="phone-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
                <Text style={styles.phoneText}>{addr.phone}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: 20 + insets.bottom }]}>
        <TouchableOpacity 
          style={[styles.continueBtn, !selectedId && styles.continueBtnDisabled]} 
          disabled={!selectedId}
          onPress={handleContinue}
        >
          <Text style={styles.continueBtnText}>Continue to Schedule Inspection</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'ios' ? 50 : 45,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textLight,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  addAddressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
    elevation: 2,
  },
  addAddressText: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  currentLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
    elevation: 2,
  },
  currentLocationTextCol: {
    marginLeft: 12,
    flex: 1,
  },
  currentLocationTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textDark,
    fontWeight: 'bold',
  },
  currentLocationSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textDark,
    marginBottom: 16,
    fontWeight: 'bold',
  },
  addressCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addressCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(0, 128, 128, 0.02)',
    borderWidth: 1.5,
  },
  addressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  leftHeaderCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 12,
  },
  typeBadgeActive: {
    backgroundColor: 'rgba(0, 128, 128, 0.08)',
  },
  typeText: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '800',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  typeTextActive: {
    color: COLORS.primary,
  },
  radioContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  nameText: {
    fontSize: 15,
    color: COLORS.textDark,
    fontWeight: 'bold',
  },
  addressText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
  },
  emptyText: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textDark,
    marginTop: 12,
    fontWeight: 'bold',
  },
  emptySub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.soft,
    elevation: 8,
  },
  continueBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  continueBtnDisabled: {
    backgroundColor: COLORS.border,
  },
  continueBtnText: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textLight,
    fontWeight: 'bold',
  }
});
