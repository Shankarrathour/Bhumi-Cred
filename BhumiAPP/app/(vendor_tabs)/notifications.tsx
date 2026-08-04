import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../src/theme/theme';
import { useNotificationStore, NotificationItem } from '../../src/store/notificationStore';
import { EmptyState } from '../../src/components/EmptyState';
import DetailPageHeader from '../../src/components/DetailPageHeader';

export default function VendorNotificationsScreen() {
  const { notifications, fetchNotifications, markAsRead } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleNotificationPress = (item: NotificationItem) => {
    if (!item.read) {
      markAsRead(item.id);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'support': return 'headset';
      case 'kyc': return 'shield-check';
      case 'payout': return 'cash';
      case 'project': return 'leaf';
      default: return 'bell';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'support': return '#2563EB';
      case 'kyc': return COLORS.primary;
      case 'payout': return '#EAB308';
      case 'project': return '#10B981';
      default: return COLORS.accent;
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && styles.unreadItem]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBox, { backgroundColor: getIconColor(item.type) + '20' }]}>
        <MaterialCommunityIcons name={getIcon(item.type)} size={22} color={getIconColor(item.type)} />
      </View>
      <View style={styles.content}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemMessage}>{item.message}</Text>
        <Text style={styles.itemTime}>{item.date}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <DetailPageHeader title="All Notifications" />

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  listContent: { padding: 16, flexGrow: 1 },
  emptyWrapper: { marginTop: 40 },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    ...SHADOWS.soft,
  },
  unreadItem: { backgroundColor: COLORS.primaryLight + '10', borderColor: COLORS.primaryLight + '40' },
  iconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  content: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textDark, marginBottom: 4 },
  itemMessage: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 6 },
  itemTime: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary, marginLeft: 10, alignSelf: 'center' },
});
