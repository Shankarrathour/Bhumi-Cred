import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { setFarmerDetails } from '../../src/store/slices/bookingSlice';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';

export default function FarmerDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  const [name, setName] = useState('');
  const [acres, setAcres] = useState('');
  const [farmingType, setFarmingType] = useState('Zero-Tillage');
  const [mobile, setMobile] = useState('');
  const [instructions, setInstructions] = useState('');

  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const isValid = name.trim().length > 2 && acres.trim().length > 0 && mobile.length === 10;

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style);
    }
  };

  const handleContinue = () => {
    if (isValid) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      dispatch(setFarmerDetails({
        name,
        acres,
        farmingType,
        mobile,
        instructions
      }));
      router.push('/checkout/payment');
    } else {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
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
        <Text style={styles.headerTitle}>Farmer & Land Info</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.formCard}>
          <Text style={styles.sectionHeading}>Landowner Details / भूमि स्वामी विवरण</Text>
          
          <Text style={styles.label}>Farmer Full Name / किसान का नाम *</Text>
          <TextInput 
            style={[styles.input, { borderColor: getBorderColor('name') }]} 
            placeholder="Enter landowner full name"
            placeholderTextColor={COLORS.textSecondary}
            value={name}
            onChangeText={setName}
            onFocus={() => setFocusedInput('name')}
            onBlur={() => setFocusedInput(null)}
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Land Size (Acres) *</Text>
              <TextInput 
                style={[styles.input, { borderColor: getBorderColor('acres') }]} 
                placeholder="e.g. 4.5"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numeric"
                value={acres}
                onChangeText={setAcres}
                onFocus={() => setFocusedInput('acres')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Farming Practice *</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.farmingTypeScroll}
              >
                {['Zero-Tillage', 'Organic', 'Mixed'].map((f) => (
                  <TouchableOpacity 
                    key={f} 
                    style={[styles.farmingTypeBtn, farmingType === f && styles.farmingTypeBtnActive]}
                    onPress={() => {
                      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                      setFarmingType(f);
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: farmingType === f }}
                  >
                    <Text style={[styles.farmingTypeText, farmingType === f && styles.farmingTypeTextActive]}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <Text style={styles.label}>Mobile Number / मोबाइल नंबर *</Text>
          <View style={[styles.phoneInputContainer, { borderColor: getBorderColor('mobile') }]}>
            <Text style={styles.countryCode}>+91</Text>
            <TextInput 
              style={styles.phoneInput} 
              placeholder="Enter 10-digit number"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="numeric"
              maxLength={10}
              value={mobile}
              onChangeText={setMobile}
              onFocus={() => setFocusedInput('mobile')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          <Text style={styles.label}>Land Visit / Drone Access Instructions (Optional)</Text>
          <TextInput 
            style={[styles.input, styles.textArea, { borderColor: getBorderColor('instructions') }]} 
            placeholder="Provide specific instructions for field soil sampling or drone flight paths..."
            placeholderTextColor={COLORS.textSecondary}
            multiline
            numberOfLines={4}
            value={instructions}
            onChangeText={setInstructions}
            onFocus={() => setFocusedInput('instructions')}
            onBlur={() => setFocusedInput(null)}
            textAlignVertical="top"
          />

        </View>

      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: 20 + insets.bottom }]}>
        <TouchableOpacity 
          style={[styles.continueBtn, !isValid && styles.continueBtnDisabled]} 
          disabled={!isValid}
          onPress={handleContinue}
          accessibilityRole="button"
          accessibilityLabel="Proceed to Payment"
        >
          <Text style={styles.continueBtnText}>Proceed to Payment</Text>
        </TouchableOpacity>
      </View>
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
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  sectionHeading: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primaryDark,
    fontWeight: '800',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: COLORS.textDark,
    fontWeight: '600',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  halfWidth: {
    width: '48%',
  },
  farmingTypeScroll: {
    flexDirection: 'row',
  },
  farmingTypeBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 6,
    height: 50,
    justifyContent: 'center',
  },
  farmingTypeBtnActive: {
    backgroundColor: '#E6F4EA',
    borderColor: COLORS.primary,
  },
  farmingTypeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  farmingTypeTextActive: {
    color: COLORS.primary,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    marginBottom: 20,
  },
  countryCode: {
    fontSize: 14,
    color: COLORS.textDark,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    borderRightWidth: 1.5,
    borderRightColor: COLORS.border,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  textArea: {
    height: 100,
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
  }
});
