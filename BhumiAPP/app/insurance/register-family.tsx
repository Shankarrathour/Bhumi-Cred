import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar, Platform, Dimensions, Alert, ActivityIndicator, Image, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Polygon, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import apiClient, { API_BASE_URL } from '../../src/api/apiClient';
import { useAuthStore } from '../../src/store/authStore';

const { width } = Dimensions.get('window');

interface TreePlan {
  _id: string;
  plan_type: string;
  plan_name: string;
  price: number;
  billing_cycle: string;
  cover: number;
  badge_text: string;
  badge_color: string;
  description: string;
  priority: number;
  is_active: boolean;
  is_recommended: boolean;
}

interface TreeItem {
  id: number;
  species: string;
  age: string;
  health: string;
  hasPhoto: boolean;
  photoUri?: string;
}

export default function RegisterFamilyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const landPremium = params.landPremium as string | undefined;
  const acres = params.acres as string | undefined;
  const mode = params.mode as string | undefined;

  // Basic group config
  const [totalTrees, setTotalTrees] = useState(5);
  const [plantationType, setPlantationType] = useState('Agroforestry Boundary / सीमा वृक्षारोपण');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [plans, setPlans] = useState<TreePlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'plantation') {
      setTotalTrees(50);
      setPlantationType('Block Plantation / सघन वृक्षारोपण');
    } else {
      setTotalTrees(5);
      setPlantationType('Agroforestry Boundary / सीमा वृक्षारोपण');
    }
  }, [mode]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await apiClient.get('/tree-plans?plan_type=green_family');
        if (res.data.success) {
          setPlans(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedPlanId(res.data.data[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch tree plans:', err);
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

  // Dynamic tree card states
  const [treeList, setTreeList] = useState<TreeItem[]>([]);
  const [cameraLoading, setCameraLoading] = useState<number | null>(null);

  // Geo-location tag
  const [gpsLoading, setGpsLoading] = useState(false);
  const [geoPoints, setGeoPoints] = useState<{ latitude: number; longitude: number }[]>([]);
  const [isPolygonComplete, setIsPolygonComplete] = useState(false);
  const [currentLocation, setCurrentLocation] = useState({ latitude: 22.9734, longitude: 78.6569 });

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setCurrentLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        }
      } catch (e) {
        // Fallback to default
      }
    })();
  }, []);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const scrollViewRef = useRef<ScrollView>(null);
  const fieldPositions = useRef<Record<string, number>>({});

  // Initialize/adjust tree cards when totalTrees changes
  useEffect(() => {
    const list: TreeItem[] = [];
    for (let i = 1; i <= totalTrees; i++) {
      list.push({
        id: i,
        species: i % 2 === 0 ? 'Malabar Neem' : 'Alphonso Mango',
        age: '1',
        health: 'Healthy / स्वस्थ',
        hasPhoto: false,
      });
    }
    setTreeList(list);
  }, [totalTrees]);

  const handleMapTap = (e: any) => {
    if (isPolygonComplete) return;
    const { coordinate } = e.nativeEvent;
    if (coordinate) {
      setGeoPoints([...geoPoints, coordinate]);
    }
  };

  const handleFetchGPS = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'GPS coordinates are required to map the farm boundaries.');
        setGpsLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setGeoPoints([{ latitude: loc.coords.latitude, longitude: loc.coords.longitude }]);
    } catch (e) {
      setGeoPoints([{ latitude: 22.9712, longitude: 78.6514 }]);
    } finally {
      setGpsLoading(false);
    }
  };

  const handleCaptureTreePhoto = async (id: number) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to scan saplings.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCameraLoading(id);
        const uri = result.assets[0].uri;
        
        const formData = new FormData();
        const filename = uri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const typeRaw = match ? `image/${match[1]}` : 'image/jpeg';
        const type = typeRaw === 'image/jpg' ? 'image/jpeg' : typeRaw;
        
        formData.append('file', {
          uri,
          name: filename,
          type,
        } as any);

        try {
          const uploadRes = await apiClient.post('/tree/upload-sapling-scan', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Connection': 'close'
            }
          });
          const uploadData = uploadRes.data;
          
          if (uploadData && uploadData.status === "Success") {
            setTreeList(prev => prev.map(t => t.id === id ? { ...t, hasPhoto: true, photoUri: uri } : t));
          } else {
             Alert.alert('Upload Failed', 'Could not verify upload.');
          }
        } catch (err) {
          console.error("Upload Error:", err);
          Alert.alert('Error', 'Failed to upload photo to backend.');
        } finally {
          setCameraLoading(null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateTreeField = (id: number, key: keyof TreeItem, value: any) => {
    setTreeList(prev => prev.map(t => t.id === id ? { ...t, [key]: value } : t));
  };

  const handleProceedToPayment = () => {
    setErrors({});
    let hasError = false;
    const newErrors: Record<string, string> = {};

    if (geoPoints.length < 3) {
      newErrors.geoCoords = 'Please lock at least 3 boundary points on the map.';
      hasError = true;
    }

    const firstMissingPhotoTree = treeList.find(t => !t.hasPhoto);
    if (firstMissingPhotoTree) {
      newErrors.photos = `Vitality photo missing for Tree #${firstMissingPhotoTree.id}`;
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      const firstError = Object.keys(newErrors)[0];
      let scrollTarget = firstError;
      if (firstError === 'photos' && firstMissingPhotoTree) {
        scrollTarget = `tree_${firstMissingPhotoTree.id}`;
      }
      if (fieldPositions.current[scrollTarget] !== undefined) {
        scrollViewRef.current?.scrollTo({ y: Math.max(0, fieldPositions.current[scrollTarget] - 20), animated: true });
      }
      return;
    }

    const selectedPlan = plans.find(p => p._id === selectedPlanId);
    if (!selectedPlan) return;

    // Route to summary screen
    router.push({
      pathname: '/insurance/summary' as any,
      params: {
        mode: 'family',
        treeCount: totalTrees.toString(),
        plantationType,
        premium: selectedPlan.price,
        coverage: selectedPlan.cover,
        policyId: selectedPlan._id,
        policyName: selectedPlan.plan_name,
        treeListData: JSON.stringify(treeList),
        geoCoordsData: JSON.stringify({ latitude: geoPoints[0]?.latitude, longitude: geoPoints[0]?.longitude }),
        ...(landPremium ? { landPremium } : {}),
        ...(acres ? { acres } : {})
      }
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4FDF9" />
      
      {/* Navbar Header */}
      <View style={[styles.navBar, { paddingTop: insets.top > 0 ? insets.top + 10 : (Platform.OS === 'ios' ? 50 : 30) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>{mode === 'plantation' ? 'Farm & Plantation protection' : 'Green Family Registry'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollArea} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Banner summary */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>{mode === 'plantation' ? 'Insure Plantation Block' : 'Insure Carbon Sponge Clusters'}</Text>
          <Text style={styles.bannerSub}>{mode === 'plantation' ? 'Define plantation area and count to secure block-level tree cover.' : '5 Planted trees forms 1 Green Family Unit. Insuring them unlocks carbon sponge status.'}</Text>
        </View>

        {/* Dynamic Tree Cluster Config */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>1. Configure Tree Cluster / पेड़ों की संख्या</Text>
          <Text style={styles.fieldLabel}>Select Cluster Size (Green Family bundles)</Text>
          <View style={styles.quantityRow}>
            {[5, 10, 25, 50].map((num) => {
              const isSelected = totalTrees === num;
              return (
                <TouchableOpacity 
                  key={num}
                  style={[styles.qtyBtn, isSelected && styles.qtyBtnActive]}
                  onPress={() => setTotalTrees(num)}
                >
                  <Text style={[styles.qtyBtnText, isSelected && styles.qtyBtnTextActive]}>{num} Trees</Text>
                  <Text style={[styles.qtyBtnSub, isSelected && { color: COLORS.accent }]}>({Math.floor(num / 5)} Family)</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Plantation Configuration / श्रेणी</Text>
            <TextInput 
              style={styles.input} 
              value={plantationType}
              onChangeText={setPlantationType}
              placeholder="e.g. Block agroforestry cluster"
            />
          </View>

          <View style={styles.mapContainer} onLayout={(e) => fieldPositions.current['geoCoords'] = e.nativeEvent.layout.y}>
            <View style={styles.mapOverlayHeader}>
              <Text style={styles.mapStatusLabel}>
                {isPolygonComplete ? '🔒 Boundary Locked' : '📍 Tap map to set cluster boundary'}
              </Text>
            </View>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={{ flex: 1, minHeight: 220 }}
              mapType="satellite"
              initialRegion={{
                latitude: geoPoints.length > 0 ? geoPoints[0].latitude : currentLocation.latitude,
                longitude: geoPoints.length > 0 ? geoPoints[0].longitude : currentLocation.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              onPress={handleMapTap}
              scrollEnabled={!isPolygonComplete}
              zoomEnabled={!isPolygonComplete}
            >
              {geoPoints.length >= 3 && (
                <Polygon
                  coordinates={geoPoints}
                  fillColor="rgba(132, 204, 22, 0.4)"
                  strokeColor={COLORS.accent}
                  strokeWidth={2}
                />
              )}
              {geoPoints.map((pt, idx) => (
                <Marker key={`marker-${idx}`} coordinate={pt} />
              ))}
            </MapView>
            
            <View style={styles.mapControlsRow}>
              <TouchableOpacity style={styles.mapResetBtn} onPress={() => { setGeoPoints([]); setIsPolygonComplete(false); }}>
                <MaterialCommunityIcons name="refresh" size={16} color="#475569" style={{ marginRight: 4 }} />
                <Text style={styles.mapResetBtnText}>Clear Pins</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mapConfirmBtn, isPolygonComplete && styles.mapConfirmBtnDisabled]}
                onPress={() => {
                  if (geoPoints.length < 3) {
                    Alert.alert('Draw Boundary', 'Place at least 3 points on the satellite map first.');
                  } else {
                    setIsPolygonComplete(true);
                  }
                }}
                disabled={isPolygonComplete}
              >
                <MaterialCommunityIcons name="vector-polygon" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.mapConfirmBtnText}>Lock Boundary</Text>
              </TouchableOpacity>
            </View>
          </View>
          {errors.geoCoords && <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4, paddingHorizontal: 16 }}>{errors.geoCoords}</Text>}
        </View>

        {/* Bundle Plan Selector */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={[styles.cardTitle, { marginBottom: 0 }]}>2. Choose Premium Family Plan / फैमिली पॉलिसी</Text>
            <TouchableOpacity 
              style={styles.compareTriggerBtn}
              onPress={() => setShowCompareModal(true)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="compare" size={16} color={COLORS.primary} style={{ marginRight: 4 }} />
              <Text style={styles.compareTriggerText}>Compare / तुलना करें</Text>
            </TouchableOpacity>
          </View>
          
          {loadingPlans ? (
            <Text style={{ textAlign: 'center', padding: 20, color: COLORS.textSecondary, fontSize: 12, fontWeight: '700' }}>Loading plans...</Text>
          ) : plans.length === 0 ? (
            <Text style={{ textAlign: 'center', padding: 20, color: COLORS.textSecondary, fontSize: 12, fontWeight: '700' }}>No plans are currently available.</Text>
          ) : (
            plans.map((plan) => {
              const isSelected = selectedPlanId === plan._id;
              const isExpanded = expandedPlanId === plan._id;

              const nameLower = plan.plan_name.toLowerCase();
              const isBasic = nameLower.includes('basic');
              const isShieldOrProtection = nameLower.includes('shield') || nameLower.includes('protection') || nameLower.includes('elite') || nameLower.includes('gold');
              
              const risks = isBasic 
                ? ['⛈️ Storm / आंधी-तूफान', '🍂 Pest / कीट', '🔥 Fire / आग'] 
                : isShieldOrProtection
                  ? ['⛈️ Severe weather / गंभीर मौसम', '🍂 Epidemic pest blights / कीट रोग', '🔥 Wildfire / जंगल की आग', '🪵 Timber theft / लकड़ी चोरी']
                  : ['⛈️ Natural storm / मौसम आपदा', '🍂 Pest blights / कीट रोग', '🔥 Accidental fire / दुर्घटनावश आग'];

              const exclusions = isBasic
                ? ['❌ Intentional cutting / जानबूझकर काटना', '❌ Simple leaf decay / साधारण पत्ती का झड़ना']
                : ['❌ Land dispute / भूमि विवाद', '❌ Natural aging decay / प्राकृतिक रूप से पुराना होना'];

              const duration = isBasic ? '📅 12 Months (1 Year) / १२ महीने' : isShieldOrProtection ? '📅 24 Months (2 Years) / २४ महीने' : '📅 12 Months (1 Year)';
              const claimNotes = isBasic
                ? 'ℹ️ Photo scan + Geotag verification within 48h / फोटो और जीपीएस सत्यापन आवश्यक।'
                : 'ℹ️ Satellite audit verification + priority payout / सैटेलाइट जांच और त्वरित भुगतान।';

              return (
                <View
                  key={plan._id}
                  style={[styles.planCard, isSelected && styles.planCardActive]}
                >
                  <TouchableOpacity
                    style={styles.planHeader}
                    activeOpacity={0.9}
                    onPress={() => setSelectedPlanId(plan._id)}
                  >
                    <View style={styles.checkbox}>
                      {isSelected && <View style={styles.checkboxChecked} />}
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.planName}>{plan.plan_name}</Text>
                      <View style={[styles.planTag, { backgroundColor: plan.badge_color + '20' }]}>
                        <Text style={[styles.planTagText, { color: plan.badge_color }]}>{plan.badge_text}</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end', marginRight: 8 }}>
                      <Text style={styles.planPrice}>₹{plan.price}/{plan.billing_cycle === 'yearly' ? 'Yr' : plan.billing_cycle === 'monthly' ? 'Mo' : 'Life'}</Text>
                      <Text style={styles.planCover}>Cover: ₹{plan.cover}</Text>
                    </View>
                  </TouchableOpacity>
                  
                  <Text style={styles.planDesc}>{plan.description}</Text>

                  {/* Expansion trigger button */}
                  <TouchableOpacity 
                    style={styles.expandDetailsRowBtn}
                    onPress={() => setExpandedPlanId(isExpanded ? null : plan._id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.expandDetailsRowText}>
                      {isExpanded ? 'Hide policy exclusions & details' : 'View risks, exclusions & details'}
                    </Text>
                    <MaterialCommunityIcons 
                      name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                      size={16} 
                      color="#475569" 
                      style={{ marginLeft: 4 }}
                    />
                  </TouchableOpacity>

                  {/* Expanded detail tabs */}
                  {isExpanded && (
                    <View style={styles.expandedDetailsContainer}>
                      <View style={styles.detailItemRow}>
                        <MaterialCommunityIcons name="clock-outline" size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
                        <Text style={styles.detailItemText}><Text style={{ fontWeight: '800' }}>Duration:</Text> {duration}</Text>
                      </View>
                      
                      <View style={styles.detailHeaderBox}>
                        <Text style={styles.detailHeaderTitle}>Covered Risks / बीमित जोखिम</Text>
                      </View>
                      {risks.map((risk, i) => (
                        <Text key={i} style={styles.detailBulletText}>{risk}</Text>
                      ))}

                      <View style={styles.detailHeaderBox}>
                        <Text style={[styles.detailHeaderTitle, { color: '#DC2626' }]}>Exclusions / क्या शामिल नहीं है</Text>
                      </View>
                      {exclusions.map((ex, i) => (
                        <Text key={i} style={styles.detailBulletText}>{ex}</Text>
                      ))}

                      <View style={[styles.detailHeaderBox, { borderBottomWidth: 0, marginTop: 10, paddingBottom: 0 }]}>
                        <Text style={styles.claimNotesText}>{claimNotes}</Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Tree Card drawer list */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>3. Tree Cluster Roster ({treeList.length} Cards)</Text>
          <Text style={styles.photoHint}>Provide species and mock camera health checks for each sapling node.</Text>
          {errors.photos && <Text style={{ color: '#EF4444', fontSize: 12, marginBottom: 12 }}>{errors.photos}</Text>}
          
          {treeList.map((t) => (
            <View key={t.id} style={styles.treeItemCard} onLayout={(e) => fieldPositions.current[`tree_${t.id}`] = e.nativeEvent.layout.y}>
              <View style={styles.treeHeaderRow}>
                <View style={styles.treeIndexCircle}>
                  <Text style={styles.treeIndexText}>#{t.id}</Text>
                </View>
                <Text style={styles.treeCardTitle}>Sapling Growth Node #{t.id}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {t.hasPhoto && t.photoUri ? (
                    <>
                      <Image source={{ uri: t.photoUri }} style={{ width: 28, height: 28, borderRadius: 6, marginRight: 8, borderWidth: 1, borderColor: COLORS.success }} />
                      <TouchableOpacity 
                        style={[styles.camBtn, styles.camBtnActive]}
                        onPress={() => handleCaptureTreePhoto(t.id)}
                        disabled={cameraLoading !== null}
                      >
                        {cameraLoading === t.id ? (
                          <ActivityIndicator size="small" color={COLORS.success} />
                        ) : (
                          <>
                            <MaterialCommunityIcons name="camera-retake-outline" size={14} color={COLORS.success} />
                            <Text style={[styles.camBtnText, { color: COLORS.success }]}>Retake</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity 
                      style={styles.camBtn}
                      onPress={() => handleCaptureTreePhoto(t.id)}
                      disabled={cameraLoading !== null}
                    >
                      {cameraLoading === t.id ? (
                        <ActivityIndicator size="small" color={COLORS.primary} />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="camera-outline" size={16} color={COLORS.primary} />
                          <Text style={styles.camBtnText}>Scan Sapling</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.formRow}>
                <View style={[styles.fieldCol, { marginRight: 8 }]}>
                  <Text style={styles.smallLabel}>Tree Species</Text>
                  <TextInput 
                    style={styles.smallInput} 
                    value={t.species}
                    onChangeText={(val) => handleUpdateTreeField(t.id, 'species', val)}
                  />
                </View>
                <View style={[styles.fieldCol, { flex: 0.6, marginRight: 8 }]}>
                  <Text style={styles.smallLabel}>Age (Yrs)</Text>
                  <TextInput 
                    style={styles.smallInput} 
                    value={t.age}
                    keyboardType="numeric"
                    onChangeText={(val) => handleUpdateTreeField(t.id, 'age', val)}
                  />
                </View>
                <View style={styles.fieldCol}>
                  <Text style={styles.smallLabel}>Health State</Text>
                  <TextInput 
                    style={styles.smallInput} 
                    value={t.health}
                    onChangeText={(val) => handleUpdateTreeField(t.id, 'health', val)}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Purchase Trigger Button */}
        <TouchableOpacity 
          style={styles.purchaseBtn} 
          activeOpacity={0.9}
          onPress={handleProceedToPayment}
        >
          <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.purchaseGrad}>
            <MaterialCommunityIcons name="shield-check" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.purchaseBtnText} numberOfLines={1} adjustsFontSizeToFit>Proceed to Group Cover / सुरक्षा कवच खरीदें</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Compare Plans Modal */}
      <Modal visible={showCompareModal} transparent={true} animationType="slide" onRequestClose={() => setShowCompareModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardContainer}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="compare" size={24} color={COLORS.primary} style={{ marginRight: 8 }} />
              <Text style={styles.modalTitleText}>Compare Insurance Plans</Text>
              <TouchableOpacity onPress={() => setShowCompareModal(false)} style={{ marginLeft: 'auto', padding: 4 }}>
                <MaterialCommunityIcons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
              <View style={{ flexDirection: 'column' }}>
                {/* Table Header Row */}
                <View style={styles.tableRowHeader}>
                  <View style={[styles.tableCellLabel, { width: 100 }]}><Text style={styles.tableCellHeaderText}>Feature</Text></View>
                  {plans.map((p) => (
                    <View key={p._id} style={[styles.tableCellDataHeader, { width: 120 }]}><Text style={styles.tableCellHeaderText} numberOfLines={1}>{p.plan_name}</Text></View>
                  ))}
                </View>

                {/* Price Row */}
                <View style={styles.tableRow}>
                  <View style={[styles.tableCellLabel, { width: 100 }]}><Text style={styles.tableCellTextBold as any}>Premium (₹)</Text></View>
                  {plans.map((p) => (
                    <View key={p._id} style={[styles.tableCellData, { width: 120 }]}><Text style={styles.tableCellText as any}>₹{p.price}</Text></View>
                  ))}
                </View>

                {/* Coverage Row */}
                <View style={styles.tableRow}>
                  <View style={[styles.tableCellLabel, { width: 100 }]}><Text style={styles.tableCellTextBold as any}>Max Cover</Text></View>
                  {plans.map((p) => (
                    <View key={p._id} style={[styles.tableCellData, { width: 120 }]}><Text style={[styles.tableCellText as any, { color: COLORS.primary, fontWeight: '800' }]}>₹{p.cover}</Text></View>
                  ))}
                </View>

                {/* Duration Row */}
                <View style={styles.tableRow}>
                  <View style={[styles.tableCellLabel, { width: 100 }]}><Text style={styles.tableCellTextBold as any}>Duration</Text></View>
                  {plans.map((p) => {
                    const d = p.plan_name.toLowerCase().includes('basic') ? '1 Year' : p.plan_name.toLowerCase().includes('shield') || p.plan_name.toLowerCase().includes('protection') || p.plan_name.toLowerCase().includes('gold') || p.plan_name.toLowerCase().includes('elite') ? '2 Years' : '1 Year';
                    return (
                      <View key={p._id} style={[styles.tableCellData, { width: 120 }]}><Text style={styles.tableCellText as any}>{d}</Text></View>
                    );
                  })}
                </View>

                {/* Covered Risks Count */}
                <View style={styles.tableRow}>
                  <View style={[styles.tableCellLabel, { width: 100 }]}><Text style={styles.tableCellTextBold as any}>Covered Risks</Text></View>
                  {plans.map((p) => {
                    const count = p.plan_name.toLowerCase().includes('basic') ? '3 Risks' : '4+ Risks';
                    return (
                      <View key={p._id} style={[styles.tableCellData, { width: 120 }]}><Text style={styles.tableCellText as any}>{count}</Text></View>
                    );
                  })}
                </View>

                {/* Payout Speed */}
                <View style={styles.tableRow}>
                  <View style={[styles.tableCellLabel, { width: 100 }]}><Text style={styles.tableCellTextBold as any}>Payout Speed</Text></View>
                  {plans.map((p) => {
                    const speed = p.plan_name.toLowerCase().includes('basic') ? 'Standard (7d)' : 'Fast (48h)';
                    return (
                      <View key={p._id} style={[styles.tableCellData, { width: 120 }]}><Text style={styles.tableCellText as any}>{speed}</Text></View>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity 
              style={[styles.closeModalBtn, { marginTop: 16 }]}
              onPress={() => setShowCompareModal(false)}
            >
              <Text style={styles.closeModalBtnText}>Close Comparison</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4FDF9',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  backBtn: {
    padding: 6,
    borderRadius: 10,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  scrollArea: {
    padding: 20,
  },
  banner: {
    marginBottom: 20,
  },
  bannerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primaryDark,
    fontWeight: '800',
  },
  bannerSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 15,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 14,
    textTransform: 'uppercase',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 6,
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  qtyBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  qtyBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  qtyBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  qtyBtnTextActive: {
    color: '#FFFFFF',
  },
  qtyBtnSub: {
    fontSize: 8,
    color: COLORS.textSecondary,
    fontWeight: '700',
    marginTop: 2,
  },
  formField: {
    marginBottom: 14,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  gpsBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 14,
  },
  gpsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  gpsCoords: {
    fontSize: 10,
    color: COLORS.secondary,
    fontWeight: '700',
    marginTop: 2,
  },
  gpsBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  planCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  planCardActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  planName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  planTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 3,
  },
  planTagText: {
    fontSize: 8,
    fontWeight: '900',
  },
  planPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.textDark,
  },
  planCover: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '700',
    marginTop: 2,
  },
  planDesc: {
    fontSize: 10,
    color: COLORS.textSecondary,
    lineHeight: 14,
    fontWeight: '600',
    paddingLeft: 30,
  },
  compareTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D97706',
  },
  compareTriggerText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  expandDetailsRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
    marginLeft: 30,
  },
  expandDetailsRowText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  expandedDetailsContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    paddingTop: 12,
    paddingLeft: 30,
  },
  detailItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailItemText: {
    fontSize: 11,
    color: '#334155',
  },
  detailHeaderBox: {
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    marginTop: 8,
    marginBottom: 6,
  },
  detailHeaderTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  detailBulletText: {
    fontSize: 10,
    color: '#475569',
    marginBottom: 4,
    paddingLeft: 6,
  },
  claimNotesText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
    fontStyle: 'italic',
    lineHeight: 14,
  },
  modalCardContainer: {
    width: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    ...SHADOWS.glow,
  },
  modalTitleText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textDark,
  },
  tableRowHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    paddingVertical: 10,
    alignItems: 'center',
  },
  tableCellLabel: {
    paddingHorizontal: 6,
  },
  tableCellDataHeader: {
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  tableCellData: {
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  tableCellHeaderText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  tableCellTextBold: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  tableCellText: {
    fontSize: 10,
    color: '#334155',
    fontWeight: '600',
  },
  closeModalBtn: {
    paddingVertical: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    alignItems: 'center',
  },
  closeModalBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  photoHint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 16,
  },
  treeItemCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  treeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  treeIndexCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  treeIndexText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  treeCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textDark,
    marginLeft: 8,
    flex: 1,
  },
  camBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  camBtnActive: {
    backgroundColor: '#D1FAE5',
    borderColor: COLORS.success,
  },
  camBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fieldCol: {
    flex: 1,
  },
  smallLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  smallInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 11,
    color: COLORS.textDark,
    fontWeight: '700',
  },
  purchaseBtn: {
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 10,
    ...SHADOWS.glow,
  },
  purchaseGrad: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  purchaseBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  mapContainer: {
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: '#022C22',
  },
  mapOverlayHeader: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  mapStatusLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: 'rgba(2, 44, 34, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  mapControlsRow: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
  },
  mapResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    marginRight: 10,
    flex: 1,
  },
  mapResetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  mapConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    flex: 1,
  },
  mapConfirmBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  mapConfirmBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
