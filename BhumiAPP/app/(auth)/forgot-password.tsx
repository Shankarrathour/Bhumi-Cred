import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { COLORS, TYPOGRAPHY } from '../../src/theme/theme';
import { InputBox } from '../../src/components/InputBox';

const forgotPasswordSchema = yup.object().shape({
  mobile: yup.string()
    .required('Mobile number is required')
    .matches(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits'),
});

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const { control, handleSubmit } = useForm({
    resolver: yupResolver(forgotPasswordSchema),
    defaultValues: {
      mobile: '',
    },
  });

  const onSubmit = (data: any) => {
    setIsLoading(true);
    // Mock API Call
    setTimeout(() => {
      setIsLoading(false);
      setIsSent(true);
    }, 1500);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textDark} />
      </TouchableOpacity>

      <View style={styles.headerContainer}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter your mobile number and we'll send you instructions to reset your password.
        </Text>
      </View>

      {!isSent ? (
        <View style={styles.formContainer}>
          <InputBox
            control={control}
            name="mobile"
            label="Mobile Number"
            placeholder="Enter 10 digit mobile number"
            icon="phone-outline"
            keyboardType="numeric"
            maxLength={10}
          />

          <TouchableOpacity 
            style={[styles.primaryButton, isLoading && styles.buttonDisabled]} 
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.successContainer}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="check" size={40} color={COLORS.success} />
          </View>
          <Text style={styles.successTitle}>Check your phone</Text>
          <Text style={styles.successText}>
            We have sent a password reset link to your mobile number.
          </Text>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text style={styles.primaryButtonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
    flexGrow: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerContainer: {
    marginBottom: 40,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.textDark,
    marginBottom: 8,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: '#64748B',
    lineHeight: 22,
  },
  formContainer: {
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    marginTop: 20,
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    ...TYPOGRAPHY.subtitle,
    color: '#fff',
    fontWeight: 'bold',
  },
  successContainer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DCFCE7', // Green 100
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textDark,
    marginBottom: 12,
  },
  successText: {
    ...TYPOGRAPHY.body,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
});
