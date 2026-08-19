import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import AppSafeArea from '../../src/components/AppSafeArea';

const { width } = Dimensions.get('window');

interface AssignedFarmer {
  id: string;
  name: string;
  mobile: string;
  village: string;
  state: string;
  landAcres: number;
  kycStatus: 'approved' | 'pending' | 'rejected' | 'unverified';
  assignedProject: string;
  treesPlanted: number;
  documentsCount: number;
  khasraNumber?: string;
}

const MOCK_FARMERS: AssignedFarmer[] = [
  {
    id: 'FAR-901',
    name: 'Ramkumar Sharma',
    mobile: '+91 98261 44521',
    village: 'Pipariya, Hoshangabad',
    state: 'Madhya Pradesh',
    landAcres: 4.5,
    kycStatus: 'approved',
    assignedProject: 'Narmada Eco-Timber Plantation',
    treesPlanted: 120,
    documentsCount: 4,
    khasraNumber: '142/2',
  },
  {
    id: 'FAR-902',
    name: 'Shivpal Singh Patel',
    mobile: '+91 94250 88210',
    village: 'Sehore, MP',
    state: 'Madhya Pradesh',
    landAcres: 8.2,
    kycStatus: 'approved',
    assignedProject: 'Malwa Agroforestry Project',
    treesPlanted: 340,
    documentsCount: 6,
  },
  {
    id: 'FAR-903',
    name: 'Anita Devi Kurmi',
    mobile: '+91 88190 33412',
    village: 'Sarni, Betul',
    state: 'Madhya Pradesh',
    landAcres: 2.8,
    kycStatus: 'pending',
    assignedProject: 'Satpura Green Canopy',
    treesPlanted: 75,
    documentsCount: 3,
  },
  {
    id: 'FAR-904',
    name: 'Devendra Yadav',
    mobile: '+91 97520 11984',
    village: 'Itarsi, MP',
    state: 'Madhya Pradesh',
    landAcres: 6.0,
    kycStatus: 'approved',
    assignedProject: 'Narmada Eco-Timber Plantation',
    treesPlanted: 210,
    documentsCount: 5,
  },
];

export default function FarmersTabScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFarmer, setSelectedFarmer] = useState<AssignedFarmer | null>(null);

  const filteredFarmers = MOCK_FARMERS.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.mobile.includes(searchQuery),
  );

  const getKycBadge = (status: AssignedFarmer['kycStatus']) => {
    switch (status) {
      case 'approved':
        return { label: 'KYC Verified', color: '#16A34A', bg: '#DCFCE7' };
      case 'pending':
        return { label: 'KYC Pending', color: '#D97706', bg: '#FEF3C7' };
      case 'rejected':
        return { label: 'KYC Rejected', color: '#DC2626', bg: '#FEE2E2' };
      default:
        return { label: 'Unverified', color: '#64748B', bg: '#F1F5F9' };
    }
  };

  return (
    <AppSafeArea edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Assigned Farmers</Text>
            <Text style={styles.subtitle}>Manage & verify onboarded farmers</Text>
          </View>
          <View style={styles.statsBadge}>
            <MaterialCommunityIcons name="account-group" size={18} color={COLORS.primary} />
            <Text style={styles.statsBadgeText}>{MOCK_FARMERS.length} Total</Text>
          </View>
        </View>

        {/* Search Input */}
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={22} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, village, or phone..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Farmers List */}
        <FlatList
          data={filteredFarmers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const badge = getKycBadge(item.kycStatus);
            return (
              <TouchableOpacity
                style={styles.farmerCard}
                activeOpacity={0.85}
                onPress={() => setSelectedFarmer(item)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.farmerName}>{item.name}</Text>
                    <Text style={styles.farmerSubText}>
                      <MaterialCommunityIcons name="map-marker-outline" size={13} color="#64748B" />{' '}
                      {item.village}
                    </Text>
                  </View>
                  <View style={[styles.kycBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.kycBadgeText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardGrid}>
                  <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>Assigned Land</Text>
                    <Text style={styles.gridVal}>{item.landAcres} Acres</Text>
                  </View>
                  <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>Trees Planted</Text>
                    <Text style={styles.gridVal}>{item.treesPlanted} Trees</Text>
                  </View>
                  <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>Documents</Text>
                    <Text style={styles.gridVal}>{item.documentsCount} Vaulted</Text>
                  </View>
                </View>

                {item.khasraNumber ? (
                  <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="file-document-outline" size={13} color={COLORS.primary} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.primaryDark, marginLeft: 4 }}>
                      Plot Khasra No: {item.khasraNumber}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.projectFooter}>
                  <MaterialCommunityIcons name="sprout-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.projectFooterText} numberOfLines={1}>
                    {item.assignedProject}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />

        {/* Farmer Details Modal */}
        {selectedFarmer && (
          <Modal
            animationType="slide"
            transparent
            visible={!!selectedFarmer}
            onRequestClose={() => setSelectedFarmer(null)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Farmer Detail & Record</Text>
                  <TouchableOpacity onPress={() => setSelectedFarmer(null)}>
                    <MaterialCommunityIcons name="close" size={24} color="#0F172A" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.profileHeaderBlock}>
                    <View style={styles.largeAvatar}>
                      <Text style={styles.largeAvatarText}>{selectedFarmer.name.charAt(0)}</Text>
                    </View>
                    <Text style={styles.modalFarmerName}>{selectedFarmer.name}</Text>
                    <Text style={styles.modalFarmerPhone}>{selectedFarmer.mobile}</Text>
                    <Text style={styles.modalFarmerAddress}>
                      {selectedFarmer.village}, {selectedFarmer.state}
                    </Text>
                  </View>

                  <View style={styles.infoSection}>
                    <Text style={styles.sectionHeading}>KYC & Verification Status</Text>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoRowLabel}>Status</Text>
                      <Text
                        style={[
                          styles.infoRowValue,
                          { color: getKycBadge(selectedFarmer.kycStatus).color },
                        ]}
                      >
                        {getKycBadge(selectedFarmer.kycStatus).label}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoRowLabel}>Assigned Project</Text>
                      <Text style={styles.infoRowValue}>{selectedFarmer.assignedProject}</Text>
                    </View>
                  </View>

                  <View style={styles.infoSection}>
                    <Text style={styles.sectionHeading}>Land & GIS Information</Text>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoRowLabel}>Total Acreage</Text>
                      <Text style={styles.infoRowValue}>{selectedFarmer.landAcres} Acres</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoRowLabel}>Trees Planted</Text>
                      <Text style={styles.infoRowValue}>{selectedFarmer.treesPlanted} Trees</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoRowLabel}>GIS Polygon</Text>
                      <Text style={[styles.infoRowValue, { color: COLORS.primary }]}>
                        Verified (3 Boundary Points)
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoSection}>
                    <Text style={styles.sectionHeading}>Vaulted Documents</Text>
                    <View style={styles.docItem}>
                      <MaterialCommunityIcons name="file-document-outline" size={20} color={COLORS.primary} />
                      <Text style={styles.docName}>Land Khasra / B1 Proof.pdf</Text>
                    </View>
                    <View style={styles.docItem}>
                      <MaterialCommunityIcons name="card-account-details-outline" size={20} color={COLORS.primary} />
                      <Text style={styles.docName}>Aadhaar Verification Card.pdf</Text>
                    </View>
                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </AppSafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  statsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statsBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  farmerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0F766E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  farmerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  farmerSubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  kycBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  kycBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  cardGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridItem: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  gridVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  projectFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  projectFooterText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 6,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  profileHeaderBlock: {
    alignItems: 'center',
    marginBottom: 20,
  },
  largeAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0F766E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  largeAvatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalFarmerName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalFarmerPhone: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  modalFarmerAddress: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  infoSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoRowLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  infoRowValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  docName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    marginLeft: 10,
  },
});
