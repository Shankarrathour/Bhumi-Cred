import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Animated, Dimensions, Alert, ActivityIndicator, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../theme/theme';
import { useLandStore } from '../store/landStore';
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';
import api from '../api/apiClient';
import { useRouter } from 'expo-router';

const { height, width } = Dimensions.get('window');

interface TrackingModalProps {
  visible: boolean;
  onClose: () => void;
  plotId: string;
  status: string; // "Submitted", "Under Review", "Correction Required", etc.
}

type ModalTab = 'timeline' | 'specs' | 'docs' | 'map';

export default function TrackingModal({ visible, onClose, plotId, status }: TrackingModalProps) {
  const router = useRouter();
  const plots = useLandStore((state) => state.plots);
  const fetchPlots = useLandStore((state) => state.fetchPlots);
  const user = useAuthStore((state) => state.user);
  const plot = plots.find((p) => p.id === plotId);

  const addNotification = useNotificationStore((state) => state.addNotification);

  const [modalTab, setModalTab] = useState<ModalTab>('timeline');
  const [selectedTrackingNode, setSelectedTrackingNode] = useState<number | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Auto-fetch latest plot data from backend whenever modal is opened
  React.useEffect(() => {
    if (visible) {
      fetchPlots().catch(() => {});
    }
  }, [visible, fetchPlots]);

  const handleSimulateAdminStatusChange = (newStatus: string) => {
    if (!plot) return;

    if (newStatus === 'approved' || newStatus === 'project_assigned') {
      useAuthStore.getState().setVerificationStatus('approved');
    }

    useLandStore.setState((state) => ({
      plots: state.plots.map((p) =>
        p.id === plotId
          ? {
              ...p,
              status: newStatus,
              correctionFields: newStatus === 'correction_required' ? ['land_document_url'] : p.correctionFields,
              remarks: newStatus === 'rejected' ? 'Title deed document illegible or boundary mismatch.' : newStatus === 'project_assigned' ? 'MP Afforestation Q1 Block' : p.remarks
            }
          : p
      )
    }));

    const notifTitles: Record<string, string> = {
      'submitted': 'Land Application Received 📋',
      'under_review': 'Your Application is Under Review 🔍',
      'correction_required': 'Action Required on Land Application ⚠️',
      'approved': 'Your Land has Been Approved ✅',
      'project_assigned': 'Project Assigned to Your Land 🌳',
      'rejected': 'Land Application Rejected ❌'
    };

    const notifMsgs: Record<string, string> = {
      'submitted': `Land application for ${plot.acres} Acres submitted successfully.`,
      'under_review': 'GIS check & document verification in progress by Admin team.',
      'correction_required': 'Admin requested a clearer photo of boundary trees/deed.',
      'approved': `Congratulations! Your plot of ${plot.acres} Acres has been verified.`,
      'project_assigned': 'Assigned to Carbon Credit Project MP-2026-08.',
      'rejected': 'Application rejected due to document mismatch. Tap to appeal.'
    };

    addNotification({
      title: notifTitles[newStatus] || 'Admin Status Update',
      message: notifMsgs[newStatus] || `Admin changed status to ${newStatus}`,
      type: newStatus === 'correction_required' ? 'correction' : newStatus === 'approved' ? 'approved' : newStatus === 'project_assigned' ? 'project_assigned' : 'admin_review'
    });
  };

  const rawStatusStr = (plot?.status || status || '').toLowerCase();
  const normalizedStatus = rawStatusStr.replace(/\s+/g, '_');

  // Status mapping logic for timeline steps
  const getStatusNode = (nodeIdx: number) => {
    if (normalizedStatus === 'approved' || normalizedStatus === 'verified' || normalizedStatus === 'project_assigned') {
      return 'done';
    }
    if (normalizedStatus === 'rejected') {
      return nodeIdx <= 4 ? 'done' : 'fail';
    }
    if (normalizedStatus === 'correction_required') {
      return nodeIdx <= 2 ? 'done' : nodeIdx === 3 ? 'warning' : 'lock';
    }
    if (normalizedStatus === 'under_review' || normalizedStatus === 'auditing') {
      return nodeIdx <= 2 ? 'done' : nodeIdx === 3 ? 'active' : 'lock';
    }
    return nodeIdx === 1 ? 'done' : nodeIdx === 2 ? 'active' : 'lock';
  };

  const timelineNodes = [
    { idx: 1, title: 'Submitted / प्रस्तुत किया', desc: 'Land application submitted successfully and locked in ledger.', date: 'Step 1', info: 'Land registration details and photo uploads are archived.' },
    { idx: 2, title: 'Documents Check / दस्तावेज़ जांच', desc: 'Auditor verification of land registry document & Khasra details.', date: 'Step 2', info: 'Ensures title ownership matches farmer identity records.' },
    { idx: 3, title: 'GIS Check / जीआईएस जांच', desc: 'Satellite geofencing analysis to verify cadastral boundary lines.', date: 'Step 3', info: 'Validates land coordinates against forest overlay map files.' },
    { idx: 4, title: 'Field Verification / फील्ड सत्यापन', desc: 'Soil sampling and drone biomass calibration scans.', date: 'Step 4', info: 'Measures organic carbon % rate and pH balance indicators.' },
    { idx: 5, title: 'Approved / स्वीकृत', desc: 'Canopy registration active and ecological program approved.', date: 'Final Step', info: 'Unlocks Eco-Wallet carbon payout credits.' }
  ];

  // Pick file helper for corrections
  const handlePickFile = async (field: string) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please enable gallery access to choose document photo proofs.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setUploadedFiles((prev) => ({
          ...prev,
          [field]: result.assets[0].uri,
        }));
      }
    } catch (err) {
      console.log('Error choosing file', err);
    }
  };

  const handleClearFile = (field: string) => {
    setUploadedFiles((prev) => {
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
  };

  // Submit corrections
  const handleResubmitCorrections = async () => {
    if (!plot) return;
    setIsUploading(true);
    try {
      await api.put(`/farmer/profile/land/${plotId}`, {
        land_document_url: 'https://bhumicred-docs.s3.amazonaws.com/resubmitted_deed.jpg',
        name: plot.name,
      });
      await fetchPlots();
      Alert.alert('Corrections Submitted', 'Your correction uploads were successfully sent to the auditor.');
      onClose();
    } catch (e) {
      Alert.alert('Upload Failed', 'Failed to submit correction files. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Cancel application
  const handleCancelApplication = () => {
    Alert.alert(
      'Cancel Application',
      'Are you sure you want to cancel this land registration application? This cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel Application',
          style: 'destructive',
          onPress: async () => {
            setIsCancelling(true);
            try {
              await api.delete(`/farmer/profile/land/${plotId}`);
              await fetchPlots();
              Alert.alert('Cancelled', 'Your land application has been cancelled and removed.');
              onClose();
            } catch (e) {
              Alert.alert('Error', 'Could not cancel application at this time.');
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ]
    );
  };

  const requiredFields = plot?.correctionFields || [];
  const allFilesPicked = requiredFields.every((f) => !!uploadedFiles[f]);

  // Fallback Geofence coordinates
  const dummyPolygon = [
    { latitude: plot?.geoCoords?.latitude ? plot.geoCoords.latitude + 0.0005 : 23.0230, longitude: plot?.geoCoords?.longitude ? plot.geoCoords.longitude + 0.0005 : 77.0129 },
    { latitude: plot?.geoCoords?.latitude ? plot.geoCoords.latitude + 0.0005 : 23.0230, longitude: plot?.geoCoords?.longitude ? plot.geoCoords.longitude - 0.0005 : 77.0119 },
    { latitude: plot?.geoCoords?.latitude ? plot.geoCoords.latitude - 0.0005 : 23.0220, longitude: plot?.geoCoords?.longitude ? plot.geoCoords.longitude - 0.0005 : 77.0119 },
    { latitude: plot?.geoCoords?.latitude ? plot.geoCoords.latitude - 0.0005 : 23.0220, longitude: plot?.geoCoords?.longitude ? plot.geoCoords.longitude + 0.0005 : 77.0129 },
  ];

  const polygonPoints = plot?.boundaryPolygon && plot.boundaryPolygon.length > 0 ? plot.boundaryPolygon : dummyPolygon;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalBackdrop as any}>
        <View style={styles.modalContent as any}>
          
          {/* Header */}
          <View style={styles.modalHeader as any}>
            <View style={styles.headerLeft as any}>
              <View style={styles.iconCircle as any}>
                <MaterialCommunityIcons name="leaf" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.modalTitle as any}>{plot?.name || 'Registered Land Plot'}</Text>
                <Text style={styles.modalSub as any}>Plot ID: {plotId?.slice(-8).toUpperCase()}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn as any}>
              <MaterialCommunityIcons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Segmented Tab Switcher */}
          <View style={styles.tabSwitcher as any}>
            {[
              { id: 'timeline', label: 'Timeline', icon: 'clock-outline' },
              { id: 'specs', label: 'Specs', icon: 'shield-check-outline' },
              { id: 'docs', label: 'Docs/Photos', icon: 'file-document-outline' },
              { id: 'map', label: 'Map/GIS', icon: 'google-maps' }
            ].map((t) => {
              const isActive = modalTab === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.tabButton, isActive && styles.tabButtonActive] as any}
                  onPress={() => setModalTab(t.id as any)}
                >
                  <MaterialCommunityIcons name={t.icon as any} size={14} color={isActive ? '#FFFFFF' : '#64748B'} />
                  <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive] as any}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent as any}>
            
            {/* 1. TIMELINE TAB */}
            {modalTab === 'timeline' && (
              <View>
                {/* Dynamic Status Banner Card */}
                {(() => {
                  let bannerBg = '#EFF6FF';
                  let bannerBorder = '#3B82F6';
                  let bannerText = '#1E40AF';
                  let bannerSubText = '#2563EB';
                  let bannerIcon = 'clock-outline';
                  let statusLabel = 'Under Review / समीक्षा के तहत';
                  let statusDesc = 'Your land geofencing and title deed document review are actively running.';

                  if (normalizedStatus === 'pending' || normalizedStatus === 'submitted') {
                    bannerBg = '#FFFBEB';
                    bannerBorder = '#F59E0B';
                    bannerText = '#78350F';
                    bannerSubText = '#D97706';
                    bannerIcon = 'file-send-outline';
                    statusLabel = 'Application Submitted / प्रस्तुत किया गया';
                    statusDesc = 'Registration details received. Placed under queue for document checks.';
                  } else if (normalizedStatus === 'correction_required') {
                    bannerBg = '#FFF7ED';
                    bannerBorder = '#F97316';
                    bannerText = '#7C2D12';
                    bannerSubText = '#EA580C';
                    bannerIcon = 'alert-decagram-outline';
                    statusLabel = 'Correction Required / कार्रवाई आवश्यक';
                    statusDesc = 'Auditor requested updates on specific fields. Please replace documents below.';
                  } else if (normalizedStatus === 'approved' || normalizedStatus === 'verified') {
                    bannerBg = '#ECFDF5';
                    bannerBorder = '#10B981';
                    bannerText = '#065F46';
                    bannerSubText = '#047857';
                    bannerIcon = 'checkbox-marked-circle-outline';
                    statusLabel = 'Approved / स्वीकृत';
                    statusDesc = 'Land boundary validated successfully! Carbon canopy program active.';
                  } else if (normalizedStatus === 'project_assigned') {
                    bannerBg = '#F5F3FF';
                    bannerBorder = '#8B5CF6';
                    bannerText = '#4C1D95';
                    bannerSubText = '#7C3AED';
                    bannerIcon = 'layers-outline';
                    statusLabel = 'Project Assigned / परियोजना आवंटित';
                    statusDesc = `Enrollment inside corporate offset carbon canopy program confirmed. Project: ${plot?.remarks || 'MP Afforestation Q1'}`;
                  } else if (normalizedStatus === 'rejected') {
                    bannerBg = '#FEF2F2';
                    bannerBorder = '#EF4444';
                    bannerText = '#7F1D1D';
                    bannerSubText = '#DC2626';
                    bannerIcon = 'close-circle-outline';
                    statusLabel = 'Application Rejected / अस्वीकृत';
                    statusDesc = `Rejected. Reason: ${plot?.remarks || 'Title document illegible or boundary mismatch.'}`;
                  }

                  return (
                    <View style={[styles.adminVerifyCard, { backgroundColor: bannerBg, borderColor: bannerBorder }] as any}>
                      <MaterialCommunityIcons name={bannerIcon as any} size={24} color={bannerSubText} style={{ marginRight: 10 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.adminVerifyTitle, { color: bannerText }] as any}>{statusLabel}</Text>
                        <Text style={[styles.adminVerifySub, { color: bannerSubText }] as any}>{statusDesc}</Text>
                      </View>
                    </View>
                  );
                })()}

                {/* Dynamic Interactive Correction Panel */}
                {normalizedStatus === 'correction_required' && requiredFields.length > 0 && (
                  <View style={styles.correctionFormCard as any}>
                    <Text style={styles.correctionSectionTitle as any}>Provide Document Corrections</Text>
                    <Text style={styles.correctionSectionDesc as any}>
                      Instructions: Replace only the items flagged below to resume verification review.
                    </Text>
                    
                    {requiredFields.map((field) => (
                      <View key={field} style={styles.correctionFieldRow as any}>
                        <Text style={styles.correctionLabel as any}>{field}</Text>
                        {uploadedFiles[field] ? (
                          <View style={styles.uploadedContainer as any}>
                            <Image source={{ uri: uploadedFiles[field] }} style={styles.thumbnail as any} />
                            <View style={{ flex: 1, marginLeft: 10 }}>
                              <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.success }}>Ready to upload</Text>
                              <TouchableOpacity onPress={() => handleClearFile(field)} style={{ marginTop: 4 }}>
                                <Text style={{ fontSize: 12, color: '#EF4444', fontWeight: '700' }}>Clear / हटाएं</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : (
                          <TouchableOpacity onPress={() => handlePickFile(field)} style={styles.pickFileBtn as any}>
                            <MaterialCommunityIcons name="camera" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                            <Text style={styles.pickFileText as any}>Upload Correction</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}

                    <TouchableOpacity 
                      style={[styles.resubmitBtn, !allFilesPicked && styles.resubmitBtnDisabled] as any}
                      disabled={!allFilesPicked || isUploading}
                      onPress={handleResubmitCorrections}
                    >
                      {isUploading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.resubmitBtnText as any}>Resubmit Corrections</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {/* Status Timeline */}
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.timelineListTitle as any}>Verification Progress Timeline</Text>
                  
                  <View style={styles.timelineList as any}>
                    {timelineNodes.map((node) => {
                      const isSelected = selectedTrackingNode === node.idx;
                      const nodeStatus = getStatusNode(node.idx);
                      
                      return (
                        <View key={node.idx} style={styles.timelineNodeWrapper as any}>
                          <View style={styles.timelineConnectorCol as any}>
                            <TouchableOpacity
                              style={[
                                styles.nodeBullet,
                                nodeStatus === 'done' && styles.nodeBulletDone,
                                nodeStatus === 'active' && styles.nodeBulletActive,
                                nodeStatus === 'warning' && styles.nodeBulletWarning,
                                nodeStatus === 'fail' && styles.nodeBulletFail,
                                nodeStatus === 'lock' && styles.nodeBulletLock,
                              ] as any}
                              onPress={() => setSelectedTrackingNode(node.idx)}
                            >
                              {nodeStatus === 'done' && <MaterialCommunityIcons name="check" size={12} color="#FFFFFF" />}
                              {nodeStatus === 'active' && <View style={styles.nodeActiveCore as any} />}
                              {nodeStatus === 'warning' && <MaterialCommunityIcons name="alert" size={12} color="#FFFFFF" />}
                              {nodeStatus === 'fail' && <MaterialCommunityIcons name="close" size={12} color="#FFFFFF" />}
                              {nodeStatus === 'lock' && <MaterialCommunityIcons name="lock-outline" size={10} color="#94A3B8" />}
                            </TouchableOpacity>
                            {node.idx < 5 && (
                              <View style={[
                                styles.nodeConnectorLine,
                                nodeStatus === 'done' && styles.nodeConnectorLineDone
                              ] as any} />
                            )}
                          </View>
                          
                          <TouchableOpacity
                            style={[styles.nodeTextCard, isSelected && styles.nodeTextCardActive] as any}
                            onPress={() => setSelectedTrackingNode(node.idx)}
                            activeOpacity={0.9}
                          >
                            <View style={styles.nodeCardHeader as any}>
                              <Text style={[
                                styles.nodeCardTitle,
                                nodeStatus === 'active' && styles.nodeCardTitleActive,
                                nodeStatus === 'warning' && { color: '#D97706' },
                              ] as any}>{node.title}</Text>
                              <Text style={styles.nodeCardDate as any}>{node.date}</Text>
                            </View>
                            <Text style={styles.nodeCardDesc as any}>{node.desc}</Text>
                            
                            {isSelected && (
                              <View style={styles.nodeCardExpanded as any}>
                                <View style={styles.nodeCardExpandedDivider as any} />
                                <Text style={styles.nodeCardExpandedLabel as any}>VERIFICATION SPECS</Text>
                                <Text style={styles.nodeCardExpandedVal as any}>{node.info}</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}

            {/* 2. SPECS TAB */}
            {modalTab === 'specs' && (
              <View style={styles.detailContainer as any}>
                <View style={styles.sectionHeaderRow as any}>
                  <MaterialCommunityIcons name="card-bulleted-settings-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.sectionTitle as any}>Cadastral Specifications</Text>
                </View>

                <View style={styles.specsGrid as any}>
                  <View style={styles.specBox as any}>
                    <Text style={styles.specLabel as any}>LAND OWNER</Text>
                    <Text style={styles.specVal as any}>
                      {user?.fullName || 'Farmer'} ({user?.farmerId || 'FAR-000001'})
                    </Text>
                  </View>
                  <View style={styles.specBox as any}>
                    <Text style={styles.specLabel as any}>SURVEY NUMBER / KHASRA</Text>
                    <Text style={styles.specVal as any}>Khasra #{plot?.khasraNumber || '402/A'}</Text>
                  </View>
                  <View style={styles.specBox as any}>
                    <Text style={styles.specLabel as any}>LAND ACREAGE</Text>
                    <Text style={styles.specVal as any}>{plot?.acres || 14.5} Acres</Text>
                  </View>
                  <View style={styles.specBox as any}>
                    <Text style={styles.specLabel as any}>SOIL TYPE</Text>
                    <Text style={styles.specVal as any}>{plot?.soilType || 'Black Soil (SOC 1.2%)'}</Text>
                  </View>
                  <View style={styles.specBox as any}>
                    <Text style={styles.specLabel as any}>CROP CLASSIFICATION</Text>
                    <Text style={styles.specVal as any}>{plot?.cropType || 'Soybeans'}</Text>
                  </View>
                  <View style={styles.specBox as any}>
                    <Text style={styles.specLabel as any}>IRRIGATION SOURCE</Text>
                    <Text style={styles.specVal as any}>{plot?.irrigationType || 'Tubewell'}</Text>
                  </View>
                  <View style={styles.specBox as any}>
                    <Text style={styles.specLabel as any}>REGISTRATION DATE</Text>
                    <Text style={styles.specVal as any}>
                      {plot?.registrationDate ? new Date(plot.registrationDate).toLocaleDateString('en-IN') : 'Today'}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider as any} />

                <View style={styles.sectionHeaderRow as any}>
                  <MaterialCommunityIcons name="shield-check-outline" size={20} color="#0D9488" />
                  <Text style={styles.sectionTitle as any}>Active Insurance Protection</Text>
                </View>

                <View style={styles.insuranceCoverBox as any}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#111827' }}>Tree Shield Eco-Canopy Plan</Text>
                    <View style={styles.badgeSuccess as any}>
                      <Text style={styles.badgeSuccessText as any}>ACTIVE</Text>
                    </View>
                  </View>
                  <View style={{ marginTop: 10, gap: 6 }}>
                    <View style={styles.infoRow as any}>
                      <Text style={styles.infoLabel as any}>Total Sum Insured:</Text>
                      <Text style={styles.infoVal as any}>₹{((plot?.acres || 14.5) * 3000).toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.infoRow as any}>
                      <Text style={styles.infoLabel as any}>Coverage Rate:</Text>
                      <Text style={styles.infoVal as any}>₹3,000 / Acre</Text>
                    </View>
                    <View style={styles.infoRow as any}>
                      <Text style={styles.infoLabel as any}>Policy Duration:</Text>
                      <Text style={styles.infoVal as any}>12 Months</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* 3. DOCUMENTS TAB */}
            {modalTab === 'docs' && (
              <View style={styles.detailContainer as any}>
                <View style={styles.sectionHeaderRow as any}>
                  <MaterialCommunityIcons name="file-document-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.sectionTitle as any}>Uploaded Land Records</Text>
                </View>

                <View style={styles.documentItemCard as any}>
                  <View style={styles.docIconCircle as any}>
                    <MaterialCommunityIcons name="file-pdf-box" size={24} color="#EF4444" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#1E293B' }}>Land Registry Extract (Deed)</Text>
                    <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                      {plot?.documentName ? 'Registry_Deed_Signed.pdf' : 'Registry_Verify_Extract.pdf'}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.docDownloadBtn as any}
                    onPress={() => Alert.alert('Download Started', 'Downloading signed Land Deed PDF file...')}
                  >
                    <MaterialCommunityIcons name="download" size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.divider as any} />

                <View style={styles.sectionHeaderRow as any}>
                  <MaterialCommunityIcons name="camera-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.sectionTitle as any}>Verification Photo Proofs</Text>
                </View>

                <View style={styles.photosGrid as any}>
                  {[
                    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400',
                    'https://images.unsplash.com/photo-1464254786747-3c3e547be43a?w=400',
                    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400'
                  ].map((url, idx) => (
                    <View key={idx} style={styles.photoFrame as any}>
                      <Image source={{ uri: url }} style={styles.photoImage as any} />
                      <Text style={styles.photoCaption as any}>
                        {idx === 0 ? 'Boundary View' : idx === 1 ? 'Soil Audit Spot' : 'Tree Canopy Spot'}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 4. MAP TAB */}
            {modalTab === 'map' && (
              <View style={styles.detailContainer as any}>
                <View style={styles.sectionHeaderRow as any}>
                  <MaterialCommunityIcons name="google-maps" size={20} color={COLORS.primary} />
                  <Text style={styles.sectionTitle as any}>Geofence Coordinate Points</Text>
                </View>

                <View style={styles.locationSummaryBox as any}>
                  <MaterialCommunityIcons name="compass-outline" size={22} color={COLORS.primary} style={{ marginRight: 10 }} />
                  <View>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#1E293B' }}>Center Coordinates</Text>
                    <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                      Latitude: {plot?.geoCoords?.latitude?.toFixed(6) || '23.022500'} • Longitude: {plot?.geoCoords?.longitude?.toFixed(6) || '77.012400'}
                    </Text>
                  </View>
                </View>

                <Text style={{ fontSize: 12, fontWeight: '800', color: '#475569', marginBottom: 8, marginTop: 16 }}>
                  Geofenced Cadastral Polygon Points:
                </Text>

                <View style={styles.polygonPointsList as any}>
                  {polygonPoints.map((pt, idx) => (
                    <View key={idx} style={styles.polygonPointRow as any}>
                      <View style={styles.pointIdxBadge as any}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFFFFF' }}>#{idx + 1}</Text>
                      </View>
                      <Text style={{ fontSize: 11, color: '#334155', flex: 1, fontFamily: 'monospace' }}>
                        Lat: {pt.latitude.toFixed(6)}
                      </Text>
                      <Text style={{ fontSize: 11, color: '#334155', flex: 1, fontFamily: 'monospace' }}>
                        Lng: {pt.longitude.toFixed(6)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Cancel Application Option (Submitted state only) */}
            {(normalizedStatus === 'pending' || normalizedStatus === 'submitted') && (
              <TouchableOpacity 
                style={styles.cancelBtn as any}
                onPress={handleCancelApplication}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="delete-outline" size={18} color="#EF4444" style={{ marginRight: 6 }} />
                    <Text style={styles.cancelBtnText as any}>Cancel Application / पंजीकरण रद्द करें</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* View Project Action (Project Assigned state only) */}
            {normalizedStatus === 'project_assigned' && (
              <TouchableOpacity 
                style={styles.projectBtn as any}
                onPress={() => {
                  onClose();
                  router.push('/(tabs)/projects');
                }}
              >
                <MaterialCommunityIcons name="forest" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.projectBtnText as any}>Open My Project / मेरी परियोजना खोलें</Text>
              </TouchableOpacity>
            )}

            <View style={{ height: 30 }} />
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
    fontSize: 15,
    fontWeight: '800',
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
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 4,
    marginHorizontal: 16,
    marginTop: 12,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.small,
  },
  tabButtonText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
  },
  stepSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  stepSectionDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 20,
  },
  adminVerifyCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  adminVerifyTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  adminVerifySub: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
    lineHeight: 16,
  },
  timelineListTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 14,
    textTransform: 'uppercase',
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
  nodeBulletWarning: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  nodeBulletFail: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
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
    minHeight: 35,
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
  correctionFormCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#F97316',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  correctionSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#7C2D12',
  },
  correctionSectionDesc: {
    fontSize: 11,
    color: '#9A3412',
    marginTop: 2,
    marginBottom: 12,
  },
  correctionFieldRow: {
    marginBottom: 12,
  },
  correctionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  pickFileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 10,
  },
  pickFileText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  uploadedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  resubmitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...SHADOWS.small,
  },
  resubmitBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  resubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderStyle: 'dashed',
    marginTop: 10,
    marginBottom: 10,
  },
  cancelBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '800',
  },
  projectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    marginTop: 10,
    marginBottom: 10,
    ...SHADOWS.small,
  },
  projectBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  detailContainer: {
    gap: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  specBox: {
    width: (width - 54) / 2,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
  },
  specLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 4,
  },
  specVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  insuranceCoverBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    padding: 14,
  },
  badgeSuccess: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeSuccessText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.success,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  documentItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    ...SHADOWS.small,
  },
  docIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docDownloadBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photosGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  photoFrame: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 6,
    alignItems: 'center',
  },
  photoImage: {
    width: '100%',
    height: 80,
    borderRadius: 8,
  },
  photoCaption: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 6,
  },
  locationSummaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    padding: 12,
  },
  polygonPointsList: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  polygonPointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  pointIdxBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
});
