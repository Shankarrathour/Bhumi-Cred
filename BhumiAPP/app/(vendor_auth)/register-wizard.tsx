import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { useAuthStore } from '../../src/store/authStore';
import AutocompleteDropdown from '../../components/AutocompleteDropdown';
import CustomCalendarModal from '../../components/CustomCalendarModal';
import DocumentUploadField from '../../src/components/DocumentUploadField';
import { LOCATION_DATA } from '../../src/data/locations';
import {
  isValidEmail,
  isOnlyLettersAndSpaces,
  isValidAddressText,
  isValidBusinessName,
  isValidAadhaar,
  isValidPAN,
  isValidDrivingLicence,
  isValidVoterId,
  isValidPincode,
  isNonNegativeInteger,
} from '../../src/utils/validation';

const TOTAL_STEPS = 5;
const STEP_TITLES = ['Personal Details', 'Business Details', 'Business Address', 'KYC', 'Review & Submit'];
const IDENTITY_TYPES = ['Aadhaar', 'PAN', 'Driving Licence', 'Voter ID'] as const;
type IdentityType = typeof IDENTITY_TYPES[number];
const GENDERS = ['Male', 'Female', 'Other'] as const;

type FieldProps = {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  autoCapitalize?: 'none' | 'words' | 'characters';
  maxLength?: number;
  multiline?: boolean;
};

function FormField({ label, icon, multiline, ...inputProps }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputContainer, multiline && styles.inputContainerMultiline]}>
        <MaterialCommunityIcons name={icon} size={20} color={COLORS.textSecondary} style={styles.icon} />
        <TextInput
          {...inputProps}
          style={[styles.input, multiline && styles.inputMultiline]}
          placeholderTextColor="#94A3B8"
          autoCapitalize={inputProps.autoCapitalize ?? 'words'}
          multiline={multiline}
        />
      </View>
    </View>
  );
}

function isoToDisplayDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}

function displayDateToIso(display: string): string | undefined {
  const parts = display.split('/');
  if (parts.length !== 3) return undefined;
  const [day, month, year] = parts;
  const d = new Date(Number(year), Number(month) - 1, Number(day));
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export default function VendorRegisterWizardScreen() {
  const router = useRouter();
  const vendor = useAuthStore((state) => state.vendor);
  const updateVendorProfile = useAuthStore((state) => state.updateVendorProfile);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [step, setStep] = useState(1);

  // Step 1: Personal Details
  const [name, setName] = useState(vendor?.name || '');
  const [fatherName, setFatherName] = useState(vendor?.fatherName || '');
  const [email, setEmail] = useState(vendor?.email || '');
  const [dob, setDob] = useState(isoToDisplayDate(vendor?.dob));
  const [showCalendar, setShowCalendar] = useState(false);
  const [gender, setGender] = useState<string>(vendor?.gender ? vendor.gender.charAt(0).toUpperCase() + vendor.gender.slice(1) : '');
  const [photoUrl, setPhotoUrl] = useState<string | null>(vendor?.profilePhotoUrl || null);

  // Step 2: Business Details
  const [businessName, setBusinessName] = useState(vendor?.businessName || '');
  const [gstNumber, setGstNumber] = useState(vendor?.gstNumber || '');
  const [yearsOfExperience, setYearsOfExperience] = useState(vendor?.yearsOfExperience != null ? String(vendor.yearsOfExperience) : '');
  const [businessDescription, setBusinessDescription] = useState(vendor?.businessDescription || '');

  // Step 3: Business Address
  const [stateName, setStateName] = useState(vendor?.state || '');
  const [district, setDistrict] = useState(vendor?.district || '');
  const [tehsil, setTehsil] = useState(vendor?.tehsil || '');
  const [gramPanchayat, setGramPanchayat] = useState(vendor?.gramPanchayat || '');
  const [villageCity, setVillageCity] = useState(vendor?.villageCity || '');
  const [pincode, setPincode] = useState(vendor?.pincode || '');
  const [completeAddress, setCompleteAddress] = useState(vendor?.address || '');
  const [geoCoords, setGeoCoords] = useState<{ latitude: number; longitude: number } | null>(
    vendor?.latitude != null && vendor?.longitude != null ? { latitude: vendor.latitude, longitude: vendor.longitude } : null
  );
  const [gpsLoading, setGpsLoading] = useState(false);

  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  useEffect(() => {
    setAvailableStates(Object.keys(LOCATION_DATA['India'] || {}));
  }, []);

  useEffect(() => {
    if (stateName && LOCATION_DATA['India']?.[stateName]) {
      setAvailableDistricts(Object.keys(LOCATION_DATA['India'][stateName]));
    } else {
      setAvailableDistricts([]);
    }
  }, [stateName]);

  useEffect(() => {
    if (stateName && district && LOCATION_DATA['India']?.[stateName]?.[district]) {
      setAvailableCities(LOCATION_DATA['India'][stateName][district]);
    } else {
      setAvailableCities([]);
    }
  }, [stateName, district]);

  const handleFetchGPS = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'GPS permission is required to capture your location.');
        setGpsLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      setGeoCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } catch {
      Alert.alert('Error', 'Failed to fetch current location.');
    } finally {
      setGpsLoading(false);
    }
  };

  // Step 4: KYC
  const [identityType, setIdentityType] = useState<IdentityType>((vendor?.kycIdentityType as IdentityType) || 'Aadhaar');
  const [identityNumber, setIdentityNumber] = useState(vendor?.kycIdentityNumber || '');
  const [docFrontUrl, setDocFrontUrl] = useState<string | null>(vendor?.kycDocumentFrontUrl || null);
  const [docBackUrl, setDocBackUrl] = useState<string | null>(vendor?.kycDocumentBackUrl || null);

  // Step 5: Review & Submit
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [confirmCorrect, setConfirmCorrect] = useState(false);

  const validateStep = (): string | null => {
    if (step === 1) {
      if (!name.trim()) return 'Please enter your full name.';
      if (!isOnlyLettersAndSpaces(name)) return 'Full Name cannot contain numbers.';
      if (!fatherName.trim()) return "Please enter your father's name.";
      if (!isOnlyLettersAndSpaces(fatherName)) return 'Father Name cannot contain numbers.';
      if (email.trim() && !isValidEmail(email)) return 'Please enter a valid email address.';
      if (!photoUrl) return 'Please upload your vendor profile photo.';
    } else if (step === 2) {
      if (!businessName.trim()) return 'Please enter your business name.';
      if (!isValidBusinessName(businessName)) return 'Business Name can only contain letters, numbers, and spaces.';
      if (yearsOfExperience.trim() && !isNonNegativeInteger(yearsOfExperience)) {
        return 'Years of Experience must be a valid non-negative number.';
      }
    } else if (step === 3) {
      if (!stateName.trim()) return 'Please select your state.';
      if (!isValidAddressText(stateName)) return 'State cannot contain numbers.';
      if (!district.trim()) return 'Please select your district.';
      if (!isValidAddressText(district)) return 'District cannot contain numbers.';
      if (tehsil.trim() && !isValidAddressText(tehsil)) return 'Tehsil / Block cannot contain numbers.';
      if (gramPanchayat.trim() && !isValidAddressText(gramPanchayat)) return 'Gram Panchayat cannot contain numbers.';
      if (!villageCity.trim()) return 'Please enter your village/city.';
      if (!isValidAddressText(villageCity)) return 'Village / City cannot contain numbers.';
      if (!isValidPincode(pincode)) return 'Please enter a valid 6-digit PIN code.';
      if (!completeAddress.trim()) return 'Please enter your complete address.';
      if (!geoCoords) return 'Please capture your current location (GPS).';
    } else if (step === 4) {
      if (!identityNumber.trim()) return `Please enter your ${identityType} number.`;
      if (identityType === 'Aadhaar' && !isValidAadhaar(identityNumber)) return 'Please enter a valid Aadhaar Number.';
      if (identityType === 'PAN' && !isValidPAN(identityNumber)) return 'PAN Number must be in ABCDE1234F format.';
      if (identityType === 'Driving Licence' && !isValidDrivingLicence(identityNumber)) return 'Please enter a valid Driving Licence Number.';
      if (identityType === 'Voter ID' && !isValidVoterId(identityNumber)) return 'Please enter a valid Voter ID Number.';
      if (!docFrontUrl) return `Please upload your ${identityType} document.`;
    }
    return null;
  };

  const handleNext = () => {
    const error = validateStep();
    if (error) {
      Alert.alert('Incomplete', error);
      return;
    }
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    const success = await updateVendorProfile({
      name,
      fatherName,
      email: email || undefined,
      dob: displayDateToIso(dob),
      gender: gender ? gender.toLowerCase() : undefined,
      businessName,
      gstNumber,
      yearsOfExperience: yearsOfExperience ? Number(yearsOfExperience) : undefined,
      businessDescription,
      address: completeAddress,
      state: stateName,
      district,
      tehsil,
      gramPanchayat,
      villageCity,
      pincode,
      latitude: geoCoords?.latitude,
      longitude: geoCoords?.longitude,
      kycIdentityType: identityType,
      kycIdentityNumber: identityNumber,
    });
    if (success) {
      router.replace('/(vendor_auth)/pending');
    } else {
      const err = useAuthStore.getState().error;
      Alert.alert('Submission Failed', err || 'Unable to submit your details. Please try again.');
    }
  };

  const canSubmit = agreeTerms && agreePrivacy && confirmCorrect;

  const docFieldLabels: Record<IdentityType, string> = {
    Aadhaar: 'Aadhaar',
    PAN: 'PAN Card',
    'Driving Licence': 'Driving Licence',
    'Voter ID': 'Voter ID',
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backCircle} onPress={handleBack} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-left" size={26} color="#334155" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.stepTitle}>Step {step} of {TOTAL_STEPS}: {STEP_TITLES[step - 1]}</Text>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          {step === 1 && (
            <>
              <FormField label="Full Name *" icon="account-outline" placeholder="Enter your name" value={name} onChangeText={setName} />
              <FormField label="Father Name *" icon="account-child-outline" placeholder="Enter father's name" value={fatherName} onChangeText={setFatherName} />
              <FormField label="Email Address" icon="email-outline" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

              <View style={styles.field}>
                <Text style={styles.label}>Date of Birth</Text>
                <TouchableOpacity style={styles.inputContainer} onPress={() => setShowCalendar(true)} activeOpacity={0.8}>
                  <MaterialCommunityIcons name="calendar-outline" size={20} color={COLORS.textSecondary} style={styles.icon} />
                  <Text style={[styles.input, { paddingVertical: 14 }, !dob && { color: '#94A3B8' }]}>{dob || 'Select date of birth'}</Text>
                </TouchableOpacity>
              </View>
              <CustomCalendarModal visible={showCalendar} onClose={() => setShowCalendar(false)} onSelectDate={setDob} initialDate={dob} />

              <View style={styles.field}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.pillRow}>
                  {GENDERS.map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.pillOption, gender === g && styles.pillOptionActive]}
                      onPress={() => setGender(g)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.pillText, gender === g && styles.pillTextActive]}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <DocumentUploadField
                label="Vendor Profile Photo"
                required
                value={photoUrl}
                onUploaded={setPhotoUrl}
                uploadUrl="/vendor/auth/photo"
                icon="account-box-outline"
              />
            </>
          )}

          {step === 2 && (
            <>
              <FormField label="Business Name *" icon="store-outline" placeholder="Enter store name" value={businessName} onChangeText={setBusinessName} />
              <FormField label="GST Number (Optional)" icon="file-document-outline" placeholder="Enter GST number" value={gstNumber} onChangeText={setGstNumber} autoCapitalize="characters" />
              <FormField label="Years of Experience" icon="chart-line" placeholder="e.g. 5" value={yearsOfExperience} onChangeText={setYearsOfExperience} keyboardType="numeric" />
              <FormField label="Business Description" icon="text-long" placeholder="Tell us about your business" value={businessDescription} onChangeText={setBusinessDescription} multiline />
            </>
          )}

          {step === 3 && (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>State *</Text>
                <AutocompleteDropdown data={availableStates} value={stateName} onChangeText={(v) => { setStateName(v); setDistrict(''); setVillageCity(''); }} placeholder="Select state" />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>District *</Text>
                <AutocompleteDropdown data={availableDistricts} value={district} onChangeText={(v) => { setDistrict(v); setVillageCity(''); }} placeholder="Select district" />
              </View>
              <FormField label="Tehsil / Block" icon="map-outline" placeholder="Enter tehsil / block" value={tehsil} onChangeText={setTehsil} />
              <FormField label="Gram Panchayat" icon="home-city-outline" placeholder="Enter gram panchayat" value={gramPanchayat} onChangeText={setGramPanchayat} />
              <View style={styles.field}>
                <Text style={styles.label}>Village / City *</Text>
                <AutocompleteDropdown data={availableCities} value={villageCity} onChangeText={setVillageCity} placeholder="Select or enter village / city" />
              </View>
              <FormField label="PIN Code *" icon="map-marker-radius-outline" placeholder="6-digit PIN code" value={pincode} onChangeText={(t) => setPincode(t.replace(/[^0-9]/g, ''))} keyboardType="numeric" maxLength={6} />
              <FormField label="Complete Address *" icon="map-marker-outline" placeholder="House no, street, landmark" value={completeAddress} onChangeText={setCompleteAddress} multiline />

              <View style={styles.field}>
                <Text style={styles.label}>Current Location (GPS) *</Text>
                <TouchableOpacity style={styles.gpsBtn} onPress={handleFetchGPS} disabled={gpsLoading} activeOpacity={0.8}>
                  {gpsLoading ? (
                    <ActivityIndicator color={COLORS.primary} />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="crosshairs-gps" size={20} color={COLORS.primary} />
                      <Text style={styles.gpsBtnText}>{geoCoords ? 'Location captured — Tap to refresh' : 'Use Current Location'}</Text>
                    </>
                  )}
                </TouchableOpacity>
                {geoCoords && (
                  <Text style={styles.gpsCoords}>{geoCoords.latitude.toFixed(5)}, {geoCoords.longitude.toFixed(5)}</Text>
                )}
              </View>
            </>
          )}

          {step === 4 && (
            <>
              <Text style={styles.label}>Identity Document Type</Text>
              <View style={styles.pillRow}>
                {IDENTITY_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.pillOption, styles.pillOptionWide, identityType === type && styles.pillOptionActive]}
                    onPress={() => { setIdentityType(type); setIdentityNumber(''); setDocFrontUrl(null); setDocBackUrl(null); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.pillText, identityType === type && styles.pillTextActive]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <FormField
                label={`${identityType} Number *`}
                icon="card-account-details-outline"
                placeholder={`Enter ${identityType} number`}
                value={identityNumber}
                onChangeText={setIdentityNumber}
                autoCapitalize="characters"
              />

              <DocumentUploadField
                label={`Upload ${docFieldLabels[identityType]}${identityType === 'Aadhaar' ? ' Front' : ''}`}
                required
                value={docFrontUrl}
                onUploaded={setDocFrontUrl}
                uploadUrl="/vendor/auth/kyc-document"
                extraFields={{ slot: 'front' }}
                icon="file-document-outline"
              />

              {identityType === 'Aadhaar' && (
                <DocumentUploadField
                  label="Upload Aadhaar Back"
                  value={docBackUrl}
                  onUploaded={setDocBackUrl}
                  uploadUrl="/vendor/auth/kyc-document"
                  extraFields={{ slot: 'back' }}
                  icon="file-document-outline"
                />
              )}
            </>
          )}

          {step === 5 && (
            <View>
              <Text style={styles.reviewIntro}>Please review your details before submitting.</Text>

              <Text style={styles.reviewSectionTitle}>Personal Details</Text>
              {[
                { label: 'Full Name', value: name },
                { label: "Father's Name", value: fatherName },
                { label: 'Email', value: email || '—' },
                { label: 'Date of Birth', value: dob || '—' },
                { label: 'Gender', value: gender || '—' },
                { label: 'Profile Photo', value: photoUrl ? 'Uploaded' : 'Not uploaded' },
              ].map((row) => (
                <View key={row.label} style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>{row.label}</Text>
                  <Text style={styles.reviewValue}>{row.value}</Text>
                </View>
              ))}

              <Text style={styles.reviewSectionTitle}>Business Details</Text>
              {[
                { label: 'Business Name', value: businessName },
                { label: 'GST Number', value: gstNumber || '—' },
                { label: 'Years of Experience', value: yearsOfExperience || '—' },
                { label: 'Business Description', value: businessDescription || '—' },
              ].map((row) => (
                <View key={row.label} style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>{row.label}</Text>
                  <Text style={styles.reviewValue}>{row.value}</Text>
                </View>
              ))}

              <Text style={styles.reviewSectionTitle}>Business Address</Text>
              {[
                { label: 'State', value: stateName },
                { label: 'District', value: district },
                { label: 'Tehsil / Block', value: tehsil || '—' },
                { label: 'Gram Panchayat', value: gramPanchayat || '—' },
                { label: 'Village / City', value: villageCity },
                { label: 'PIN Code', value: pincode },
                { label: 'Complete Address', value: completeAddress },
                { label: 'GPS Location', value: geoCoords ? `${geoCoords.latitude.toFixed(5)}, ${geoCoords.longitude.toFixed(5)}` : '—' },
              ].map((row) => (
                <View key={row.label} style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>{row.label}</Text>
                  <Text style={styles.reviewValue}>{row.value}</Text>
                </View>
              ))}

              <Text style={styles.reviewSectionTitle}>KYC Details</Text>
              {[
                { label: 'Identity Type', value: identityType },
                { label: 'Identity Number', value: identityNumber },
                { label: 'Document Front', value: docFrontUrl ? 'Uploaded' : 'Not uploaded' },
                ...(identityType === 'Aadhaar' ? [{ label: 'Document Back', value: docBackUrl ? 'Uploaded' : 'Not uploaded' }] : []),
              ].map((row) => (
                <View key={row.label} style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>{row.label}</Text>
                  <Text style={styles.reviewValue}>{row.value}</Text>
                </View>
              ))}

              <View style={styles.checkboxSection}>
                {[
                  { checked: agreeTerms, toggle: () => setAgreeTerms((v) => !v), label: 'I agree to the Terms & Conditions' },
                  { checked: agreePrivacy, toggle: () => setAgreePrivacy((v) => !v), label: 'I agree to the Privacy Policy' },
                  { checked: confirmCorrect, toggle: () => setConfirmCorrect((v) => !v), label: 'I confirm that the information provided is correct.' },
                ].map((row) => (
                  <TouchableOpacity key={row.label} style={styles.checkboxRow} onPress={row.toggle} activeOpacity={0.8}>
                    <MaterialCommunityIcons
                      name={row.checked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                      size={22}
                      color={row.checked ? COLORS.primary : '#94A3B8'}
                    />
                    <Text style={styles.checkboxLabel}>{row.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.actionBtn, (isLoading || (step === TOTAL_STEPS && !canSubmit)) && styles.btnDisabled]}
            onPress={step === TOTAL_STEPS ? handleSubmit : handleNext}
            disabled={isLoading || (step === TOTAL_STEPS && !canSubmit)}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.actionBtnText}>{step === TOTAL_STEPS ? 'Submit for Verification' : 'Continue'}</Text>
                <MaterialCommunityIcons name={step === TOTAL_STEPS ? 'check-circle-outline' : 'arrow-right'} size={18} color="#FFFFFF" style={styles.buttonIcon} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 16 },
  backCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', ...SHADOWS.soft },
  stepTitle: { fontSize: 13, fontWeight: '800', color: COLORS.textDark, marginBottom: 8 },
  progressBarTrack: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 28, padding: 24, borderWidth: 1, borderColor: '#E2E8F0', ...SHADOWS.soft },
  field: { marginBottom: 16 },
  label: { ...TYPOGRAPHY.caption, color: '#334155', marginBottom: 7, marginLeft: 4, fontWeight: '700' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', minHeight: 52, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  inputContainerMultiline: { alignItems: 'flex-start', paddingVertical: 12 },
  icon: { marginRight: 10, marginTop: 2 },
  input: { flex: 1, ...TYPOGRAPHY.body, color: '#0F172A', minHeight: 50 },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16, gap: 10 },
  pillOption: { flexGrow: 1, minWidth: '28%', height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 },
  pillOptionWide: { minWidth: '47%' },
  pillOptionActive: { borderColor: COLORS.primary, backgroundColor: '#F0FDF4' },
  pillText: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, textAlign: 'center' },
  pillTextActive: { color: COLORS.primary },
  gpsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 52, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.primary, backgroundColor: '#F0FDF4' },
  gpsBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  gpsCoords: { marginTop: 6, marginLeft: 4, fontSize: 12, color: COLORS.textSecondary },
  reviewIntro: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, marginBottom: 10, lineHeight: 20 },
  reviewSectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.primary, marginTop: 18, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 },
  reviewRow: { borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingVertical: 12 },
  reviewLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 0.4, marginBottom: 3 },
  reviewValue: { fontSize: 15, fontWeight: '600', color: COLORS.textDark },
  checkboxSection: { marginTop: 20, gap: 14 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkboxLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.textDark },
  actionBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary, height: 56, borderRadius: 16, marginTop: 8, ...SHADOWS.glow },
  btnDisabled: { opacity: 0.65 },
  actionBtnText: { fontSize: 16, color: '#FFFFFF', fontWeight: '800', letterSpacing: 0.3 },
  buttonIcon: { marginLeft: 8 },
});
