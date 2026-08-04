import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../src/theme/theme';
import { useSupportStore } from '../../src/store/supportStore';
import { SupportTicketResponse } from '../../src/api/supportApi';
import { EmptyState } from '../../src/components/EmptyState';
import DetailPageHeader from '../../src/components/DetailPageHeader';

const STATUS_COLORS: Record<string, string> = {
  Open: '#2563EB',
  'In Progress': '#D97706',
  Resolved: '#059669',
};

export default function VendorHelpSupportScreen() {
  const router = useRouter();
  const { tickets, isLoading, fetchTickets } = useSupportStore();

  useFocusEffect(
    useCallback(() => {
      fetchTickets();
    }, [fetchTickets])
  );

  const renderItem = ({ item }: { item: SupportTicketResponse }) => {
    const statusColor = STATUS_COLORS[item.status] || COLORS.textSecondary;
    return (
      <TouchableOpacity
        style={styles.ticketCard}
        activeOpacity={0.8}
        onPress={() => router.push(`/vendor-support/${item.id}` as any)}
      >
        <View style={styles.ticketTop}>
          <Text style={styles.ticketSubject} numberOfLines={1}>{item.subject}</Text>
          <View style={[styles.statusPill, { backgroundColor: `${statusColor}18`, borderColor: `${statusColor}40` }]}>
            <Text style={[styles.statusPillText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.ticketDescription} numberOfLines={2}>{item.description}</Text>
        <View style={styles.ticketMeta}>
          {item.category ? <Text style={styles.metaText}>{item.category}</Text> : null}
          <Text style={styles.metaText}>Updated {new Date(item.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <DetailPageHeader title="Help & Support" />

      <TouchableOpacity style={styles.newTicketBtn} activeOpacity={0.85} onPress={() => router.push('/vendor-support/new')}>
        <MaterialCommunityIcons name="plus-circle-outline" size={20} color="#FFFFFF" />
        <Text style={styles.newTicketBtnText}>Raise a New Ticket</Text>
      </TouchableOpacity>

      {isLoading && tickets.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyWrapper}>
              <EmptyState
                icon="headset"
                title="No Support Tickets"
                description="You haven't raised any support tickets yet. Tap 'Raise a New Ticket' if you need help."
              />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  newTicketBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, marginHorizontal: 16, marginTop: 16,
    paddingVertical: 13, borderRadius: 14, ...SHADOWS.glow,
  },
  newTicketBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, flexGrow: 1 },
  emptyWrapper: { marginTop: 24 },
  ticketCard: {
    backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border,
    padding: 14, marginBottom: 12, ...SHADOWS.soft,
  },
  ticketTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 8 },
  ticketSubject: { flex: 1, fontSize: 14, fontWeight: '800', color: COLORS.textDark },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  statusPillText: { fontSize: 10, fontWeight: '800' },
  ticketDescription: { fontSize: 12.5, color: COLORS.textSecondary, lineHeight: 17, marginBottom: 8 },
  ticketMeta: { flexDirection: 'row', gap: 12 },
  metaText: { fontSize: 10.5, color: COLORS.textSecondary, fontWeight: '700' },
});
