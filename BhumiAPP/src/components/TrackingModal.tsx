import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Animated, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../theme/theme';

const { height } = Dimensions.get('window');

interface TrackingModalProps {
  visible: boolean;
  onClose: () => void;
  plotId: string;
  status: string; // "Pending Verification", "Verified", etc.
}

export default function TrackingModal({ visible, onClose, plotId, status }: TrackingModalProps) {
  const [selectedTrackingNode, setSelectedTrackingNode] = useState<number | null>(null);

  // Status mapping logic
  const getStatusNode = (nodeIdx: number) => {
    if (status === 'Verified' || status === 'Approved') {
      return nodeIdx <= 2 ? 'done' : nodeIdx === 3 ? 'active' : 'lock';
    }
    if (status === 'Auditing' || status === 'Under Review') {
      return nodeIdx === 1 ? 'done' : nodeIdx === 2 ? 'active' : 'lock';
    }
    // Default Pending Verification
    return nodeIdx === 1 ? 'done' : nodeIdx === 2 ? 'active' : 'lock';
  };

  const timelineNodes = [
    { idx: 1, title: 'Registration Submitted', desc: 'Baseline credentials and coordinates locked in BhumiCred ledger.', date: 'Today', info: 'Khasra plot registered with auto-fill identity checks.' },
    { idx: 2, title: 'Payment Verification', desc: 'Payment receipt screenshot verification running.', date: 'Pending Visit', info: `Transaction successfully indexed.` },
    { idx: 3, title: 'Audit scheduled', desc: `Physical inspector soil verification visit slated.`, date: 'Scheduled', info: `Assigned inspector: Amit Sharma.` },
    { idx: 4, title: 'Soil Baseline Mapping', desc: 'NPK cores, organic carbon %, and pH analysis calibration.', date: 'Next Week', info: 'Drone scanning registers ground biomass and baseline canopy index.' },
    { idx: 5, title: 'Project Assignment', desc: 'Mapping zero-tillage residue to global green carbon initiatives.', date: 'Awaiting baseline', info: 'Unlocks corporate sponsored offset payout programs.' },
    { idx: 6, title: 'Continuous MRV Monitoring', desc: 'Dynamic remote sensing satellite NDVI chlorophyl absorption audits.', date: 'Seasonal', info: 'Runs bi-weekly baseline canopy density alerts.' },
    { idx: 7, title: 'Dynamic Carbon Indexing', desc: 'Aggregates verified CO₂ absorption indices inside ecological ledger.', date: 'Annually', info: 'Calculated baseline rate: ₹1149 / Acre.' },
    { idx: 8, title: 'Tradable Carbon Credits', desc: 'Minting verified credits and transferring payouts to Eco-Wallet.', date: 'Harvest Milestone', info: 'Verified carbon credits are purchasable by international offset clients.' },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="leaf" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.modalTitle}>BhumiCred Registry</Text>
                <Text style={styles.modalSub}>Climate-Tech Carbon Program Enrollment</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.stepSectionTitle}>Eco-Verification Tracking System</Text>
            <Text style={styles.stepSectionDesc}>
              Continuous satellite imaging scan and soil verification status timeline for Plot #{plotId || 'Unknown'}.
            </Text>

            <View style={styles.timelineList}>
              {timelineNodes.map((node) => {
                const isSelected = selectedTrackingNode === node.idx;
                const nodeStatus = getStatusNode(node.idx);
                return (
                  <View key={node.idx} style={styles.timelineNodeWrapper}>
                    <View style={styles.timelineConnectorCol}>
                      <TouchableOpacity
                        style={[
                          styles.nodeBullet,
                          nodeStatus === 'done' && styles.nodeBulletDone,
                          nodeStatus === 'active' && styles.nodeBulletActive,
                          nodeStatus === 'lock' && styles.nodeBulletLock,
                        ]}
                        onPress={() => setSelectedTrackingNode(node.idx)}
                      >
                        {nodeStatus === 'done' && <MaterialCommunityIcons name="check" size={12} color="#FFFFFF" />}
                        {nodeStatus === 'active' && <View style={styles.nodeActiveCore} />}
                        {nodeStatus === 'lock' && <MaterialCommunityIcons name="lock-outline" size={10} color="#94A3B8" />}
                      </TouchableOpacity>
                      {node.idx < 8 && <View style={[styles.nodeConnectorLine, nodeStatus === 'done' && styles.nodeConnectorLineDone]} />}
                    </View>
                    
                    <TouchableOpacity
                      style={[styles.nodeTextCard, isSelected && styles.nodeTextCardActive]}
                      onPress={() => setSelectedTrackingNode(node.idx)}
                      activeOpacity={0.9}
                    >
                      <View style={styles.nodeCardHeader}>
                        <Text style={[styles.nodeCardTitle, nodeStatus === 'active' && styles.nodeCardTitleActive]}>{node.title}</Text>
                        <Text style={styles.nodeCardDate}>{node.date}</Text>
                      </View>
                      <Text style={styles.nodeCardDesc}>{node.desc}</Text>
                      
                      {isSelected && (
                        <View style={styles.nodeCardExpanded}>
                          <View style={styles.nodeCardExpandedDivider} />
                          <Text style={styles.nodeCardExpandedLabel}>TECHNICAL AUDIT SPECS</Text>
                          <Text style={styles.nodeCardExpandedVal}>{node.info}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    height: height * 0.9,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  modalSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  stepSectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  stepSectionDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 20,
  },
  timelineList: {
    paddingLeft: 4,
    paddingRight: 4,
  },
  timelineNodeWrapper: {
    flexDirection: 'row',
  },
  timelineConnectorCol: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  nodeBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    backgroundColor: '#FFFFFF',
  },
  nodeBulletDone: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  nodeBulletActive: {
    borderColor: COLORS.primary,
  },
  nodeActiveCore: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  nodeBulletLock: {
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  nodeConnectorLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: -2,
    zIndex: 1,
    minHeight: 30,
  },
  nodeConnectorLineDone: {
    backgroundColor: COLORS.success,
  },
  nodeTextCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  nodeTextCardActive: {
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
  },
  nodeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nodeCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  nodeCardTitleActive: {
    color: COLORS.primary,
  },
  nodeCardDate: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  nodeCardDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  nodeCardExpanded: {
    marginTop: 10,
  },
  nodeCardExpandedDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 8,
  },
  nodeCardExpandedLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  nodeCardExpandedVal: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
});
