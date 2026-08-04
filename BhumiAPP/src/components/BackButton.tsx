import React from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/theme';

interface BackButtonProps {
  /** Icon color. Defaults to COLORS.primary (green). */
  color?: string;
  /** Button background color. Defaults to white with slight opacity. */
  backgroundColor?: string;
  /** Route to push to when there is no previous screen in the stack. */
  fallbackRoute?: string;
}

/**
 * Floating back button that overlays the screen at top-left.
 * Uses absolute positioning so it never affects existing layout.
 * Matches the reference design from insurance/register-single.tsx:
 *   - arrow-left icon, size 22
 *   - padding 6, borderRadius 10
 */
export function BackButton({
  color = COLORS.primary,
  backgroundColor = 'rgba(255, 255, 255, 0.92)',
  fallbackRoute = '/(tabs)',
}: BackButtonProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const topOffset = (insets.top > 0 ? insets.top : Platform.OS === 'ios' ? 44 : 0) + 12;

  const handlePress = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallbackRoute as any);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, { top: topOffset, backgroundColor }]}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <MaterialCommunityIcons name="arrow-left" size={22} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    left: 16,
    zIndex: 100,
    padding: 6,
    borderRadius: 10,
  },
});
