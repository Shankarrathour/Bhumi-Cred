import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Alert,
  Modal,
  Dimensions,
  FlatList,
  StatusBar,
  Keyboard
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootState } from '../../src/store';
import { updateProfile } from '../../src/store/slices/authSlice';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { isValidEmail, isValidPincode, isValidDate } from '../../src/utils/validation';
import CustomCalendarModal from '../../components/CustomCalendarModal';
import { useAuthStore } from '../../src/store/authStore';
import api from '../../src/api/apiClient';

const { width } = Dimensions.get('window');

// List of Month Names for the Calendar picker
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function EditProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useAuthStore((state) => state.user);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const insets = useSafeAreaInsets();

  // Dynamic Tab state
  const [activeTab, setActiveTab] = useState<'personal' | 'address'>('personal');

  // Form States - Personal Details
  const [name, setName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.mobile || '');
  const [altPhone, setAltPhone] = useState('');
  const [dob, setDob] = useState(user?.dob || 'Select Date');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>(
    user?.gender
      ? (user.gender.charAt(0).toUpperCase() + user.gender.slice(1)) as any
      : 'Male'
  );
  const [farmingRole, setFarmingRole] = useState(user?.occupation || 'Landowner');

  // Form States - Location details
  const [fullAddress, setFullAddress] = useState(user?.fullAddress || '');
  const [pincode, setPincode] = useState(user?.pincode || '');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState(user?.city || 'Noida');

  // New Calendar Modal State
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const scrollViewRef = React.useRef<ScrollView>(null);
  const fieldPositions = React.useRef<Record<string, number>>({});

  const handleSave = async () => {
    setErrors({});
    let hasError = false;
    const newErrors: Record<string, string> = {};

    if (!name.trim()) { newErrors.name = 'Please provide your full name.'; hasError = true; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) { newErrors.email = 'Please enter a valid email address.'; hasError = true; }
    if (altPhone && !/^[0-9]{10}$/.test(altPhone)) { newErrors.altPhone = 'Alternative Mobile number must be 10 digits.'; hasError = true; }
    if (pincode && !/^[0-9]{6}$/.test(pincode)) { newErrors.pincode = 'Pincode must be exactly 6 digits.'; hasError = true; }
    if (dob && dob !== 'Select Date' && !isValidDate(dob)) { newErrors.dob = 'Valid Date required'; hasError = true; }

    if (hasError) {
      setErrors(newErrors);
      const firstError = Object.keys(newErrors)[0];
      
      // Auto-switch tabs if needed
      if (['pincode'].includes(firstError)) {
        setActiveTab('address');
      } else if (['name', 'email', 'altPhone', 'dob'].includes(firstError)) {
        setActiveTab('personal');
      }

      // Small delay to allow tab switch layout to finish before scrolling
      setTimeout(() => {
        if (firstError && fieldPositions.current[firstError] !== undefined) {
          scrollViewRef.current?.scrollTo({ y: Math.max(0, fieldPositions.current[firstError] - 20), animated: true });
        }
      }, 100);
      return;
    }

    try {
      // 1. Prepare profile payload
      const profilePayload: Record<string, any> = {
        full_name: name.trim(),
        email: email.trim() || null,
        gender: gender.toLowerCase(),
        occupation: farmingRole,
      };

      if (dob && dob !== 'Select Date') {
        if (dob.includes('/')) {
          const [d, m, y] = dob.split('/');
          profilePayload.dob = new Date(Number(y), Number(m) - 1, Number(d)).toISOString();
        } else {
          profilePayload.dob = new Date(dob).toISOString();
        }
      }

      // 2. Prepare address payload
      const addressPayload = {
        current_address: {
          state: user?.state || undefined,
          district: user?.district || undefined,
          village: user?.village || undefined,
          city: city.trim(),
          gram_panchayat: user?.gramPanchayat || undefined,
          vikash_khand: user?.vikashKhand || undefined,
          full_address: fullAddress.trim(),
          pincode: pincode.trim() || undefined,
        }
      };

      // 3. Save to backend API
      await Promise.all([
        api.put('/farmer/profile', profilePayload),
        api.put('/farmer/address', addressPayload),
      ]);

      // 4. Update Zustand store
      await fetchProfile();

      // 5. Update Redux store (for compatibility)
      dispatch(updateProfile({
        name: name.trim(),
        email: email.trim(),
        altMobile: altPhone.trim(),
        dob: dob !== 'Select Date' ? dob : undefined,
        gender,
        fullAddress: fullAddress.trim(),
        pincode: pincode.trim(),
      }));

      Alert.alert(
        "Update Successful ✅",
        "Your personal profile and location details have been synchronized!",
        [{ text: "Done", onPress: () => router.back() }]
      );
    } catch (err: any) {
      console.warn('[edit] Save profile failed:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to update profile. Please try again.';
      Alert.alert("Update Failed ❌", errMsg);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* 1. Custom Premium Sticky Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 10 : (Platform.OS === 'ios' ? 60 : 45) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Profile</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtnTop} activeOpacity={0.8}>
          <Text style={styles.saveTextTop}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* 2. High-End Sliding Segmented Tab Pills */}
      <View style={styles.tabsWrapper}>
        <View style={styles.tabSegmentContainer}>
          <TouchableOpacity
            style={[styles.tabSegmentBtn, activeTab === 'personal' && styles.tabSegmentBtnActive]}
            onPress={() => setActiveTab('personal')}
            activeOpacity={0.9}
          >
            <MaterialCommunityIcons
              name="account-circle"
              size={18}
              color={activeTab === 'personal' ? '#FFFFFF' : '#64748B'}
              style={{ marginRight: 6 }} />
            <Text style={[styles.tabBtnText, activeTab === 'personal' && styles.tabBtnTextActive]}>Personal Info</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabSegmentBtn, activeTab === 'address' && styles.tabSegmentBtnActive]}
            onPress={() => setActiveTab('address')}
            activeOpacity={0.9}
          >
            <MaterialCommunityIcons
              name="map-marker-radius"
              size={18}
              color={activeTab === 'address' ? '#FFFFFF' : '#64748B'}
              style={{ marginRight: 6 }} />
            <Text style={[styles.tabBtnText, activeTab === 'address' && styles.tabBtnTextActive]}>Address & Pin</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {activeTab === 'personal' ? (
          /* ------------------- TAB A: PERSONAL DETAILS ------------------- */
          <View style={styles.formSection}>

            {/* Avatar Frame */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarFrame}>
                <MaterialCommunityIcons name="account" size={56} color={COLORS.primary} />
                <TouchableOpacity style={styles.camBadge}>
                  <MaterialCommunityIcons name="camera" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <Text style={styles.avatarCaption}>Edit Photo</Text>
            </View>

            {/* Inputs Card */}
            <View style={styles.cardContainer}>
              <Text style={styles.inputLabel} onLayout={(e) => fieldPositions.current['name'] = e.nativeEvent.layout.y}>FULL NAME</Text>
              <View style={[styles.inputRow, errors.name && styles.inputError]}>
                <MaterialCommunityIcons name="account-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={(val) => { setName(val); setErrors(prev => ({ ...prev, name: '' })); }}
                  placeholder="Enter full name"
                  placeholderTextColor="#94A3B8" />
              </View>
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

              <Text style={styles.inputLabel} onLayout={(e) => fieldPositions.current['email'] = e.nativeEvent.layout.y}>EMAIL ADDRESS</Text>
              <View style={[styles.inputRow, errors.email && styles.inputError]}>
                <MaterialCommunityIcons name="email-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={(val) => { setEmail(val); setErrors(prev => ({ ...prev, email: '' })); }}
                  placeholder="user@email.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none" />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

              <Text style={styles.inputLabel}>VERIFIED MOBILE NUMBER</Text>
              <View style={[styles.inputRow, styles.lockedRow]}>
                <MaterialCommunityIcons name="phone-check" size={20} color="#059669" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: '#64748B' }]}
                  value={phone}
                  editable={false} />
                <MaterialCommunityIcons name="lock" size={16} color="#94A3B8" style={{ marginRight: 12 }} />
              </View>
              <Text style={styles.lockNotice}>Primary contact locked after OTP verification.</Text>

              {/* 📅 NEW: Calendar DOB Integration */}
              <Text style={styles.inputLabel} onLayout={(e) => fieldPositions.current['dob'] = e.nativeEvent.layout.y}>DATE OF BIRTH (DOB)</Text>
              <TouchableOpacity
                style={[styles.inputRow, errors.dob && styles.inputError]}
                onPress={() => { 
                  Keyboard.dismiss();
                  setIsCalendarVisible(true); 
                  setErrors(prev => ({ ...prev, dob: '' })); 
                }}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="calendar-month" size={20} color={COLORS.primary} style={styles.inputIcon} />
                <Text style={[styles.input, styles.dateText, dob === 'Select Date' && styles.placeholderDate]}>
                  {dob}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" style={{ marginRight: 12 }} />
              </TouchableOpacity>
              {errors.dob && <Text style={styles.errorText}>{errors.dob}</Text>}

              {/* 📞 NEW: Alternative Mobile Field */}
              <Text style={styles.inputLabel} onLayout={(e) => fieldPositions.current['altPhone'] = e.nativeEvent.layout.y}>ALTERNATIVE MOBILE (OPTIONAL)</Text>
              <View style={[styles.inputRow, errors.altPhone && styles.inputError]}>
                <MaterialCommunityIcons name="cellphone" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={altPhone}
                  onChangeText={(txt) => { setAltPhone(txt.replace(/[^0-9]/g, '')); setErrors(prev => ({ ...prev, altPhone: '' })); }}
                  placeholder="Enter 10 digit secondary mobile"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  maxLength={10} />
              </View>
              {errors.altPhone && <Text style={styles.errorText}>{errors.altPhone}</Text>}

              <View style={styles.gridBlock}>
                <View style={{ flex: 1.3, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>GENDER</Text>
                  <View style={styles.selectionRow}>
                    {(['Male', 'Female'] as const).map((g) => {
                      const isSel = gender === g;
                      return (
                        <TouchableOpacity
                          key={g}
                          style={[styles.chip, isSel && styles.chipActive]}
                          onPress={() => setGender(g)}
                        >
                          <Text style={[styles.chipText, isSel && styles.chipTextActive]}>{g}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputLabel}>FARMING ROLE</Text>
                  <TouchableOpacity
                    style={styles.rolePicker}
                    onPress={() => Alert.alert(
                      "Select Farming Role",
                      "Choose your primary ecological farming classification:",
                      [
                        { text: "Landowner", onPress: () => setFarmingRole("Landowner") },
                        { text: "Tenant Farmer", onPress: () => setFarmingRole("Tenant Farmer") },
                        { text: "Agro-forestry", onPress: () => setFarmingRole("Agro-forestry") },
                        { text: "Co-operative Lead", onPress: () => setFarmingRole("Co-operative Lead") }
                      ]
                    )}
                  >
                    <Text style={styles.roleVal}>{farmingRole}</Text>
                    <MaterialCommunityIcons name="chevron-down" size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ) : (
          /* ------------------- TAB B: ADDRESS DETAILS ------------------- */
          <View style={styles.formSection}>
            <View style={styles.cardContainer}>

              {/* 🏡 NEW: Full Address Input */}
              <Text style={styles.inputLabel}>FULL RESIDENTIAL ADDRESS</Text>
              <View style={[styles.inputRow, styles.textAreaRow]}>
                <MaterialCommunityIcons name="home-city-outline" size={20} color="#64748B" style={[styles.inputIcon, { marginTop: 14 }]} />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={fullAddress}
                  onChangeText={setFullAddress}
                  placeholder="Enter flat no, building, street name, area"
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top" />
              </View>

              {/* 📍 NEW: Pincode Field */}
              <Text style={styles.inputLabel} onLayout={(e) => fieldPositions.current['pincode'] = e.nativeEvent.layout.y}>PINCODE</Text>
              <View style={[styles.inputRow, errors.pincode && styles.inputError]}>
                <MaterialCommunityIcons name="map-marker-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={pincode}
                  onChangeText={(txt) => { setPincode(txt.replace(/[^0-9]/g, '')); setErrors(prev => ({ ...prev, pincode: '' })); }}
                  placeholder="e.g. 201301"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  maxLength={6} />
                {pincode.length === 6 && (
                  <MaterialCommunityIcons name="check-circle" size={18} color="#10B981" style={{ marginRight: 12 }} />
                )}
              </View>
              {errors.pincode && <Text style={styles.errorText}>{errors.pincode}</Text>}

              <Text style={styles.inputLabel}>NEAREST LANDMARK</Text>
              <View style={styles.inputRow}>
                <MaterialCommunityIcons name="compass-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={landmark}
                  onChangeText={setLandmark}
                  placeholder="e.g. Opp Metro Station"
                  placeholderTextColor="#94A3B8" />
              </View>

              <Text style={styles.inputLabel}>CITY / DISTRICT</Text>
              <View style={[styles.inputRow, styles.lockedRow]}>
                <MaterialCommunityIcons name="city" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: '#64748B' }]}
                  value={city}
                  editable={false} />
              </View>
              <Text style={styles.lockNotice}>Service area auto-locked based on delivery boundaries.</Text>
            </View>
          </View>
        )}

        {/* Submit Actions Button */}
        <TouchableOpacity style={styles.primaryUpdateBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.primaryUpdateBtnText}>Save Changes & Sync</Text>
          <MaterialCommunityIcons name="sync" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>

        <View style={{ height: 50 }} />
      </ScrollView>

      <CustomCalendarModal
        visible={isCalendarVisible}
        onClose={() => setIsCalendarVisible(false)}
        onSelectDate={setDob}
        initialDate={dob} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  saveBtnTop: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  saveTextTop: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tabsWrapper: {
    paddingTop: 20,
    paddingHorizontal: 20,
    backgroundColor: '#F8FAFC',
  },
  tabSegmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 16,
    padding: 4,
  },
  tabSegmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  tabSegmentBtnActive: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.soft,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
  },
  formSection: {
    width: '100%',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarFrame: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    ...SHADOWS.soft,
    elevation: 3,
    position: 'relative',
  },
  camBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCaption: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 8,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.soft,
    elevation: 3,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    height: 52,
  },
  lockedRow: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  textAreaRow: {
    height: 90,
    alignItems: 'flex-start',
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 12,
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 4,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  dateText: {
    lineHeight: 50, // Ensures centered vertical text in Touchable mode
  },
  placeholderDate: {
    color: '#94A3B8',
    fontWeight: '500',
  },
  textArea: {
    paddingTop: 14,
    paddingRight: 14,
  },
  lockNotice: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 5,
    fontStyle: 'italic',
    paddingLeft: 4,
  },
  gridBlock: {
    flexDirection: 'row',
    marginTop: 8,
  },
  selectionRow: {
    flexDirection: 'row',
    height: 48,
  },
  chip: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  chipTextActive: {
    color: COLORS.primary,
  },
  rolePicker: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  roleVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  primaryUpdateBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    ...SHADOWS.glow,
    elevation: 4,
  },
  primaryUpdateBtnText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // 🗓️ Custom Calendar Modal Layout
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  calendarSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '80%',
  },
  calSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calSheetHeadline: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E293B',
  },
  pickerSelectorsRow: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  pickerDropdownWrapper: {
    width: '100%',
  },
  monthsHScroll: {
    paddingRight: 20,
  },
  monthPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  monthPillActive: {
    backgroundColor: COLORS.primary,
  },
  monthPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  monthPillTextActive: {
    color: '#FFFFFF',
  },
  yearsHScroll: {
    paddingRight: 20,
  },
  yearPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  yearPillActive: {
    backgroundColor: COLORS.primary,
  },
  yearPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  yearPillTextActive: {
    color: '#FFFFFF',
  },
  daysMatrix: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  dayCell: {
    width: (width - 56) / 7, // Auto columns evenly
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  dayCellText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    textAlign: 'center',
    lineHeight: 32,
  },
});
