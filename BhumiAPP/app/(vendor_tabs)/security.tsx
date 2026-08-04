import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { COLORS } from '../../src/theme/theme';
import DetailPageHeader from '../../src/components/DetailPageHeader';
import { EmptyState } from '../../src/components/EmptyState';

export default function VendorSecurityScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <DetailPageHeader title="Security" />
      <View style={styles.content}>
        <EmptyState
          icon="shield-lock-outline"
          title="Security Settings"
          description="Change Password and other security settings for vendor accounts are coming soon."
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16 },
});
