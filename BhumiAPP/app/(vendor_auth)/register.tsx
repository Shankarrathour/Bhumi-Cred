import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS, TYPOGRAPHY } from '../../src/theme/theme';
import api from '../../src/api/apiClient';

type FieldProps = {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'words' | 'characters';
  optional?: boolean;
};

function FormField({ label, icon, optional, ...inputProps }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}{optional ? ' (Optional)' : ''}</Text>
      <View style={styles.inputContainer}>
        <MaterialCommunityIcons name={icon} size={20} color={COLORS.textSecondary} style={styles.icon} />
        <TextInput
          {...inputProps}
          style={styles.input}
          placeholderTextColor="#94A3B8"
          autoCapitalize={inputProps.autoCapitalize ?? 'words'}
        />
      </View>
    </View>
  );
}

export default function VendorRegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', business_name: '', phone: '', gst_number: '', address: '',
  });

  const updateField = (field: keyof typeof form) => (value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleRegister = async () => {
    if (!form.name || !form.business_name || !form.email || !form.password || !form.phone) {
      return Alert.alert('Missing details', 'Name, business name, email, password, and phone are required.');
    }

    setLoading(true);
    try {
      const res = await api.post('/vendor/auth/register', form);
      api.defaults.headers.common.Authorization = `Bearer ${res.data.access_token}`;
      Alert.alert('Registration successful', 'Your seller account is pending admin approval.');
      router.push('/(vendor_tabs)');
    } catch (err: any) {
      Alert.alert('Registration failed', err.response?.data?.detail || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backCircle} onPress={() => router.back()} activeOpacity={0.7}>
            <MaterialCommunityIcons name="chevron-left" size={26} color="#334155" />
          </TouchableOpacity>
          <View style={styles.sellerBadge}>
            <MaterialCommunityIcons name="storefront-outline" size={14} color="#059669" />
            <Text style={styles.sellerBadgeText}>SELLER PROFILE</Text>
          </View>
        </View>

        <View style={styles.introBlock}>
          <View style={styles.titleRow}>
            <View style={styles.titleIcon}><MaterialCommunityIcons name="storefront-plus-outline" size={24} color={COLORS.primary} /></View>
            <Text style={styles.mainTitle}>Join as a Vendor</Text>
          </View>
          <Text style={styles.introSubtitle}>Create your BhumiCred seller profile and start serving farmers.</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Business details</Text>
          <Text style={styles.cardSubtitle}>Enter the information customers will use to identify your store.</Text>

          <FormField label="Full name" placeholder="Enter your name" icon="account-outline" value={form.name} onChangeText={updateField('name')} />
          <FormField label="Business name" placeholder="Enter store name" icon="store-outline" value={form.business_name} onChangeText={updateField('business_name')} />
          <FormField label="Email address" placeholder="you@example.com" icon="email-outline" value={form.email} onChangeText={updateField('email')} keyboardType="email-address" autoCapitalize="none" />
          <FormField label="Phone number" placeholder="Enter 10 digit number" icon="phone-outline" value={form.phone} onChangeText={updateField('phone')} keyboardType="phone-pad" />
          <FormField label="Password" placeholder="Create a secure password" icon="lock-outline" value={form.password} onChangeText={updateField('password')} secureTextEntry autoCapitalize="none" />
          <FormField label="GST number" placeholder="Enter GST number" icon="file-document-outline" value={form.gst_number} onChangeText={updateField('gst_number')} autoCapitalize="characters" optional />
          <FormField label="Store address" placeholder="Enter business address" icon="map-marker-outline" value={form.address} onChangeText={updateField('address')} />

          <TouchableOpacity style={[styles.registerBtn, loading && styles.btnDisabled]} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <><Text style={styles.registerBtnText}>Create Seller Account</Text><MaterialCommunityIcons name="arrow-right" size={18} color="#FFFFFF" style={styles.buttonIcon} /></>}
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>By continuing, you agree to the BhumiCred seller verification process.</Text>
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Already have a vendor account? </Text>
          <TouchableOpacity onPress={() => router.replace('/(vendor_auth)/login')}><Text style={styles.footerLink}>Sign in</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 40 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  backCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', ...SHADOWS.soft },
  sellerBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  sellerBadgeText: { fontSize: 10, color: '#059669', fontWeight: '800', letterSpacing: 0.6 },
  introBlock: { marginBottom: 28, paddingLeft: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 9 },
  titleIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center' },
  mainTitle: { ...TYPOGRAPHY.h1, color: '#0F172A', fontWeight: '900', letterSpacing: -0.5 },
  introSubtitle: { ...TYPOGRAPHY.body, color: '#64748B', lineHeight: 22 },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 28, padding: 24, borderWidth: 1, borderColor: '#E2E8F0', ...SHADOWS.soft },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 5 },
  cardSubtitle: { ...TYPOGRAPHY.body, color: '#64748B', lineHeight: 20, marginBottom: 24 },
  field: { marginBottom: 16 },
  label: { ...TYPOGRAPHY.caption, color: '#334155', marginBottom: 7, marginLeft: 4, fontWeight: '700' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', minHeight: 52, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  icon: { marginRight: 10 },
  input: { flex: 1, ...TYPOGRAPHY.body, color: '#0F172A', minHeight: 50 },
  registerBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary, height: 56, borderRadius: 16, marginTop: 8, ...SHADOWS.glow },
  btnDisabled: { opacity: 0.65 },
  registerBtnText: { fontSize: 16, color: '#FFFFFF', fontWeight: '800', letterSpacing: 0.3 },
  buttonIcon: { marginLeft: 8 },
  disclaimer: { fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 24, paddingHorizontal: 24, lineHeight: 16, fontWeight: '500' },
  footerContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 28 },
  footerText: { fontSize: 14, color: '#64748B' },
  footerLink: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
});
