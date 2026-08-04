import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '../theme/theme';

interface AppHeaderProps {
  onMenuPress: () => void;
  onNotificationPress: () => void;
  unreadCount?: number;
}

export default function AppHeader({ onMenuPress, onNotificationPress, unreadCount = 0 }: AppHeaderProps) {
  return (
    <View style={styles.stickyHeader}>
      <TouchableOpacity style={styles.hamburgerBtn} onPress={onMenuPress}>
        <MaterialCommunityIcons name="menu" size={24} color={COLORS.textLight} />
      </TouchableOpacity>

      <View style={styles.brandContainer}>
        <MaterialCommunityIcons name="leaf" size={20} color={COLORS.accent} style={{ marginRight: 6 }} />
        <Text style={styles.brandTitle}>BhumiCred</Text>
      </View>

      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.iconBtn} onPress={onNotificationPress}>
          <MaterialCommunityIcons name="bell-outline" size={22} color={COLORS.textLight} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stickyHeader: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'ios' ? 50 : 45,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
    ...Platform.select({
      android: { elevation: 4 },
      ios: { shadowColor: '#064E3B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    }),
  },
  hamburgerBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  brandContainer: { flexDirection: 'row', alignItems: 'center' },
  brandTitle: { ...TYPOGRAPHY.h2, color: '#FFFFFF', fontWeight: '900', fontSize: 20 },
  headerRight: { flexDirection: 'row' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  badge: { position: 'absolute', top: -2, right: -2, backgroundColor: COLORS.accent, width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  badgeText: { fontSize: 9, fontWeight: '800', color: COLORS.primaryDark },
});
