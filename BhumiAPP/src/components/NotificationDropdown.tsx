import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SHADOWS } from '../theme/theme';
import { useNotificationStore, NotificationItem } from '../store/notificationStore';

const { width } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<Props> = ({ visible, onClose }) => {
  const router = useRouter();
  const { notifications, markAsRead } = useNotificationStore();

  const recentNotifications = notifications.slice(0, 3);

  const handleNotificationPress = (item: NotificationItem) => {
    if (!item.read) {
      markAsRead(item.id);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'kyc': return 'shield-check';
      case 'payout': return 'cash';
      case 'project': return 'leaf';
      default: return 'bell';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'kyc': return COLORS.primary;
      case 'payout': return '#EAB308';
      case 'project': return '#10B981';
      default: return COLORS.accent;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.dropdownContainer}>
              <View style={styles.header}>
                <Text style={styles.title}>Notifications</Text>
                {notifications.length > 3 && (
                  <Text style={styles.countText}>{notifications.length} total</Text>
                )}
              </View>

              {recentNotifications.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="bell-off-outline" size={40} color={COLORS.textLight} />
                  <Text style={styles.emptyText}>No notifications yet.</Text>
                </View>
              ) : (
                <View>
                  {recentNotifications.map(item => (
                    <TouchableOpacity 
                      key={item.id} 
                      style={[styles.notificationItem, !item.read && styles.unreadItem]}
                      onPress={() => handleNotificationPress(item)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.iconBox, { backgroundColor: getIconColor(item.type) + '20' }]}>
                        <MaterialCommunityIcons name={getIcon(item.type)} size={20} color={getIconColor(item.type)} />
                      </View>
                      <View style={styles.content}>
                        <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.itemMessage} numberOfLines={2}>{item.message}</Text>
                        <Text style={styles.itemTime}>{item.date}</Text>
                      </View>
                      {!item.read && <View style={styles.unreadDot} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity 
                style={styles.viewAllButton} 
                onPress={() => {
                  onClose();
                  router.push('/notifications');
                }}
              >
                <Text style={styles.viewAllText}>View All Notifications</Text>
                <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.primaryDark} />
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 70,
    right: 16,
    width: Math.min(width - 32, 360),
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    ...SHADOWS.medium,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  countText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
  },
  unreadItem: {
    backgroundColor: COLORS.primaryLight + '10',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  itemMessage: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
    lineHeight: 16,
  },
  itemTime: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: 8,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    backgroundColor: COLORS.surface,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primaryDark,
    marginRight: 4,
  },
});
