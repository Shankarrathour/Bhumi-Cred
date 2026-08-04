import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { InputBox } from '../../src/components/InputBox';
import { useAuthStore, AuthRole } from '../../src/store/authStore';
import { getEnglishApiErrorMessage } from '../../src/utils/apiErrorMessage';
import { RoleSelectField } from '../../src/components/RoleSelectField';

const registerSchema = yup.object().shape({
  mobile: yup.string()
    .required('Mobile number is required')
    .matches(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits'),
});

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const registerMobile = useAuthStore((state) => state.registerMobile);
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<AuthRole>('farmer');

  // Capture incoming params from OTP/WhatsApp flow securely
  const prefilledMobile = (params?.mobile as string) || '';

  const { control, handleSubmit, setValue } = useForm({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      mobile: prefilledMobile,
    },
  });

  // Ensure reactive parameters trigger dynamic field pre-fills cleanly
  useEffect(() => {
    if (prefilledMobile) {
      setValue('mobile', prefilledMobile);
    }
  }, [prefilledMobile]);

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await registerMobile(data.mobile, role);
      router.replace({
        pathname: '/(auth)/otp',
        params: { mobile: data.mobile, role },
      });
    } catch (err: any) {
      if ((err as any).code === 'MOBILE_ALREADY_REGISTERED') {
        Alert.alert(
          'Already Registered',
          'Mobile number is already registered. Please login.',
          [
            { text: 'Go to Login', onPress: () => router.replace('/(auth)/login') },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      } else if ((err as any).code === 'ACCOUNT_ROLE_MISMATCH') {
        Alert.alert('Wrong Role Selected', err.message);
      } else {
        Alert.alert('Registration Failed', getEnglishApiErrorMessage(err, 'Unable to send OTP. Please try again.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Navigation */}
        <View style={styles.topBar}>
          <TouchableOpacity 
            style={styles.backCircle} 
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="chevron-left" size={26} color="#334155" />
          </TouchableOpacity>
          {prefilledMobile.length > 0 && (
            <View style={styles.verifiedBadge}>
              <MaterialCommunityIcons name="check-decagram" size={14} color="#10B981" style={{ marginRight: 4 }} />
              <Text style={styles.verifiedBadgeText}>Number Verified</Text>
            </View>
          )}
        </View>

        {/* Header Text Info */}
        <View style={styles.introBlock}>
          <Text style={styles.mainTitle}>Create Account</Text>
          <Text style={styles.introSubtitle}>
            {role === 'vendor'
              ? 'Set up your BhumiCred seller profile to start serving farmers.'
              : 'Complete your BhumiCred climate-tech farmer profile in 30 seconds.'}
          </Text>
        </View>

        {/* Premium Registration Card Wrapper */}
        <View style={styles.formCard}>
          <RoleSelectField value={role} onChange={setRole} actionLabel="Register" />

          <View style={{ marginBottom: 28 }}>
            <InputBox
              control={control}
              name="mobile"
              label="Mobile Contact"
              placeholder="Enter 10 digit number"
              icon="phone-check-outline"
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          <TouchableOpacity 
            style={[styles.registerBtn, isLoading && styles.btnDisabled]} 
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.registerBtnText}>Confirm & Register</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color="#FFF" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Subtle Terms Note */}
        <Text style={styles.disclaimer}>
          By registering, you agree to BhumiCred Privacy Policies.
        </Text>

        {/* Sign In Alternate Route Footer */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Already verified member? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  meshOverlayTop: {
    position: 'absolute',
    top: -90,
    right: -90,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(13, 148, 136, 0.05)',
    zIndex: -1,
  },
  meshOverlayBottom: {
    position: 'absolute',
    bottom: -100,
    left: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    zIndex: -1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  backCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.soft,
    elevation: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  verifiedBadgeText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '700',
  },
  introBlock: {
    marginBottom: 32,
    paddingLeft: 4,
  },
  mainTitle: {
    ...TYPOGRAPHY.h1,
    color: '#0F172A',
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  introSubtitle: {
    ...TYPOGRAPHY.body,
    color: '#64748B',
    lineHeight: 22,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.soft,
    elevation: 3,
  },
  registerBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    ...SHADOWS.glow,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  registerBtnText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  disclaimer: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 32,
    lineHeight: 16,
    fontWeight: '500',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 36,
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
});
