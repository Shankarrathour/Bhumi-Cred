import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Dimensions, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { useAuthStore, AuthRole } from '../../src/store/authStore';
import { englishOnlyMessage, getEnglishApiErrorMessage } from '../../src/utils/apiErrorMessage';

const { width } = Dimensions.get('window');

const RESEND_COOLDOWN = 30;

export default function OTPScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mobile = (params.mobile as string) || '';
  const flow = (params.flow as string) || '';
  const role = ((params.role as string) || 'farmer') as AuthRole;

  const verifyOtpStore = useAuthStore((state) => state.verifyOtp);
  const loginStore = useAuthStore((state) => state.login);
  const registerMobileStore = useAuthStore((state) => state.registerMobile);
  const isLoading = useAuthStore((state) => state.isLoading);
  const otpDebug = useAuthStore((state) => state.otpDebug);
  const insets = useSafeAreaInsets();

  const [otp, setOtp] = useState(['', '', '', '']);
  const [showNotification, setShowNotification] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Trigger floating SMS notification on load
  useEffect(() => {
    const timer = setTimeout(() => setShowNotification(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Countdown timer — decrements every second while > 0
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 4) return;

    try {
      const success = await verifyOtpStore(otpValue);
      if (success) {
        const currentRole = useAuthStore.getState().role;

        if (currentRole === 'govt_body' || currentRole === 'partner') {
          // Govt body and Partner route straight to main tabs
          useAuthStore.setState({ isAuthenticated: true });
          router.replace('/(tabs)');
          return;
        }

        // ── Farmer path — unchanged behavior ──────────────────────────────
        if (flow === 'login') {
          // Login flow: user has valid tokens — mark authenticated and go straight to dashboard.
          // verificationStatus is KYC state, not a login gate; pending/rejected users can still use the app.
          useAuthStore.setState({ isAuthenticated: true });
          router.replace('/(tabs)');
        } else {
          // Register flow: route by KYC/verification status (unverified users need onboarding).
          const currentStatus = useAuthStore.getState().user?.verificationStatus || 'unverified';
          if (currentStatus === 'approved') {
            router.replace('/(tabs)');
          } else {
            router.replace('/onboarding');
          }
        }
      } else {
        const errorMsg = englishOnlyMessage(useAuthStore.getState().error, 'Invalid OTP. Please try again.');
        Alert.alert('Verification Failed', errorMsg);
      }
    } catch (err) {
      Alert.alert('Error', 'Verification failed due to connection error.');
    }
  };

  const handleResend = async () => {
    if (isResending || countdown > 0) return;

    setIsResending(true);
    try {
      if (flow === 'login') {
        await loginStore(mobile, role);
      } else {
        await registerMobileStore(mobile, role);
      }

      // Clear the existing OTP digits so user enters the new code
      setOtp(['', '', '', '']);
      inputRefs.current[0]?.focus();

      // Restart the cooldown and re-show the SMS notification with the new OTP
      setCountdown(RESEND_COOLDOWN);
      setShowNotification(true);

      Alert.alert('OTP Sent', 'A new verification code has been sent to your phone.');
    } catch (err: any) {
      Alert.alert('Resend Failed', getEnglishApiErrorMessage(err, 'Unable to resend OTP. Please try again.'));
    } finally {
      setIsResending(false);
    }
  };

  const resendDisabled = isResending || countdown > 0;

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

      {/* Floating Simulated SMS Notification */}
      {showNotification && (
        <View style={[styles.smsNotificationContainer, { top: insets.top > 0 ? insets.top + 10 : (Platform.OS === 'ios' ? 50 : 20) }]} pointerEvents="box-none">
          <View style={styles.smsNotification}>
            <View style={styles.smsIcon}>
              <MaterialCommunityIcons name="message-processing" size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.smsHeader}>SMS • BhumiCred Secure</Text>
              <Text style={styles.smsBody}>Your verification code is {otpDebug ?? '----'}. Do not share this with anyone.</Text>
            </View>
            <TouchableOpacity onPress={() => setShowNotification(false)}>
              <MaterialCommunityIcons name="close" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>

        <View style={styles.cardWrapper}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="shield-key-outline" size={36} color={COLORS.primary} />
          </View>

          <View style={styles.headerContainer}>
            <Text style={styles.title}>Enter OTP</Text>
            <Text style={styles.subtitle}>
              We sent a 4-digit verification code to +91 {mobile}
            </Text>
          </View>

          <View style={styles.contentWrapper}>
            {/* OTP Inputs */}
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => { inputRefs.current[index] = ref; }}
                  style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
                  maxLength={1}
                  keyboardType="number-pad"
                  value={digit}
                  onChangeText={(val) => handleOtpChange(val, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, (isLoading || otp.join('').length !== 4) && styles.buttonDisabled]}
              onPress={handleVerify}
              disabled={isLoading || otp.join('').length !== 4}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.primaryDark} />
              ) : (
                <Text style={styles.primaryButtonText}>Verify & Proceed</Text>
              )}
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn&apos;t receive the code? </Text>
              <TouchableOpacity
                onPress={handleResend}
                disabled={resendDisabled}
                activeOpacity={0.7}
              >
                {isResending ? (
                  <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 2 }} />
                ) : countdown > 0 ? (
                  <Text style={styles.resendCountdown}>Resend in {countdown}s</Text>
                ) : (
                  <Text style={styles.resendLink}>Resend</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    ...SHADOWS.soft,
  },
  smsNotificationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  smsNotification: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.glow,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  smsIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F766E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  smsHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  smsBody: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
    fontWeight: '500',
  },
  cardWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 36,
    paddingHorizontal: 24,
    ...SHADOWS.soft,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textDark,
    marginBottom: 8,
    fontWeight: '800',
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  contentWrapper: {
    width: '100%',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 36,
    paddingHorizontal: 8,
  },
  otpInput: {
    width: width > 360 ? 60 : 52,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.8,
    borderColor: '#E2E8F0',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  otpInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0FDF4',
  },
  primaryButton: {
    backgroundColor: COLORS.accent, // Lime background
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.limeGlow,
  },
  buttonDisabled: {
    opacity: 0.5,
    backgroundColor: '#94A3B8',
  },
  primaryButtonText: {
    fontSize: 16,
    color: COLORS.primaryDark,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  resendText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  resendLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '800',
  },
  resendCountdown: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});
