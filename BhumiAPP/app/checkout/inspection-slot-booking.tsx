import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { setSlot } from '../../src/store/slices/bookingSlice';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { MaterialDatePickerModal } from '../../src/components/MaterialDatePickerModal';
import { MaterialTimeSlotModal } from '../../src/components/MaterialTimeSlotModal';

const MOCK_SLOTS = [
  '07:00 AM - 10:00 AM (Early Drone Scan)',
  '10:00 AM - 01:00 PM (Mid-Day Soil Audit)',
  '01:00 PM - 04:00 PM (Afternoon Canopy Mapping)',
  '04:00 PM - 07:00 PM (Late Sunset Imaging)',
];

const INSPECTION_TYPES = [
  { id: 'soil', label: 'Soil Organic Carbon (SOC) Audit', icon: 'sprout' },
  { id: 'canopy', label: 'NDVI Satellite & Canopy Scan', icon: 'tree' },
  { id: 'tillage', label: 'Zero-Tillage & Biomass Mapping', icon: 'molecule-co2' },
];

export default function InspectionSlotBookingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  const [selectedDateObj, setSelectedDateObj] = useState<dayjs.Dayjs>(dayjs().add(1, 'day'));
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [inspectionType, setInspectionType] = useState('soil');
  const [acreage, setAcreage] = useState('');
  const [village, setVillage] = useState('');
  const [instructions, setInstructions] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style);
    }
  };

  const handleFetchGPS = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Required',
          'We require GPS permissions to map the satellite inspection coordinates for your farm.',
          [{ text: 'OK' }]
        );
        setGpsLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert('GPS Mapped ✅', `Coordinates Locked: Lat ${loc.coords.latitude.toFixed(5)}, Lon ${loc.coords.longitude.toFixed(5)}`);
    } catch (e) {
      // Fallback simulated GPS coordinates (Bhopal Rural plot)
      setCoords({ latitude: 23.2599, longitude: 77.4126 });
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert('GPS Simulated ✅', 'Locked simulated crop-tech boundary coordinates: Lat 23.2599, Lon 77.4126');
    } finally {
      setGpsLoading(false);
    }
  };

  const isValid = selectedDateObj && selectedTime && acreage.trim().length > 0 && village.trim().length > 0;

  const handleContinue = () => {
    if (isValid) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      dispatch(setSlot({ 
        date: selectedDateObj.format('YYYY-MM-DD'), 
        time: `${selectedTime} [${inspectionType.toUpperCase()} - ${acreage} Acres - Village: ${village}]` 
      }));
      router.push('/checkout/farmer-details' as any);
    }
  };

  const getBorderColor = (inputId: string) => {
    return focusedInput === inputId ? COLORS.primary : COLORS.border;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }} 
          style={styles.backBtn}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule Inspection</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.pickerContainer}>
          <Text style={styles.sectionTitle}>Inspection Details / निरीक्षण विवरण</Text>
          
          {/* Inspection Type Selector */}
          <Text style={styles.label}>Inspection Program *</Text>
          <View style={styles.typesRow}>
            {INSPECTION_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeCard,
                  inspectionType === type.id && styles.typeCardActive
                ]}
                onPress={() => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                  setInspectionType(type.id);
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: inspectionType === type.id }}
              >
                <MaterialCommunityIcons 
                  name={type.icon as any} 
                  size={22} 
                  color={inspectionType === type.id ? '#FFFFFF' : COLORS.primary} 
                />
                <Text style={[
                  styles.typeLabel,
                  inspectionType === type.id && styles.typeLabelActive
                ]}>
                  {type.id === 'soil' ? 'Soil Audit' : type.id === 'canopy' ? 'Canopy' : 'Tillage'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Date Selector Card */}
          <Text style={styles.label}>Preferred Inspection Date *</Text>
          <TouchableOpacity 
            style={styles.premiumSelectCard} 
            activeOpacity={0.8}
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              setDatePickerVisible(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Select Preferred Date"
          >
            <View style={styles.selectIconBox}>
              <MaterialCommunityIcons name="calendar-month" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.selectMeta}>
              <Text style={styles.selectLabel}>Date Selected</Text>
              <Text style={styles.selectValue}>
                {selectedDateObj.format('dddd, DD MMMM YYYY')}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#94A3B8" />
          </TouchableOpacity>

          {/* Time Selector Card */}
          <Text style={[styles.label, { marginTop: 16 }]}>Preferred Time Slot *</Text>
          <TouchableOpacity 
            style={styles.premiumSelectCard} 
            activeOpacity={0.8}
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              setTimePickerVisible(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Select Arrival Time Slot"
          >
            <View style={[styles.selectIconBox, !selectedTime && { backgroundColor: '#F1F5F9' }]}>
              <MaterialCommunityIcons 
                name="clock-outline" 
                size={24} 
                color={selectedTime ? COLORS.primary : '#64748B'} 
              />
            </View>
            <View style={styles.selectMeta}>
              <Text style={styles.selectLabel}>Time Window</Text>
              <Text style={[styles.selectValue, !selectedTime && { color: '#64748B', fontWeight: '500' }]}>
                {selectedTime || 'Tap to choose your time window'}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#94A3B8" />
          </TouchableOpacity>

          {/* Land Details Grid */}
          <Text style={[styles.label, { marginTop: 16 }]}>Land Area & Location Details / भू-भाग का विवरण *</Text>
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <TextInput
                style={[styles.input, { borderColor: getBorderColor('acreage') }]}
                placeholder="Acreage Size"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numeric"
                value={acreage}
                onChangeText={setAcreage}
                onFocus={() => setFocusedInput('acreage')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
            <View style={styles.halfWidth}>
              <TextInput
                style={[styles.input, { borderColor: getBorderColor('village') }]}
                placeholder="Village / Location"
                placeholderTextColor={COLORS.textSecondary}
                value={village}
                onChangeText={setVillage}
                onFocus={() => setFocusedInput('village')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          </View>

          {/* Geo-Tag mapping block */}
          <View style={styles.gpsContainer}>
            <View style={{ flex: 1 }}>
              <Text style={styles.gpsTitle}>Satellite Geo-boundary coordinates</Text>
              <Text style={styles.gpsValue}>
                {coords 
                  ? `Lat: ${coords.latitude.toFixed(5)}, Lon: ${coords.longitude.toFixed(5)}`
                  : 'Coordinates not mapped yet'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.gpsBtn} 
              onPress={handleFetchGPS}
              disabled={gpsLoading}
              accessibilityRole="button"
              accessibilityLabel="Map GPS Boundary"
            >
              {gpsLoading ? (
                <ActivityIndicator color={COLORS.primary} size="small" />
              ) : (
                <MaterialCommunityIcons name="crosshairs-gps" size={22} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          </View>

        </View>

        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="information" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            A certified agricultural soil baseline officer will arrive at your geo-tagged land. Please ensure crop stubble or topsoil access is cleared prior to inspection.
          </Text>
        </View>

      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: 20 + insets.bottom }]}>
        <TouchableOpacity 
          style={[styles.continueBtn, !isValid && styles.continueBtnDisabled]} 
          disabled={!isValid}
          onPress={handleContinue}
          accessibilityRole="button"
          accessibilityLabel="Continue to Farmer Details"
        >
          <Text style={styles.continueBtnText}>Continue to Farmer Details</Text>
        </TouchableOpacity>
      </View>

      {/* Custom Material Picker Modals */}
      <MaterialDatePickerModal
        visible={isDatePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        initialDate={selectedDateObj}
        onDateSelect={(date) => {
          setSelectedDateObj(date);
          setSelectedTime(null); // reset slot when date is adjusted
        }}
      />

      <MaterialTimeSlotModal
        visible={isTimePickerVisible}
        onClose={() => setTimePickerVisible(false)}
        slots={MOCK_SLOTS}
        initialSlot={selectedTime || ''}
        onSlotSelect={(slot) => setSelectedTime(slot)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4FDF9',
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
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textLight,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primaryDark,
    fontWeight: '800',
    marginBottom: 16,
    marginTop: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  typesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  typeCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 12,
    marginHorizontal: 3,
    ...SHADOWS.soft,
  },
  typeCardActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  typeLabelActive: {
    color: '#FFFFFF',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E6F4EA',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primaryLight + '30',
    marginTop: 16,
  },
  infoText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    flex: 1,
    marginLeft: 8,
    lineHeight: 18,
    fontWeight: '600',
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
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  premiumSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 10,
  },
  selectIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E6F4EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  selectMeta: {
    flex: 1,
  },
  selectLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  selectValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  halfWidth: {
    width: '48%',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 13,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  gpsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EA',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
  },
  gpsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  gpsValue: {
    fontSize: 11,
    color: COLORS.primaryDark,
    marginTop: 2,
    fontWeight: '700',
  },
  gpsBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  }
});
