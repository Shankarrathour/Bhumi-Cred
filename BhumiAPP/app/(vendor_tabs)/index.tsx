import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../src/theme/theme';
import api from '../../src/api/apiClient';
import { formatMoney, mockProducts, vendorProfileFallback } from '../../src/vendor/vendorData';
import { useAuthStore } from '../../src/store/authStore';
import AppHeader from '../../src/components/AppHeader';
import SideDrawer from '../../src/components/SideDrawer';

const actions = [
  ['plus-box-outline', 'Add Product', '/(vendor_tabs)/add-product'], ['package-variant-closed', 'Products', '/(vendor_tabs)/products'],
  ['truck-delivery-outline', 'Orders', '/(vendor_tabs)/orders'], ['wallet-outline', 'Wallet', '/(vendor_tabs)/profile'],
  ['chart-line', 'Analytics', '/(vendor_tabs)/profile'], ['headset', 'Support', '/(vendor_tabs)/profile'],
] as const;

export default function VendorDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(vendorProfileFallback);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const load = async () => {
    try {
      const [profileResult, dashboardResult] = await Promise.allSettled([api.get('/vendor/auth/me'), api.get('/vendor/dashboard')]);
      if (profileResult.status === 'fulfilled') setProfile((current) => ({ ...current, ...profileResult.value.data }));
      if (dashboardResult.status === 'fulfilled') setDashboard(dashboardResult.value.data);
    } finally { setLoading(false); setRefreshing(false); }
  };
  useEffect(() => { load(); }, []);

  const product = dashboard?.product_summary;
  const orders = dashboard?.order_summary;
  const sales = dashboard?.sales_summary;
  const totalProducts = product?.total ?? mockProducts.length;
  const activeProducts = product?.active ?? mockProducts.filter((item) => item.status === 'Active').length;
  const pendingProducts = product?.pending_approval ?? mockProducts.filter((item) => item.status === 'Pending').length;

  return <View style={styles.screen}>
    <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
    <AppHeader
      onMenuPress={() => setDrawerVisible(true)}
      onNotificationPress={() => router.push('/(vendor_tabs)/notifications')}
    />
    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={COLORS.primary} />}>
      <View style={styles.hero}>
        <View style={styles.heroTop}><View><Text style={styles.greeting}>Hi, {profile.name || 'Vendor'}</Text><Text style={styles.business}>{profile.business_name || 'Your Business'}</Text></View><View style={styles.avatar}><Text style={styles.avatarText}>{(profile.business_name || 'B').charAt(0)}</Text></View></View>
        <View style={styles.heroMeta}><MaterialCommunityIcons name="map-marker-outline" color="#D1FAE5" size={15} /><Text style={styles.location}>{profile.address || 'Indore, Madhya Pradesh'}</Text><View style={styles.online}><View style={styles.onlineDot} /><Text style={styles.onlineText}>Online</Text></View></View>
      </View>
      {loading ? <View style={styles.loadingCard}><ActivityIndicator color={COLORS.primary} /><Text style={styles.muted}>Loading business overview…</Text></View> : <>
        <View style={styles.statsCard}><View style={styles.statsHeading}><Text style={styles.statsTitle}>Business overview</Text><Text style={styles.period}>This month</Text></View><View style={styles.statsGrid}>
          <Stat icon="package-variant" label="Total Products" value={String(totalProducts)} /><Stat icon="check-decagram-outline" label="Active" value={String(activeProducts)} /><Stat icon="clock-outline" label="Pending" value={String(pendingProducts)} /><Stat icon="wallet-outline" label="Wallet" value={formatMoney(Number(profile.wallet_balance ?? vendorProfileFallback.wallet_balance))} accent />
        </View></View>
        <Text style={styles.sectionTitle}>Quick actions</Text><View style={styles.actions}>{actions.map(([icon, label, path]) => <TouchableOpacity key={label} style={styles.action} onPress={() => router.push(path)}><View style={styles.actionIcon}><MaterialCommunityIcons name={icon} size={22} color={COLORS.primary} /></View><Text style={styles.actionText}>{label}</Text></TouchableOpacity>)}</View>
        <Text style={styles.sectionTitle}>Recent activity</Text><View style={styles.activityCard}>{[
          ['check-circle-outline', 'Product approved', 'Premium Basmati Rice is now live', '#059669'], ['cart-arrow-down', 'New order received', 'Order #10245 • ' + formatMoney(1350), '#2563EB'], ['wallet-plus-outline', 'Payment credited', formatMoney(2480) + ' added to wallet', '#7C3AED'], ['package-variant-plus', 'Product added', 'Organic Turmeric is pending review', '#D97706'],
        ].map(([icon, title, detail, color], index) => <View key={title} style={[styles.activity, index !== 3 && styles.activityBorder]}><View style={[styles.activityIcon, { backgroundColor: `${color}14` }]}><MaterialCommunityIcons name={icon as any} size={20} color={color} /></View><View style={{ flex: 1 }}><Text style={styles.activityTitle}>{title}</Text><Text style={styles.activityDetail}>{detail}</Text></View><Text style={styles.activityTime}>{index + 1}h</Text></View>)}</View>
        <Text style={styles.sectionTitle}>Business performance</Text><View style={styles.performance}><Metric label="Monthly sales" value={formatMoney(sales?.gross_revenue || 48000)} /><Metric label="Total revenue" value="₹2.4 Lakhs" /><Metric label="Orders completed" value={String(orders?.total || 168)} /><Metric label="Customer rating" value="4.8 ★" /></View>
      </>}
    </ScrollView>
    <SideDrawer
      visible={drawerVisible}
      onClose={() => setDrawerVisible(false)}
      userName={profile.name || 'Vendor'}
      userSubtitle="Verified Vendor ID"
      userPhotoUri={profile.profile_photo_url}
      items={[
        { label: 'Profile', icon: 'account-outline', onPress: () => router.push('/(vendor_tabs)/profile') },
        { label: 'Bank Details', icon: 'bank-outline', onPress: () => router.push('/(vendor_tabs)/bank-details') },
        { label: 'Notifications', icon: 'bell-outline', onPress: () => router.push('/(vendor_tabs)/notifications') },
        { label: 'Security', icon: 'shield-lock-outline', onPress: () => router.push('/(vendor_tabs)/security') },
        { label: 'Help & Support', icon: 'headset', onPress: () => router.push('/(vendor_tabs)/help-support') },
      ]}
      onLogout={() => { useAuthStore.getState().logout(); router.replace('/(auth)/login'); }}
    />
  </View>;
}
function Stat({ icon, label, value, accent }: any) { return <View style={styles.stat}><MaterialCommunityIcons name={icon} size={20} color={accent ? COLORS.accentDark : COLORS.primaryLight} /><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }
function Metric({ label, value }: any) { return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>; }
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.primary },
  container: { flex: 1, backgroundColor: COLORS.primary }, content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 28 }, hero: { backgroundColor: '#063B2E', padding: 25, borderRadius: 22, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', ...SHADOWS.medium }, heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, greeting: { color: '#D1FAE5', fontSize: 14, fontWeight: '600' }, business: { color: '#FFF', fontSize: 22, fontWeight: '800', marginTop: 4 }, avatar: { height: 46, width: 46, borderRadius: 23, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: COLORS.primaryDark, fontSize: 20, fontWeight: '900' }, heroMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 26, gap: 6 }, location: { color: '#D1FAE5', fontSize: 12, flex: 1 }, online: { flexDirection: 'row', gap: 5, alignItems: 'center', backgroundColor: 'rgba(132,204,22,0.15)', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5 }, onlineDot: { height: 6, width: 6, borderRadius: 3, backgroundColor: COLORS.accent }, onlineText: { color: '#E5FFC2', fontSize: 11, fontWeight: '700' }, loadingCard: { backgroundColor: '#F7F8FA', padding: 22, borderRadius: 18, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#E5E7EB' }, muted: { color: COLORS.textSecondary }, statsCard: { backgroundColor: '#F7F8FA', padding: 14, paddingTop: 16, borderRadius: 20, marginBottom: 18, borderWidth: 1, borderColor: '#E5E7EB', ...SHADOWS.soft }, statsHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }, statsTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textDark }, sectionTitle: { fontSize: 17, fontWeight: '800', color: '#FFF', marginBottom: 12 }, period: { color: COLORS.textSecondary, fontSize: 12 }, statsGrid: { flexDirection: 'row', flexWrap: 'wrap' }, stat: { width: '50%', paddingVertical: 8, paddingRight: 8 }, statValue: { fontSize: 19, fontWeight: '800', color: COLORS.textDark, marginTop: 5 }, statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }, action: { width: '31%', backgroundColor: '#F7F8FA', borderRadius: 14, paddingVertical: 11, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', ...SHADOWS.soft }, actionIcon: { height: 42, width: 42, borderRadius: 12, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }, actionText: { fontSize: 10.5, fontWeight: '700', color: COLORS.textDark, textAlign: 'center' }, activityCard: { backgroundColor: '#F7F8FA', borderRadius: 18, paddingHorizontal: 14, marginBottom: 18, borderWidth: 1, borderColor: '#E5E7EB', ...SHADOWS.soft }, activity: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10 }, activityBorder: { borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }, activityIcon: { height: 36, width: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, activityTitle: { fontSize: 12, fontWeight: '800', color: COLORS.textDark }, activityDetail: { fontSize: 10.5, color: COLORS.textSecondary, marginTop: 3 }, activityTime: { color: COLORS.textSecondary, fontSize: 9, fontWeight: '600' }, performance: { backgroundColor: '#F7F8FA', borderRadius: 20, padding: 6, flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderColor: '#E5E7EB', ...SHADOWS.soft }, metric: { width: '50%', padding: 12 }, metricValue: { color: COLORS.primaryDark, fontSize: 17, fontWeight: '800' }, metricLabel: { color: COLORS.textSecondary, fontSize: 11, marginTop: 4 },
});
