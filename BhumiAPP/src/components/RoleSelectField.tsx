import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/theme';

import { AuthRole } from '../store/authStore';
export type { AuthRole };

interface RoleSelectFieldProps {
  value?: AuthRole | '' | null;
  onChange: (role: AuthRole) => void;
  actionLabel?: 'Login' | 'Register';
  placeholder?: string;
  error?: string;
}

const ROLE_OPTIONS: {
  value: AuthRole;
  label: string;
  subtitle: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconBg: string;
  iconColor: string;
}[] = [
  {
    value: 'farmer',
    label: 'Farmer',
    subtitle: 'Access land registration, soil tests & carbon credits.',
    icon: 'sprout-outline',
    iconBg: '#E8F5E9',
    iconColor: '#2E7D32',
  },
  {
    value: 'govt_body',
    label: 'Govt Body',
    subtitle: 'Verify schemes, subsidies & government program access.',
    icon: 'bank-outline',
    iconBg: '#E3F2FD',
    iconColor: '#1565C0',
  },
  {
    value: 'partner',
    label: 'Partner',
    subtitle: 'Collaborate on climate projects & earn commissions.',
    icon: 'handshake-outline',
    iconBg: '#F3E5F5',
    iconColor: '#6A1B9A',
  },
];

export const RoleSelectField: React.FC<RoleSelectFieldProps> = ({
  value,
  onChange,
  placeholder = 'Select Role',
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState<AuthRole>(value && value.length > 0 ? value : 'farmer');

  const selected = ROLE_OPTIONS.find((o) => o.value === value);

  const handleOpen = () => {
    setPending(value && value.length > 0 ? value : 'farmer');
    setIsOpen(true);
  };

  const handleContinue = () => {
    onChange(pending);
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Role</Text>

      {/* Trigger field */}
      <TouchableOpacity
        style={[styles.field, !!error && styles.fieldError]}
        activeOpacity={0.75}
        onPress={handleOpen}
      >
        <View
          style={[
            styles.fieldIconWrap,
            { backgroundColor: selected ? selected.iconBg : '#F1F5F9' },
          ]}
        >
          <MaterialCommunityIcons
            name={selected ? selected.icon : 'account-outline'}
            size={18}
            color={selected ? selected.iconColor : COLORS.textSecondary}
          />
        </View>
        <Text style={[styles.valueText, !selected && styles.placeholderText]}>
          {selected ? selected.label : placeholder}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={18} color={COLORS.textSecondary} />
      </TouchableOpacity>
      {!!error && <Text style={styles.errorText}>{error}</Text>}

      {/* Bottom sheet modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        {/* Tap backdrop to dismiss */}
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setIsOpen(false)} />

        {/* Sheet card */}
        <View style={styles.sheet}>
          {/* Drag handle */}
          <View style={styles.dragBar} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Select Role</Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setIsOpen(false)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="close" size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.sheetSubtitle}>Choose how you want to participate on BhumiCred.</Text>

          {/* Role options */}
          <View style={styles.optionsList}>
            {ROLE_OPTIONS.map((opt) => {
              const active = opt.value === pending;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.option, active && styles.optionActive]}
                  activeOpacity={0.75}
                  onPress={() => setPending(opt.value)}
                >
                  {/* Circular coloured icon */}
                  <View style={[styles.optionIconCircle, { backgroundColor: opt.iconBg }]}>
                    <MaterialCommunityIcons name={opt.icon} size={22} color={opt.iconColor} />
                  </View>

                  {/* Title + subtitle */}
                  <View style={styles.optionTextBlock}>
                    <Text style={[styles.optionTitle, active && styles.optionTitleActive]}>
                      {opt.label}
                    </Text>
                    <Text style={styles.optionSubtitle} numberOfLines={2}>
                      {opt.subtitle}
                    </Text>
                  </View>

                  {/* Check circle */}
                  <View style={[styles.checkCircle, active && styles.checkCircleActive]}>
                    {active && (
                      <MaterialCommunityIcons name="check" size={12} color="#FFFFFF" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Continue button */}
          <TouchableOpacity style={styles.continueBtn} activeOpacity={0.85} onPress={handleContinue}>
            <Text style={styles.continueBtnText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const { height: SCREEN_H } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 6,
    marginLeft: 4,
  },

  // ── Trigger field ────────────────────────────────────────────────────────────
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 54,
  },
  fieldError: {
    borderColor: '#EF4444',
  },
  fieldIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  valueText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  placeholderText: {
    color: '#94A3B8',
    fontWeight: '500',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 4,
  },

  // ── Backdrop ─────────────────────────────────────────────────────────────────
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.52)',
  },

  // ── Bottom sheet ─────────────────────────────────────────────────────────────
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: SCREEN_H * 0.82,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 24,
  },
  dragBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 18,
  },

  // ── Header ───────────────────────────────────────────────────────────────────
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textDark,
    letterSpacing: -0.3,
    flex: 1,
    flexWrap: 'wrap',
    marginRight: 10,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 18,
  },

  // ── Options ──────────────────────────────────────────────────────────────────
  optionsList: {
    gap: 10,
    marginBottom: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E8EDF5',
    backgroundColor: '#FAFBFD',
  },
  optionActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0FDF4',
  },
  optionIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionTextBlock: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 2,
  },
  optionTitleActive: {
    color: COLORS.primary,
  },
  optionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  checkCircleActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  // ── Continue button ───────────────────────────────────────────────────────────
  continueBtn: {
    backgroundColor: COLORS.textDark,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
