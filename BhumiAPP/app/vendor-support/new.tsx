import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, StatusBar, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { useSupportStore } from '../../src/store/supportStore';
import DetailPageHeader from '../../src/components/DetailPageHeader';

const CATEGORIES = ['Account', 'Payment', 'Product', 'Order', 'KYC', 'Other'];

export default function NewSupportTicketScreen() {
  const router = useRouter();
  const { createTicket, isLoading } = useSupportStore();

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<string>('Account');
  const [description, setDescription] = useState('');

  const handleSubmit = async () => {
    if (!subject.trim()) {
      Alert.alert('Incomplete', 'Please enter a subject for your ticket.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Incomplete', 'Please describe your issue.');
      return;
    }
    const ticket = await createTicket({ subject: subject.trim(), category, description: description.trim() });
    if (ticket) {
      router.replace(`/vendor-support/${ticket.id}` as any);
    } else {
      Alert.alert('Submission Failed', 'Unable to create your ticket. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <DetailPageHeader title="Raise a New Ticket" />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <Text style={styles.label}>Subject *</Text>
          <TextInput
            style={styles.input}
            placeholder="Briefly describe your issue"
            placeholderTextColor="#94A3B8"
            value={subject}
            onChangeText={setSubject}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.pillRow}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.pillOption, category === c && styles.pillOptionActive]}
                onPress={() => setCategory(c)}
                activeOpacity={0.8}
              >
                <Text style={[styles.pillText, category === c && styles.pillTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Explain your issue in detail"
            placeholderTextColor="#94A3B8"
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>

        <TouchableOpacity style={[styles.submitBtn, isLoading && styles.btnDisabled]} onPress={handleSubmit} disabled={isLoading} activeOpacity={0.85}>
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.submitBtnText}>Submit Ticket</Text>
              <MaterialCommunityIcons name="send-outline" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },
  field: { marginBottom: 18 },
  label: { ...TYPOGRAPHY.caption, color: '#334155', marginBottom: 7, marginLeft: 4, fontWeight: '700' },
  input: { minHeight: 52, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', ...TYPOGRAPHY.body, color: '#0F172A' },
  inputMultiline: { minHeight: 120, textAlignVertical: 'top', paddingTop: 14 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pillOption: { paddingHorizontal: 14, height: 38, borderRadius: 19, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  pillOptionActive: { borderColor: COLORS.primary, backgroundColor: '#F0FDF4' },
  pillText: { fontSize: 12.5, fontWeight: '700', color: COLORS.textSecondary },
  pillTextActive: { color: COLORS.primary },
  submitBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary, height: 56, borderRadius: 16, marginTop: 8, ...SHADOWS.glow },
  btnDisabled: { opacity: 0.65 },
  submitBtnText: { fontSize: 16, color: '#FFFFFF', fontWeight: '800', letterSpacing: 0.3 },
});
