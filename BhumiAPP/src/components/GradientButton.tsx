import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps, ActivityIndicator } from 'react-native';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../theme/theme';

interface GradientButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'outline' | 'glass';
}

export const GradientButton: React.FC<GradientButtonProps> = ({ 
  title, 
  loading = false, 
  variant = 'primary', 
  style, 
  ...props 
}) => {
  if (variant === 'outline') {
    return (
      <TouchableOpacity style={[styles.outlineButton, style]} {...props} disabled={loading || props.disabled}>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : (
          <Text style={styles.outlineText}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  }

  if (variant === 'glass') {
    return (
      <TouchableOpacity style={[styles.glassButton, style]} {...props} disabled={loading || props.disabled}>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : (
          <Text style={styles.glassText}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={[styles.primaryButton, style]} {...props} disabled={loading || props.disabled}>
      {loading ? (
        <ActivityIndicator color={COLORS.primaryDark} />
      ) : (
        <Text style={styles.primaryText}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: COLORS.accent, // Lime Accent
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30, // Pill shape
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.limeGlow,
  },
  primaryText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primaryDark, // Deep green text on lime background for premium contrast!
    fontWeight: '700',
    fontSize: 16,
  },
  outlineButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  glassButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.glassBg,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.soft,
  },
  glassText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 16,
  }
});
