import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, StatusBar, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { useSupportStore } from '../../src/store/supportStore';
import { TicketMessage } from '../../src/api/supportApi';

const STATUS_COLORS: Record<string, string> = {
  Open: '#2563EB',
  'In Progress': '#D97706',
  Resolved: '#059669',
};

const POLL_INTERVAL_MS = 20000; // 20s — no websocket exists in this project yet

export default function VendorSupportTicketScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { selectedTicket, isLoading, fetchTicket, replyToTicket, clearSelectedTicket } = useSupportStore();

  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);
  // Tracks whether the user is already viewing the latest messages, so the
  // keyboard-open auto-scroll only kicks in when it would (WhatsApp/Telegram
  // never yank you back to the bottom while you're reading older history).
  const isNearBottomRef = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      fetchTicket(id);
      const interval = setInterval(() => fetchTicket(id), POLL_INTERVAL_MS);
      return () => {
        clearInterval(interval);
        clearSelectedTicket();
      };
    }, [id, fetchTicket, clearSelectedTicket])
  );

  useEffect(() => {
    if (selectedTicket?.messages?.length) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [selectedTicket?.messages?.length]);

  // As the keyboard rises, KeyboardAvoidingView shrinks the FlatList's
  // viewport — re-pin to the latest message so it isn't left scrolled
  // "above" the new, smaller visible area. Only when already at the bottom,
  // so scrolling up to read history is never disturbed by focusing the input.
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const sub = Keyboard.addListener(showEvent, () => {
      if (isNearBottomRef.current) {
        requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
      }
    });
    return () => sub.remove();
  }, []);

  const handleListScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const distanceFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
    isNearBottomRef.current = distanceFromBottom < 80;
  };

  const handleSend = async () => {
    if (!replyText.trim() || !id) return;
    setSending(true);
    const text = replyText.trim();
    setReplyText('');
    await replyToTicket(id, text);
    setSending(false);
  };

  if (isLoading && !selectedTicket) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  const statusColor = selectedTicket ? STATUS_COLORS[selectedTicket.status] || COLORS.textSecondary : COLORS.textSecondary;

  const renderMessage = ({ item }: { item: TicketMessage }) => {
    const isVendor = item.sender === 'vendor';
    return (
      <View style={[styles.bubbleRow, isVendor ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
        <View style={[styles.bubble, isVendor ? styles.bubbleVendor : styles.bubbleAdmin]}>
          <Text style={[styles.bubbleSender, isVendor ? styles.bubbleSenderVendor : styles.bubbleSenderAdmin]}>
            {isVendor ? 'You' : item.sender_name}
          </Text>
          <Text style={[styles.bubbleText, isVendor && styles.bubbleTextVendor]}>{item.message}</Text>
          <Text style={[styles.bubbleTime, isVendor && styles.bubbleTimeVendor]}>
            {new Date(item.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{selectedTicket?.subject || 'Support Ticket'}</Text>
          {selectedTicket && (
            <View style={[styles.statusPill, { backgroundColor: `${statusColor}30`, borderColor: `${statusColor}60` }]}>
              <Text style={[styles.statusPillText, { color: '#FFFFFF' }]}>{selectedTicket.status}</Text>
            </View>
          )}
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={selectedTicket?.messages || []}
        keyExtractor={(_, index) => String(index)}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleListScroll}
        scrollEventThrottle={16}
      />

      {selectedTicket?.status !== 'Resolved' ? (
        <View style={styles.replyBar}>
          <TextInput
            style={styles.replyInput}
            placeholder="Type your reply..."
            placeholderTextColor="#94A3B8"
            value={replyText}
            onChangeText={setReplyText}
            multiline
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={sending || !replyText.trim()} activeOpacity={0.85}>
            {sending ? <ActivityIndicator color="#FFFFFF" size="small" /> : <MaterialCommunityIcons name="send" size={18} color="#FFFFFF" />}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.resolvedBanner}>
          <MaterialCommunityIcons name="check-decagram" size={16} color={COLORS.success} />
          <Text style={styles.resolvedBannerText}>This ticket has been resolved.</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 45, paddingBottom: 16, paddingHorizontal: 20,
    backgroundColor: COLORS.primary, borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
  },
  backButton: { padding: 8, marginRight: 8, marginLeft: -8 },
  headerTitle: { ...TYPOGRAPHY.h2, color: '#FFFFFF', fontWeight: '900', fontSize: 17 },
  statusPill: { alignSelf: 'flex-start', marginTop: 6, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  statusPillText: { fontSize: 10, fontWeight: '800' },
  listContent: { padding: 16, flexGrow: 1 },
  bubbleRow: { flexDirection: 'row', marginBottom: 12 },
  bubbleRowLeft: { justifyContent: 'flex-start' },
  bubbleRowRight: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '80%', borderRadius: 16, padding: 12, ...SHADOWS.soft },
  bubbleAdmin: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderTopLeftRadius: 4 },
  bubbleVendor: { backgroundColor: COLORS.primary, borderTopRightRadius: 4 },
  bubbleSender: { fontSize: 10.5, fontWeight: '800', marginBottom: 4 },
  bubbleSenderAdmin: { color: COLORS.primary },
  bubbleSenderVendor: { color: '#D1FAE5' },
  bubbleText: { fontSize: 13.5, color: COLORS.textDark, lineHeight: 19 },
  bubbleTextVendor: { color: '#FFFFFF' },
  bubbleTime: { fontSize: 9.5, color: COLORS.textSecondary, marginTop: 6, fontWeight: '600' },
  bubbleTimeVendor: { color: 'rgba(255,255,255,0.7)' },
  replyBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.surface },
  replyInput: { flex: 1, minHeight: 44, maxHeight: 100, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 22, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', ...TYPOGRAPHY.body, color: '#0F172A' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', ...SHADOWS.glow },
  resolvedBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, backgroundColor: '#F0FDF4', borderTopWidth: 1, borderTopColor: COLORS.border },
  resolvedBannerText: { fontSize: 12.5, fontWeight: '700', color: COLORS.success },
});
