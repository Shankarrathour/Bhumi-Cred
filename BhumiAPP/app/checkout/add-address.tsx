import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MapView, { Region } from '../../components/MapViewProxy';
import * as Location from 'expo-location';

import { RootState } from '../../src/store';
import { addAddress } from '../../src/store/slices/addressSlice';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';

export default function AddAddressScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const mapRef = useRef<any>(null);

  // Parse coordinates passed from previous GPS trigger or default to New Delhi
  const initialLat = params.lat ? parseFloat(params.lat as string) : 28.6139;
  const initialLng = params.lng ? parseFloat(params.lng as string) : 77.2090;

  // Coordinates State
  const [region, setRegion] = useState<Region>({
    latitude: initialLat,
    longitude: initialLng,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

  // Form Fields State
  const [flatNo, setFlatNo] = useState('');
  const [area, setArea] = useState((params.area as string) || '');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState((params.pincode as string) || '');
  const [city, setCity] = useState((params.city as string) || '');
  const [state, setState] = useState((params.state as string) || '');
  
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.mobile || '');
  const [addressType, setAddressType] = useState<'Home' | 'Work' | 'Other'>('Home');

  const [isLocating, setIsLocating] = useState(false);

  // Pre-fill and animate map when navigation parameters change (GPS source)
  useEffect(() => {
    if (params.lat && params.lng) {
      const lat = parseFloat(params.lat as string);
      const lng = parseFloat(params.lng as string);
      
      const newRegion = {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.004,
        longitudeDelta: 0.004,
      };
      
      setRegion(newRegion);
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
    }
  }, [params.lat, params.lng]);

  // Handle reverse-geocoding when map region drag finishes
  const handleRegionChangeComplete = async (newRegion: Region) => {
    setRegion(newRegion);
    setIsLocating(true);
    try {
      const geocodes = await Location.reverseGeocodeAsync({
        latitude: newRegion.latitude,
        longitude: newRegion.longitude,
      });

      if (geocodes && geocodes.length > 0) {
        const geo = geocodes[0];
        // Update fields dynamically, but preserve user typed flat numbers!
        setArea(geo.district || geo.street || geo.subregion || '');
        setCity(geo.city || geo.subregion || '');
        setState(geo.region || '');
        setPincode(geo.postalCode || '');
      }
    } catch (e) {
      console.log("Reverse geocoding skipped on drag", e);
    } finally {
      setIsLocating(false);
    }
  };

  const handleSaveAddress = () => {
    if (!flatNo.trim() || !area.trim() || !pincode.trim() || !name.trim() || !phone.trim()) {
      Alert.alert("Required Fields Missing", "Please fill in your Flat No, Area, Pincode, and Contact details.");
      return;
    }

    const fullAddressString = `${flatNo.trim()}, ${landmark ? landmark.trim() + ', ' : ''}${area.trim()}, ${city.trim()}, ${state.trim()} ${pincode.trim()}`;
    
    const newAddr = {
      id: 'addr_' + Date.now(),
      type: addressType,
      name: name.trim(),
      phone: phone.trim(),
      address: fullAddressString,
      flatNo: flatNo.trim(),
      landmark: landmark.trim(),
      area: area.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      latitude: region.latitude,
      longitude: region.longitude,
    };

    dispatch(addAddress(newAddr));
    Alert.alert("Success", "Address added to your account successfully!");
    router.back();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Address</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Draggable Map View Container */}
      <View style={styles.mapWrapper}>
        {Platform.OS === 'web' ? (
          <View style={[styles.map, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#E2E8F0' }]}>
            <MaterialCommunityIcons name="map-marker-radius" size={40} color={COLORS.primary} />
            <Text style={{ color: COLORS.primaryDark, marginTop: 10, fontWeight: 'bold' }}>Map Selection Optimized for Mobile</Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={region}
            onRegionChangeComplete={handleRegionChangeComplete}
            showsUserLocation={true}
            showsMyLocationButton={false}
          />
        )}
        {/* Static Pin exactly in visual center representing GPS targeting */}
        <View style={styles.markerFixed} pointerEvents="none">
          <MaterialCommunityIcons name="map-marker" size={42} color={COLORS.primary} />
          <View style={styles.markerShadow} />
        </View>

        {isLocating && (
          <View style={styles.locatingOverlay}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.locatingText}>Pinning location...</Text>
          </View>
        )}
      </View>

      {/* Detail Forms Container */}
      <ScrollView 
        style={styles.formScrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="map-marker-radius" size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Address Details</Text>
        </View>

        <Text style={styles.label}>HOUSE NO. / BUILDING / APARTMENT *</Text>
        <TextInput
          style={styles.input}
          value={flatNo}
          onChangeText={setFlatNo}
          placeholder="e.g. Flat 302, Tower A, Grand Arch"
          placeholderTextColor="#94A3B8"
        />

        <Text style={styles.label}>ROAD / AREA / COLONY *</Text>
        <TextInput
          style={styles.input}
          value={area}
          onChangeText={setArea}
          placeholder="e.g. Sector 56, Golf Course Extension"
          placeholderTextColor="#94A3B8"
        />

        <View style={styles.rowInput}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.label}>PINCODE *</Text>
            <TextInput
              style={styles.input}
              value={pincode}
              onChangeText={setPincode}
              placeholder="122001"
              keyboardType="number-pad"
              maxLength={6}
              placeholderTextColor="#94A3B8"
            />
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.label}>CITY *</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="Gurgaon"
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        <Text style={styles.label}>LANDMARK (OPTIONAL)</Text>
        <TextInput
          style={styles.input}
          value={landmark}
          onChangeText={setLandmark}
          placeholder="e.g. Near Apex Hospital"
          placeholderTextColor="#94A3B8"
        />

        {/* Address Type Picker */}
        <Text style={styles.label}>SAVE ADDRESS AS</Text>
        <View style={styles.typeSelectorRow}>
          {(['Home', 'Work', 'Other'] as const).map((type) => {
            const isActive = addressType === type;
            const iconName = type === 'Home' ? 'home-outline' : type === 'Work' ? 'briefcase-outline' : 'map-marker-outline';
            return (
              <TouchableOpacity
                key={type}
                style={[styles.typeChip, isActive && styles.typeChipActive]}
                onPress={() => setAddressType(type)}
              >
                <MaterialCommunityIcons 
                  name={iconName} 
                  size={18} 
                  color={isActive ? COLORS.textLight : '#64748B'} 
                />
                <Text style={[styles.typeChipText, isActive && styles.typeChipTextActive]}>{type}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <MaterialCommunityIcons name="account-circle-outline" size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Contact Details</Text>
        </View>

        <Text style={styles.label}>RECEIVER'S NAME *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Full Name"
          placeholderTextColor="#94A3B8"
        />

        <Text style={styles.label}>CONTACT NUMBER *</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+91 9999999999"
          keyboardType="phone-pad"
          placeholderTextColor="#94A3B8"
        />

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Fixed Save Button Footer */}
      <View style={[styles.footer, { paddingBottom: 20 + insets.bottom }]}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAddress}>
          <Text style={styles.saveBtnText}>Save & Add Address</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    zIndex: 10,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textLight,
  },
  mapWrapper: {
    height: '30%',
    width: '100%',
    position: 'relative',
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerFixed: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -21,
    marginTop: -42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerShadow: {
    width: 10,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginTop: -2,
  },
  locatingOverlay: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    ...SHADOWS.soft,
    elevation: 4,
  },
  locatingText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  formScrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textDark,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.textDark,
  },
  rowInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeChipText: {
    ...TYPOGRAPHY.caption,
    fontWeight: 'bold',
    color: '#64748B',
    marginLeft: 6,
  },
  typeChipTextActive: {
    color: COLORS.textLight,
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
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  saveBtnText: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textLight,
    fontWeight: 'bold',
  }
});
