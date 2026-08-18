import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { useNotificationStore, NotificationItem } from '../../src/store/notificationStore';
import DetailPageHeader from '../../src/components/DetailPageHeader';
import { EmptyState } from '../../src/components/EmptyState';
import { ListSkeleton } from '../../src/components/SkeletonLoader';

import { useRouter } from 'expo-router';

const ICON_BY_TYPE: Record<string, { icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string }> = {
  kyc: { icon: 'shield-check', color: COLORS.primary },
  otp: { icon: 'key-outline', color: '#8B5CF6' },
  land: { icon: 'map-marker-check', color: COLORS.secondary },
  land_submitted: { icon: 'file-document-outline', color: COLORS.primary },
  admin_review: { icon: 'clock-outline', color: '#3B82F6' },
  correction: { icon: 'alert-circle-outline', color: '#EA580C' },
  approved: { icon: 'check-decagram', color: COLORS.success },
  land_approved: { icon: 'check-decagram', color: COLORS.success },
  project: { icon: 'leaf', color: COLORS.success },
  project_assigned: { icon: 'leaf', color: COLORS.success },
  mrv_scheduled: { icon: 'satellite-variant', color: '#0F766E' },
  soil_report: { icon: 'flask-outline', color: '#0284C7' },
  insurance: { icon: 'shield-check-outline', color: COLORS.primary },
  payment: { icon: 'cash-register', color: '#EAB308' },
  referral: { icon: 'gift-outline', color: '#EC4899' },
  sale: { icon: 'cash-multiple', color: COLORS.accentDark },
  payout: { icon: 'cash', color: '#EAB308' },
  marketplace: { icon: 'storefront', color: COLORS.primaryLight },
  support: { icon: 'headset', color: '#2563EB' },
  system: { icon: 'bell', color: COLORS.accent },
};

const getTypeStyle = (type: string) => ICON_BY_TYPE[type] || ICON_BY_TYPE.system;

const getDeepLinkTarget = (type: string): string => {
  switch (type) {
    case 'otp':
      return '/(auth)/otp';
    case 'land_submitted':
      return '/profile/add-land';
    case 'admin_review':
    case 'correction':
    case 'approved':
    case 'land_approved':
    case 'project':
    case 'project_assigned':
    case 'mrv_scheduled':
      return '/(tabs)/projects';
    case 'soil_report':
      return '/soil-testing';
    case 'insurance':
      return '/insurance/certificate';
    case 'payment':
    case 'payout':
    case 'sale':
      return '/(tabs)/wallet';
    case 'referral':
      return '/referral';
    default:
      return '/(tabs)';
  }
};

const formatNotificationDate = (raw: string): string => {
  const parsed = new Date(raw);
  if (isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, fetchNotifications, markAsRead } = useNotificationStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetchNotifications().finally(() => setIsLoading(false));
  }, [fetchNotifications]);

  const handleNotificationPress = useCallback((item: NotificationItem) => {
    if (!item.read) {
      markAsRead(item.id);
    }
    const targetRoute = getDeepLinkTarget(item.type);
    router.push(targetRoute as any);
  }, [markAsRead, router]);

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const { icon, color } = getTypeStyle(item.type);


    return (
      <TouchableOpacity
        style={[styles.card, !item.read && styles.unreadCard]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.75}
      >
        <View style={[styles.iconBox, { backgroundColor: color + '18' }]}>
          <MaterialCommunityIcons name={icon} size={22} color={color} />
        </View>
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
            {!item.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.itemMessage} numberOfLines={3}>{item.message}</Text>
          <View style={styles.footerRow}>
            <Text style={styles.itemTime}>{formatNotificationDate(item.date)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <DetailPageHeader title="Notifications" />

      {isLoading ? (
        <View style={styles.listContent}>
          <ListSkeleton />
          <ListSkeleton />
          <ListSkeleton />
          <ListSkeleton />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyWrapper}>
              <EmptyState
                icon="bell-off-outline"
                title="No Notifications"
                description="You're all caught up! There are no new notifications at this time."
              />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyWrapper: {
    marginTop: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.soft,
  },
  unreadCard: {
    backgroundColor: COLORS.primaryLight + '0D',
    borderColor: COLORS.primaryLight + '60',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textDark,
    flex: 1,
    marginRight: 8,
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: COLORS.primary,
    marginTop: 2,
  },
  itemMessage: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
    lineHeight: 19,
    marginTop: 4,
  },
  itemTime: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    opacity: 0.75,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionBtnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '14',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
});
