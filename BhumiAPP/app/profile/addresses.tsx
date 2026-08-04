import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Platform, 
  Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootState } from '../../src/store';
import { removeAddress } from '../../src/store/slices/addressSlice';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';

export default function SavedAddressesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const addresses = useSelector((state: RootState) => state.address.addresses);

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Address",
      "Are you sure you want to permanently delete this saved location?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => {
            dispatch(removeAddress(id));
          } 
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* App Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Addresses</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {addresses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="map-marker-off-outline" size={70} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No addresses saved yet</Text>
            <Text style={styles.emptyDesc}>Save your plot or farm location address to schedule soil carbon inspections instantly.</Text>
          </View>
        ) : (
          addresses.map((addr) => (
            <View key={addr.id} style={styles.addressCard}>
              <View style={styles.cardHeader}>
                <View style={styles.typeRow}>
                  <MaterialCommunityIcons 
                    name={addr.type.toLowerCase() === 'home' ? "home-outline" : addr.type.toLowerCase() === 'office' ? "briefcase-outline" : "map-marker-outline"} 
                    size={20} 
                    color={COLORS.primary} 
                  />
                  <Text style={styles.addressType}>{addr.type.toUpperCase()}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(addr.id)} style={styles.deleteBtn}>
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>

              <Text style={styles.fullAddress}>{addr.address}</Text>
              <Text style={styles.areaPincode}>{addr.area}, {addr.city} - {addr.pincode}</Text>
              
              <View style={styles.divider} />
              
              <View style={styles.contactRow}>
                <MaterialCommunityIcons name="account-outline" size={16} color="#64748B" />
                <Text style={styles.contactText}>{addr.name} • {addr.phone}</Text>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add New CTA */}
      <View style={[styles.footer, { paddingBottom: 20 + insets.bottom }]}>
       
        <TouchableOpacity 
          style={styles.addBtn} 
          onPress={() => router.push('/checkout/add-address')}
        >
          <MaterialCommunityIcons name="map-marker-plus-outline" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.addBtnText}>Add New Address</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'ios' ? 50 : 45,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textLight,
  },
  scrollContent: {
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    ...TYPOGRAPHY.subtitle,
    fontWeight: 'bold',
    color: '#64748B',
    marginTop: 16,
  },
  emptyDesc: {
    ...TYPOGRAPHY.caption,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.soft,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 128, 128, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  addressType: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  deleteBtn: {
    padding: 4,
  },
  fullAddress: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  areaPincode: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 6,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.soft,
    elevation: 3,
  },
  addBtnText: {
    ...TYPOGRAPHY.subtitle,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
