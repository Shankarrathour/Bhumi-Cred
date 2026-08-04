import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { COLORS } from '../../src/theme/theme';
import DetailPageHeader from '../../src/components/DetailPageHeader';
import { EmptyState } from '../../src/components/EmptyState';

export default function VendorBankDetailsScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <DetailPageHeader title="Bank Details" />
      <View style={styles.content}>
        <EmptyState
          icon="bank-outline"
          title="Bank Details"
          description="Bank account management for vendors is coming soon. You'll be able to add and verify your payout account here."
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16 },
});
