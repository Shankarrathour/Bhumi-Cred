import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  FlatList,
  RefreshControl
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

export interface GovtNotificationItem {
  id: string;
  category: string;
  notification_type: string;
  title: string;
  message: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW' | string;
  is_read: boolean;
  created_at: string;
  deep_link?: string;
  target_screen?: string;
  navigation_params?: Record<string, any>;
}

interface GovtNotificationCenterViewProps {
  onBack?: () => void;
  onNavigate?: (targetScreen: string, params?: Record<string, any>) => void;
}

const CATEGORY_CHIPS = [
  { id: 'all', label: 'All', icon: 'bell-outline' },
  { id: 'unread', label: 'Unread Only', icon: 'email-outline' },
  { id: 'high_priority', label: 'High Priority', icon: 'alert-decagram' },
  { id: 'account', label: 'Account', icon: 'bank' },
  { id: 'campaign', label: 'Campaigns', icon: 'bullhorn' },
  { id: 'project', label: 'Projects', icon: 'clipboard-text' },
  { id: 'soil_testing', label: 'Soil Testing', icon: 'flask' },
  { id: 'insurance', label: 'Insurance', icon: 'shield-check' },
  { id: 'document', label: 'Documents', icon: 'file-document' },
  { id: 'payment', label: 'Treasury/Payment', icon: 'cash-multiple' },
  { id: 'carbon', label: 'Carbon', icon: 'leaf' },
  { id: 'dbt', label: 'DBT', icon: 'bank-transfer' },
];

const ALL_13_TRIGGERS = [
  { key: 'account_status', label: '1. Account Status' },
  { key: 'campaign_status', label: '2. Campaign Status' },
  { key: 'project_assignment', label: '3. Project Assignment' },
  { key: 'project_milestone', label: '4. Project Milestone' },
  { key: 'soil_schedule', label: '5. Soil Schedule' },
  { key: 'soil_report_ready', label: '6. Soil Report Ready' },
  { key: 'insurance_policy', label: '7. Insurance Policy' },
  { key: 'insurance_claim', label: '8. Insurance Claim' },
  { key: 'document_expiry', label: '9. Document Expiry' },
  { key: 'payment_settlement', label: '10. Payment/Settlement' },
  { key: 'carbon_status', label: '11. Carbon Status' },
  { key: 'campaign_update', label: '12. Campaign Update' },
  { key: 'dbt_status', label: '13. DBT Status' },
];

export const GovtNotificationCenterView: React.FC<GovtNotificationCenterViewProps> = ({
  onBack,
  onNavigate,
}) => {
  const [notifications, setNotifications] = useState<GovtNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showTestPanel, setShowTestPanel] = useState<boolean>(false);
  const [dispatchingTrigger, setDispatchingTrigger] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setError(null);
      let url = `${BASE_URL}/v1/govt/notifications?limit=100`;

      if (activeFilter === 'unread') {
        url += `&unread_only=true`;
      } else if (activeFilter === 'high_priority') {
        url += `&priority=HIGH`;
      } else if (activeFilter !== 'all') {
        url += `&category=${activeFilter}`;
      }

      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }

      const res = await axios.get(url);
      if (res.data && res.data.success) {
        setNotifications(res.data.data || []);
        setUnreadCount(res.data.unread_count || 0);
      }
    } catch (err: any) {
      console.error('Failed to fetch government notifications:', err);
      setError(err.message || 'Unable to load notifications feed from server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [activeFilter, searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await axios.put(`${BASE_URL}/v1/govt/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.put(`${BASE_URL}/v1/govt/notifications/read-all`);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  const handleTriggerTestNotification = async (triggerKey: string) => {
    try {
      setDispatchingTrigger(triggerKey);
      const res = await axios.post(`${BASE_URL}/v1/govt/notifications/trigger-test/${triggerKey}`);
      if (res.data && res.data.success) {
        Alert.alert('Trigger Dispatched 🚀', `Real trigger '${triggerKey}' persistent notification generated!`);
        fetchNotifications();
      }
    } catch (err: any) {
      Alert.alert('Trigger Failed', err.message || 'Failed to dispatch trigger');
    } finally {
      setDispatchingTrigger(null);
    }
  };

  const handleNotificationPress = async (item: GovtNotificationItem) => {
    if (!item.is_read) {
      handleMarkAsRead(item.id);
    }

    if (item.target_screen && onNavigate) {
      onNavigate(item.target_screen, item.navigation_params);
    } else {
      Alert.alert(
        item.title,
        `${item.message}\n\nDeep Link: ${item.deep_link || 'bhumicred://govt'}`
      );
    }
  };

  const getPriorityStyle = (priority: string) => {
    const p = (priority || '').toUpperCase();
    if (p === 'HIGH') return { bg: '#FEE2E2', color: '#DC2626', label: 'HIGH PRIORITY' };
    if (p === 'MEDIUM') return { bg: '#FEF3C7', color: '#D97706', label: 'MEDIUM' };
    return { bg: '#E0F2FE', color: '#0284C7', label: 'LOW' };
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'account': return 'bank';
      case 'campaign': return 'bullhorn';
      case 'project': return 'clipboard-text';
      case 'soil_testing': return 'flask';
      case 'insurance': return 'shield-check';
      case 'document': return 'file-document';
      case 'payment': case 'wallet': return 'cash-multiple';
      case 'carbon': return 'leaf';
      case 'dbt': return 'bank-transfer';
      default: return 'bell';
    }
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return 'Recent';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Government Notifications</Text>
          <Text style={styles.headerSubtitle}>
            Persistent Channel • {unreadCount} Unread Alerts
          </Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={fetchNotifications}>
          <MaterialCommunityIcons name="refresh" size={22} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.markAllBtn}
          onPress={handleMarkAllRead}
        >
          <MaterialCommunityIcons name="email-open-outline" size={16} color="#16A34A" />
          <Text style={styles.markAllText}>Mark All as Read</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testPanelToggle, showTestPanel && styles.testPanelToggleActive]}
          onPress={() => setShowTestPanel(!showTestPanel)}
        >
          <MaterialCommunityIcons name="lightning-bolt" size={16} color={showTestPanel ? '#FFFFFF' : '#7C3AED'} />
          <Text style={[styles.testPanelText, showTestPanel && { color: '#FFFFFF' }]}>
            Test Triggers (13)
          </Text>
        </TouchableOpacity>
      </View>

      {/* 13 Trigger Dispatcher Drawer */}
      {showTestPanel && (
        <View style={styles.testPanelContainer}>
          <Text style={styles.testPanelTitle}>⚡ Dispatch Live Backend Trigger (Test Mode)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.triggerScroll}>
            {ALL_13_TRIGGERS.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={styles.triggerChip}
                onPress={() => handleTriggerTestNotification(t.key)}
                disabled={dispatchingTrigger === t.key}
              >
                {dispatchingTrigger === t.key ? (
                  <ActivityIndicator size="small" color="#7C3AED" />
                ) : (
                  <Text style={styles.triggerChipText}>{t.label}</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Search Input */}
      <View style={styles.searchBox}>
        <MaterialCommunityIcons name="magnify" size={20} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search notifications, subjects, or IDs..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94A3B8"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialCommunityIcons name="close-circle" size={18} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Chips Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        {CATEGORY_CHIPS.map((chip) => {
          const isActive = activeFilter === chip.id;
          return (
            <TouchableOpacity
              key={chip.id}
              style={[styles.categoryChip, isActive && styles.categoryChipActive]}
              onPress={() => setActiveFilter(chip.id)}
            >
              <MaterialCommunityIcons
                name={chip.icon as any}
                size={16}
                color={isActive ? '#FFFFFF' : '#475569'}
              />
              <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Notification List */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#16A34A" />
          <Text style={styles.loadingText}>Fetching Government Notifications...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchNotifications}>
            <Text style={styles.retryText}>Retry Loading</Text>
          </TouchableOpacity>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="bell-off-outline" size={56} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Notifications Found</Text>
          <Text style={styles.emptySubtitle}>
            {activeFilter !== 'all'
              ? `No notifications found matching filter '${activeFilter}'.`
              : 'You are all caught up! No active government alerts right now.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#16A34A']} />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const priorityInfo = getPriorityStyle(item.priority);
            const iconName = getCategoryIcon(item.category);

            return (
              <TouchableOpacity
                style={[styles.card, !item.is_read && styles.cardUnread]}
                onPress={() => handleNotificationPress(item)}
                activeOpacity={0.8}
              >
                {!item.is_read && <View style={styles.unreadDot} />}
                
                <View style={styles.cardHeader}>
                  <View style={styles.categoryBadge}>
                    <MaterialCommunityIcons name={iconName as any} size={16} color="#0F766E" />
                    <Text style={styles.categoryBadgeText}>
                      {(item.category || 'SYSTEM').toUpperCase()}
                    </Text>
                  </View>

                  <View style={[styles.priorityPill, { backgroundColor: priorityInfo.bg }]}>
                    <Text style={[styles.priorityPillText, { color: priorityInfo.color }]}>
                      {priorityInfo.label}
                    </Text>
                  </View>
                </View>

                <Text style={styles.notifTitle}>{item.title}</Text>
                <Text style={styles.notifMessage}>{item.message}</Text>

                {item.deep_link && (
                  <View style={styles.deepLinkBox}>
                    <MaterialCommunityIcons name="link-variant" size={14} color="#475569" />
                    <Text style={styles.deepLinkText} numberOfLines={1}>
                      {item.deep_link}
                    </Text>
                  </View>
                )}

                <View style={styles.cardFooter}>
                  <Text style={styles.timestampText}>
                    <MaterialCommunityIcons name="clock-outline" size={12} color="#94A3B8" />{' '}
                    {formatDate(item.created_at)}
                  </Text>

                  <TouchableOpacity
                    style={styles.actionNavBtn}
                    onPress={() => handleNotificationPress(item)}
                  >
                    <Text style={styles.actionNavText}>Open Screen</Text>
                    <MaterialCommunityIcons name="chevron-right" size={16} color="#16A34A" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  iconBtn: {
    padding: 8,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
    marginLeft: 6,
  },
  testPanelToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F3E8FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  testPanelToggleActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#6D28D9',
  },
  testPanelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C3AED',
    marginLeft: 6,
  },
  testPanelContainer: {
    backgroundColor: '#FAF5FF',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9D5FF',
  },
  testPanelTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B21A8',
    marginBottom: 8,
  },
  triggerScroll: {
    flexDirection: 'row',
  },
  triggerChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#D8B4FE',
  },
  triggerChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7C3AED',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  categoryScroll: {
    maxHeight: 52,
    marginTop: 10,
    marginBottom: 4,
  },
  categoryContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  categoryChipActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginLeft: 6,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardUnread: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  unreadDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingRight: 16,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F766E',
    marginLeft: 4,
  },
  priorityPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priorityPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  notifMessage: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 10,
  },
  deepLinkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  deepLinkText: {
    fontSize: 11,
    color: '#475569',
    fontFamily: 'Platform',
    marginLeft: 6,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    marginTop: 2,
  },
  timestampText: {
    fontSize: 11,
    color: '#64748B',
  },
  actionNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionNavText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
    marginRight: 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#16A34A',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
  },
});
