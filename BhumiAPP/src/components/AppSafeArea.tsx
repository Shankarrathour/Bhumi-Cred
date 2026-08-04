import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';

interface AppSafeAreaProps {
  children: React.ReactNode;
  edges?: readonly Edge[];
  style?: ViewStyle;
}

/**
 * Shared safe-area wrapper used across both the Vendor and Farmer sections.
 * Applied once at each navigator root (Tabs/Stack layout) so every screen
 * inside inherits it automatically instead of wrapping per-screen. Only the
 * `bottom` edge is padded by default — the home indicator / gesture-nav
 * inset — and that reserved strip is painted solid black. Screens keep
 * whatever top-inset handling they already had.
 */
export default function AppSafeArea({ children, edges = ['bottom'], style }: AppSafeAreaProps) {
  return (
    <SafeAreaView edges={edges} style={[styles.safe, style]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000000' },
});
