import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../theme/theme';

import { AuthRole } from '../store/authStore';
export type { AuthRole };

interface RoleSelectFieldProps {
  value: AuthRole;
  onChange: (role: AuthRole) => void;
  /** "Login" or "Register" — produces "Login as Farmer" / "Register as Partner" */
  actionLabel: 'Login' | 'Register';
}

const ROLE_OPTIONS: { value: AuthRole; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { value: 'farmer', label: 'Farmer', icon: 'sprout-outline' },
  { value: 'govt_body', label: 'Govt Body', icon: 'bank-outline' },
  { value: 'partner', label: 'Partner', icon: 'handshake-outline' },
];

/**
 * Shared Role dropdown used by both the unified Login and Register screens.
 * Follows the app's established "pressable field opens a modal list" pattern
 * (same as MaterialDatePickerModal / LocationPickerModal) rather than a native
 * picker, since no dropdown/select component exists in the project yet.
 */
export const RoleSelectField: React.FC<RoleSelectFieldProps> = ({ value, onChange, actionLabel }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selected = ROLE_OPTIONS.find((o) => o.value === value) ?? ROLE_OPTIONS[0];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Role</Text>
      <TouchableOpacity
        style={styles.field}
        activeOpacity={0.75}
        onPress={() => setIsOpen(true)}
      >
        <MaterialCommunityIcons name={selected.icon} size={20} color={COLORS.textSecondary} style={styles.icon} />
        <Text style={styles.valueText}>{actionLabel} as {selected.label}</Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setIsOpen(false)}>
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.sheetTitle}>Select Role</Text>
            {ROLE_OPTIONS.map((opt) => {
              const active = opt.value === value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.option, active && styles.optionActive]}
                  activeOpacity={0.75}
                  onPress={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                >
                  <MaterialCommunityIcons
                    name={opt.icon}
                    size={22}
                    color={active ? COLORS.primary : COLORS.textSecondary}
                  />
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>
                    {actionLabel} as {opt.label}
                  </Text>
                  {active && (
                    <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.primary} style={styles.checkIcon} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textDark,
    marginBottom: 6,
    fontWeight: '600',
    marginLeft: 4,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  icon: {
    marginRight: 10,
  },
  valueText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    ...SHADOWS.glow,
  },
  sheetTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textDark,
    fontWeight: '800',
    marginBottom: 14,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    marginBottom: 10,
  },
  optionActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0FDF4',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
    marginLeft: 12,
  },
  optionTextActive: {
    color: COLORS.primary,
  },
  checkIcon: {
    marginLeft: 'auto',
  },
});
