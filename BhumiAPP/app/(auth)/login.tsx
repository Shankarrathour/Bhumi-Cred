import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { useAuthStore, AuthRole } from '../../src/store/authStore';
import { getEnglishApiErrorMessage } from '../../src/utils/apiErrorMessage';
import { RoleSelectField } from '../../src/components/RoleSelectField';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState<AuthRole>('farmer');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSendOtp = async () => {
    setErrors({});
    if (!mobile || mobile.length !== 10) {
      setErrors({ mobile: 'Please enter a valid 10-digit mobile number.' });
      return;
    }

    try {
      await login(mobile, role);
      router.push({
        pathname: '/(auth)/otp',
        params: { mobile, flow: 'login', role },
      });
    } catch (err: any) {
      if ((err as any).code === 'MOBILE_NOT_REGISTERED') {
        Alert.alert(
          'Not Registered',
          'Mobile number is not registered. Please register first.',
          [
            { text: 'Register Now', onPress: () => router.push('/(auth)/register') },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      } else if ((err as any).code === 'ACCOUNT_ROLE_MISMATCH') {
        Alert.alert('Wrong Role Selected', err.message);
      } else {
        Alert.alert('Error', getEnglishApiErrorMessage(err, 'Unable to initiate login. Please try again.'));
      }
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Background Gradient */}
      <LinearGradient 
        colors={[COLORS.primary, COLORS.primaryDark]} 
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.glowSphere} />

      <View style={styles.content}>
        {/* Top Header Branding */}
        <View style={styles.headerBlock}>
          <View style={styles.logoBadge}>
            <MaterialCommunityIcons name="leaf" size={32} color={COLORS.accent} />
          </View>
          <Text style={styles.heroTitle}>BhumiCred</Text>
          <Text style={styles.heroSubtitle}>India's Farmer Sustainability Super App</Text>
        </View>

        {/* Credentials Entry Form */}
        <View style={styles.authCard}>
          <Text style={styles.cardHeader}>{role === 'vendor' ? 'Vendor Login' : 'Farmer Login'}</Text>

          <RoleSelectField value={role} onChange={setRole} actionLabel="Login" />

          <View style={[styles.inputContainer, errors.mobile ? styles.inputError : null]}>
            <MaterialCommunityIcons name="phone-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
            <TextInput 
              style={styles.textInput}
              placeholder="Enter 10 digit Mobile Number"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              maxLength={10}
              value={mobile}
              onChangeText={(text) => {
                setMobile(text);
                if (errors.mobile) setErrors({ ...errors, mobile: '' });
              }}
            />
          </View>
          {errors.mobile && <Text style={styles.errorText}>{errors.mobile}</Text>}

          <Text style={styles.otpHint}>We will send a 4-digit verification OTP</Text>

          <TouchableOpacity 
            style={[styles.submitBtn, isLoading && styles.btnDisabled]} 
            onPress={handleSendOtp}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.primaryDark} />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Get OTP</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color={COLORS.primaryDark} style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Language Help & Register footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>New User? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.registerLink}>Register Here</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.footer, { marginTop: 16 }]}>
          <MaterialCommunityIcons name="earth" size={16} color="rgba(255,255,255,0.7)" />
          <Text style={styles.footerText}> Available in Hindi & English</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glowSphere: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(132, 204, 22, 0.15)', // Lime Glow
    zIndex: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    zIndex: 1,
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 44,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  heroTitle: {
    ...TYPOGRAPHY.hero,
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent, // Lime subtitle
    opacity: 0.9,
    textAlign: 'center',
  },
  authCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    ...SHADOWS.glow,
  },
  cardHeader: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primaryDark,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    marginLeft: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  otpHint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 24,
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: COLORS.accent, // Lime Green CTA
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    ...SHADOWS.limeGlow,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    fontSize: 16,
    color: COLORS.primaryDark, // accessible high contrast text
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  registerLink: {
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});
