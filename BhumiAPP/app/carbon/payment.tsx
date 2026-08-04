import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';

export default function CarbonPaymentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [selectedMethod, setSelectedMethod] = useState('UPI');
  const [isProcessing, setIsProcessing] = useState(false);

  const landArea = parseFloat(params.area as string) || 5;
  const RATE_PER_ACRE = 500;
  const totalAmount = landArea * RATE_PER_ACRE;

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      router.replace('/carbon/success');
    }, 2000);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} disabled={isProcessing}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Application Fee</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <MaterialCommunityIcons name="file-document-outline" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={styles.summaryTitle}>Registration Summary</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Program Type</Text>
            <Text style={styles.summaryValue}>Carbon Generation</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Area</Text>
            <Text style={styles.summaryValue}>{landArea} Acres</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Processing Fee / Acre</Text>
            <Text style={styles.summaryValue}>₹{RATE_PER_ACRE}</Text>
          </View>
          <View style={[styles.divider, { borderStyle: 'dashed' }]} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Amount Payable</Text>
            <Text style={styles.totalValue}>₹{totalAmount.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* Payment Methods */}
        <Text style={styles.sectionTitle}>Select Payment Method</Text>

        <TouchableOpacity 
          style={[styles.methodCard, selectedMethod === 'UPI' && styles.methodCardActive]}
          onPress={() => setSelectedMethod('UPI')}
          activeOpacity={0.8}
        >
          <View style={styles.methodIconBox}>
            <MaterialCommunityIcons name="qrcode-scan" size={24} color={selectedMethod === 'UPI' ? COLORS.primary : COLORS.textSecondary} />
          </View>
          <View style={styles.methodDetails}>
            <Text style={[styles.methodTitle, selectedMethod === 'UPI' && { color: COLORS.primaryDark }]}>UPI Apps</Text>
            <Text style={styles.methodSub}>GPay, PhonePe, Paytm</Text>
          </View>
          <MaterialCommunityIcons 
            name={selectedMethod === 'UPI' ? "radiobox-marked" : "radiobox-blank"} 
            size={24} 
            color={selectedMethod === 'UPI' ? COLORS.primary : '#CBD5E1'} 
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.methodCard, selectedMethod === 'CARD' && styles.methodCardActive]}
          onPress={() => setSelectedMethod('CARD')}
          activeOpacity={0.8}
        >
          <View style={styles.methodIconBox}>
            <MaterialCommunityIcons name="credit-card-outline" size={24} color={selectedMethod === 'CARD' ? COLORS.primary : COLORS.textSecondary} />
          </View>
          <View style={styles.methodDetails}>
            <Text style={[styles.methodTitle, selectedMethod === 'CARD' && { color: COLORS.primaryDark }]}>Credit / Debit Card</Text>
            <Text style={styles.methodSub}>Visa, Mastercard, RuPay</Text>
          </View>
          <MaterialCommunityIcons 
            name={selectedMethod === 'CARD' ? "radiobox-marked" : "radiobox-blank"} 
            size={24} 
            color={selectedMethod === 'CARD' ? COLORS.primary : '#CBD5E1'} 
          />
        </TouchableOpacity>

        <View style={styles.secureBadge}>
          <MaterialCommunityIcons name="shield-check" size={16} color={COLORS.success} />
          <Text style={styles.secureText}>100% Secure Payment Powered by Razorpay</Text>
        </View>

      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: 20 + insets.bottom }]}>
        <TouchableOpacity style={styles.payBtn} onPress={handlePay} disabled={isProcessing}>
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.payBtnText}>Pay ₹{totalAmount.toLocaleString('en-IN')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'ios' ? 50 : 45,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { padding: 8 },
  headerTitle: { ...TYPOGRAPHY.h2, color: COLORS.textLight },
  content: { flex: 1, padding: 20 },
  summaryCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 24,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.soft
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  summaryTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textDark },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  summaryValue: { fontSize: 13, color: COLORS.textDark, fontWeight: '700' },
  totalLabel: { fontSize: 16, color: COLORS.textDark, fontWeight: '800' },
  totalValue: { fontSize: 20, color: COLORS.primary, fontWeight: '900' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  methodCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16,
    borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.soft
  },
  methodCardActive: { borderColor: COLORS.primary, backgroundColor: '#F0FDF4' },
  methodIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  methodDetails: { flex: 1 },
  methodTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textDark, marginBottom: 2 },
  methodSub: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  secureBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, marginBottom: 100 },
  secureText: { fontSize: 11, fontWeight: 'bold', color: COLORS.success, marginLeft: 6 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF',
    padding: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 24, borderTopWidth: 1, borderTopColor: COLORS.border,
    ...SHADOWS.soft,
  },
  payBtn: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 30, alignItems: 'center', justifyContent: 'center', ...SHADOWS.glow },
  payBtnText: { ...TYPOGRAPHY.subtitle, color: COLORS.textLight, fontWeight: 'bold' },
});
