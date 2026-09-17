import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, DeviceEventEmitter } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { SevaBotModal } from '../../src/components/SevaBotModal';
import { useAuthStore } from '../../src/store/authStore';
import { GovtSoilTestingView } from '../../src/components/GovtSoilTestingView';

const MOCK_BOOKINGS = [
  {
    id: 'BKG-102934',
    testName: 'BhumiCheck Carbon Premium Audit',
    date: '12 May 2026',
    time: '08:00 AM - 11:00 AM',
    status: 'Upcoming',
    farmer: '',
    homeCollection: true,
  },
  {
    id: 'BKG-098122',
    testName: 'Satellite NDVI Crop Health Scan',
    date: '02 Apr 2026',
    time: '07:30 AM - 10:30 AM',
    status: 'Completed',
    farmer: '',
    homeCollection: true,
  },
  {
    id: 'BKG-087233',
    testName: 'Complete Soil NPK & Carbon Audit',
    date: '15 Mar 2026',
    time: '09:00 AM - 12:00 PM',
    status: 'Cancelled',
    farmer: '',
    homeCollection: false,
  }
];

export default function BookingsScreen() {
  const router = useRouter();
  const role = useAuthStore((state) => state.role);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [isBotVisible, setBotVisible] = useState(false);

  if (role === 'govt_body') {
    return <GovtSoilTestingView />;
  }

  const filteredBookings = MOCK_BOOKINGS.filter(b => 
    activeTab === 'upcoming' ? b.status === 'Upcoming' : b.status !== 'Upcoming'
  );

  const renderBookingCard = ({ item }: { item: typeof MOCK_BOOKINGS[0] }) => (
    <View style={styles.bookingCard}>
      <View style={styles.cardHeader}>
        <View style={styles.badgeRow}>
          <View style={[
            styles.statusBadge,
            item.status === 'Upcoming' ? styles.statusUpcoming : 
            item.status === 'Completed' ? styles.statusCompleted : styles.statusCancelled
          ]}>
            <Text style={[
              styles.statusText,
              item.status === 'Upcoming' ? styles.statusTextUpcoming : 
              item.status === 'Completed' ? styles.statusTextCompleted : styles.statusTextCancelled
            ]}>
              {item.status}
            </Text>
          </View>
          <Text style={styles.bookingId}>#{item.id}</Text>
        </View>
      </View>

      <Text style={styles.testName}>{item.testName}</Text>
      
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <MaterialCommunityIcons name="calendar-month-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.detailText}>{item.date}</Text>
        </View>
        <View style={styles.detailItem}>
          <MaterialCommunityIcons name="clock-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.detailText}>{item.time}</Text>
        </View>
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <MaterialCommunityIcons name="account-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.detailText}>{item.farmer}</Text>
        </View>
        {item.homeCollection && (
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="drone" size={16} color={COLORS.success} />
            <Text style={[styles.detailText, { color: COLORS.success }]}>Field Drone Audit</Text>
          </View>
        )}
      </View>

      <View style={styles.actionRow}>
        {item.status === 'Upcoming' ? (
          <>
            <TouchableOpacity 
              style={styles.actionButtonSecondary} 
              onPress={() => DeviceEventEmitter.emit('openGlobalScheduler')}
            >
              <Text style={styles.actionButtonTextSecondary}>Reschedule</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButtonPrimary} onPress={() => router.push('/(tabs)/track')}>
              <Text style={styles.actionButtonTextPrimary}>Track Tech</Text>
            </TouchableOpacity>
          </>
        ) : item.status === 'Completed' ? (
          <>
            <TouchableOpacity style={styles.actionButtonSecondary} onPress={() => router.push('/search')}>
              <Text style={styles.actionButtonTextSecondary}>Rebook</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButtonPrimary} onPress={() => router.push('/(tabs)/reports')}>
              <Text style={styles.actionButtonTextPrimary}>View Report</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.actionButtonSecondary} onPress={() => router.push('/search')}>
            <Text style={styles.actionButtonTextSecondary}>Book Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <TouchableOpacity style={styles.helpButton} onPress={() => setBotVisible(true)}>
          <MaterialCommunityIcons name="headset" size={24} color={COLORS.textLight} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>Upcoming</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'past' && styles.activeTab]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>Past Bookings</Text>
        </TouchableOpacity>
      </View>

      {/* Bookings List */}
      <FlatList
        data={filteredBookings}
        keyExtractor={item => item.id}
        renderItem={renderBookingCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="calendar-blank" size={64} color={COLORS.border} />
            <Text style={styles.emptyTitle}>No {activeTab} bookings</Text>
            <Text style={styles.emptySubtitle}>You don't have any {activeTab} soil inspection or canopy mapping bookings.</Text>
            <TouchableOpacity style={styles.browseButton} onPress={() => router.push('/search')}>
              <Text style={styles.browseButtonText}>Schedule Audit</Text>
            </TouchableOpacity>
          </View>
        }
      />
      <SevaBotModal visible={isBotVisible} onClose={() => setBotVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    ...TYPOGRAPHY.h1,
    color: COLORS.textLight,
  },
  helpButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent,
  },
  tabText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  activeTabText: {
    color: COLORS.accent,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  bookingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  cardHeader: {
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingId: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusUpcoming: {
    backgroundColor: '#E0F2FE',
  },
  statusCompleted: {
    backgroundColor: COLORS.successLight,
  },
  statusCancelled: {
    backgroundColor: COLORS.dangerLight,
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    fontWeight: 'bold',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  statusTextUpcoming: {
    color: '#0284C7',
  },
  statusTextCompleted: {
    color: COLORS.success,
  },
  statusTextCancelled: {
    color: COLORS.danger,
  },
  testName: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textDark,
    marginBottom: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginLeft: 6,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
    marginTop: 8,
  },
  actionButtonSecondary: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 30,
    backgroundColor: '#F1F5F9',
    marginRight: 10,
  },
  actionButtonPrimary: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 30,
    backgroundColor: COLORS.accent, // Pink primary
  },
  actionButtonTextSecondary: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textDark,
    fontWeight: 'bold',
  },
  actionButtonTextPrimary: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textDark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
  },
  browseButtonText: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textLight,
    fontWeight: 'bold',
  },
});
