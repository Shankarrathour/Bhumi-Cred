import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import MapView, { Region } from '../../components/MapViewProxy';

export default function ApplyCarbonCreditScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [landArea, setLandArea] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [proofAttached, setProofAttached] = useState(false);
  
  const mapRef = useRef<any>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 23.2599,
    longitude: 77.4126,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          let location = await Location.getCurrentPositionAsync({});
          setRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          });
        }
      }
    })();
  }, []);

  const handleRegionChangeComplete = (newRegion: Region) => {
    setRegion(newRegion);
  };

  const handleAttachProof = () => {
    // Mock file upload
    setTimeout(() => {
      setProofAttached(true);
      Alert.alert("Success", "Land Document uploaded successfully.");
    }, 800);
  };

  const handleProceed = () => {
    if (!landArea || isNaN(Number(landArea)) || Number(landArea) <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid land area in Acres.");
      return;
    }
    if (!proofAttached) {
      Alert.alert("Missing Document", "Please attach a proof of land ownership (Khatauni/Khasra).");
      return;
    }

    router.push({
      pathname: '/carbon/payment',
      params: { 
        area: landArea,
        lat: region.latitude,
        lng: region.longitude
      }
    });
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Carbon Credit Program</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introCard}>
          <MaterialCommunityIcons name="leaf" size={32} color={COLORS.primary} style={{ marginBottom: 8 }} />
          <Text style={styles.introTitle}>Register your land</Text>
          <Text style={styles.introDesc}>Enroll your farm in our verified carbon sequestration program to earn yearly carbon payouts based on your biomass and organic farming practices.</Text>
        </View>

        {/* Step 1: Land Area */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.stepBadge}><Text style={styles.stepText}>1</Text></View>
            <Text style={styles.sectionTitle}>Total Farm Area</Text>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="e.g. 5.5"
              keyboardType="decimal-pad"
              value={landArea}
              onChangeText={setLandArea}
              placeholderTextColor="#94A3B8"
            />
            <Text style={styles.unitText}>Acres</Text>
          </View>
        </View>

        {/* Step 2: Location Mapping */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.stepBadge}><Text style={styles.stepText}>2</Text></View>
            <Text style={styles.sectionTitle}>Pin Farm Location</Text>
          </View>
          <Text style={styles.subText}>Drag the map to place the pin precisely on your farm boundary.</Text>
          
          <View style={styles.mapWrapper}>
            {Platform.OS === 'web' ? (
              <View style={[styles.map, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0FDF4' }]}>
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
                showsMyLocationButton={true}
              />
            )}
            <View style={styles.markerFixed} pointerEvents="none">
              <MaterialCommunityIcons name="map-marker" size={42} color={COLORS.primary} />
            </View>
          </View>
        </View>

        {/* Step 3: Proof Upload */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.stepBadge}><Text style={styles.stepText}>3</Text></View>
            <Text style={styles.sectionTitle}>Ownership Proof</Text>
          </View>
          <Text style={styles.subText}>Upload your Khasra/Khatauni or title deed document.</Text>
          
          <TouchableOpacity 
            style={[styles.uploadBox, proofAttached && styles.uploadBoxSuccess]} 
            onPress={handleAttachProof}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons 
              name={proofAttached ? "check-circle" : "cloud-upload-outline"} 
              size={32} 
              color={proofAttached ? COLORS.success : COLORS.primaryLight} 
            />
            <Text style={[styles.uploadText, proofAttached && { color: COLORS.success }]}>
              {proofAttached ? "Document Attached Successfully" : "Tap to upload document"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer Button */}
      <View style={[styles.footer, { paddingBottom: 20 + insets.bottom }]}>
        <TouchableOpacity style={styles.proceedBtn} onPress={handleProceed}>
          <Text style={styles.proceedBtnText}>Continue to Payment</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color={COLORS.textLight} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'ios' ? 50 : 45,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { padding: 8 },
  headerTitle: { ...TYPOGRAPHY.h2, color: COLORS.textLight },
  content: { flex: 1, padding: 20 },
  introCard: {
    backgroundColor: '#ECFDF5',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  introTitle: { ...TYPOGRAPHY.h3, color: COLORS.primaryDark, fontWeight: '800', marginBottom: 6 },
  introDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  stepBadge: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginRight: 10
  },
  stepText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  sectionTitle: { ...TYPOGRAPHY.h3, color: COLORS.textDark, fontWeight: 'bold' },
  subText: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 12 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16,
  },
  input: { flex: 1, height: 50, fontSize: 16, color: COLORS.textDark, fontWeight: '600' },
  unitText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: 'bold' },
  mapWrapper: {
    height: 200, width: '100%', borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.border, position: 'relative'
  },
  map: { ...StyleSheet.absoluteFillObject },
  markerFixed: {
    position: 'absolute', top: '50%', left: '50%', marginLeft: -21, marginTop: -42,
    alignItems: 'center', justifyContent: 'center'
  },
  uploadBox: {
    borderWidth: 2, borderColor: '#CBD5E1', borderStyle: 'dashed', borderRadius: 16,
    padding: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC'
  },
  uploadBoxSuccess: { borderColor: COLORS.success, backgroundColor: '#F0FDF4', borderStyle: 'solid' },
  uploadText: { marginTop: 10, fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.surface,
    padding: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 24, borderTopWidth: 1, borderTopColor: COLORS.border,
    ...SHADOWS.soft,
  },
  proceedBtn: {
    backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 30,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', ...SHADOWS.soft,
  },
  proceedBtnText: { ...TYPOGRAPHY.subtitle, color: COLORS.textLight, fontWeight: 'bold', marginRight: 8 },
});
