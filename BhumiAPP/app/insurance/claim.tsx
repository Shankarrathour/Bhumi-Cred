import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar, Platform, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';

const { width } = Dimensions.get('window');

const DAMAGE_TYPES = [
  { code: 'storm', label: 'Cyclone / Storm Wind', icon: 'weather-windy' },
  { code: 'drought', label: 'Extreme Drought / सूखा', icon: 'weather-sunny' },
  { code: 'pest', label: 'Pest or Disease / रोग', icon: 'bug-outline' },
  { code: 'flood', label: 'Heavy Flood wash / बाढ़', icon: 'water-percent' },
  { code: 'fire', label: 'Wildfire stress / आग', icon: 'fire' },
];

export default function ClaimRequestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  // Route Params
  const policyId = params.policyId as string || 'BS-492104';
  const policyName = params.policyName as string || 'Green Shield Basic';

  // Form States
  const [selectedDamage, setSelectedDamage] = useState('storm');
  const [explanation, setExplanation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Evidence Photos mock
  const [cameraLoading, setCameraLoading] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Record<string, boolean>>({
    damageClose: false,
    generalField: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const scrollViewRef = useRef<ScrollView>(null);
  const fieldPositions = useRef<Record<string, number>>({});

  const handleCapturePhoto = (key: string) => {
    setCameraLoading(key);
    setTimeout(() => {
      setCameraLoading(null);
      setPhotos((prev) => ({ ...prev, [key]: true }));
    }, 1000);
  };

  const handleSubmitClaim = () => {
    setErrors({});
    let hasError = false;
    const newErrors: Record<string, string> = {};

    if (!explanation || explanation.length < 10) {
      newErrors.explanation = 'Please provide a detailed description (minimum 10 characters).';
      hasError = true;
    }

    const hasPhotos = Object.values(photos).every(Boolean);
    if (!hasPhotos) {
      newErrors.photos = 'Please upload simulated close-up damage and general field view photos.';
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      const firstError = Object.keys(newErrors)[0];
      if (firstError && fieldPositions.current[firstError] !== undefined) {
        scrollViewRef.current?.scrollTo({ y: Math.max(0, fieldPositions.current[firstError] - 20), animated: true });
      }
      return;
    }

    setIsSubmitting(true);

    // Simulate blockchain/satellite submission sync
    setTimeout(() => {
      setIsSubmitting(false);
      
      const selectedLabel = DAMAGE_TYPES.find(d => d.code === selectedDamage)?.label || 'Climate Damage';

      Alert.alert(
        'Claim Filed Successfully ✅',
        'Your claim has been submitted to the BhumiCred satellite MRV system. Drone inspection and satellite audits are scheduled.',
        [
          {
            text: 'Track Claim Status',
            onPress: () => {
              router.replace({
                pathname: '/insurance/claim-track' as any,
                params: {
                  policyId,
                  policyName,
                  damageType: selectedLabel,
                  explanation,
                }
              });
            }
          }
        ]
      );
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4FDF9" />
      
      {/* Header */}
      <View style={[styles.navBar, { paddingTop: insets.top > 0 ? insets.top + 10 : (Platform.OS === 'ios' ? 50 : 30) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} disabled={isSubmitting}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>File Protection Claim</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollArea} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Raise Environmental Damage Audit</Text>
          <Text style={styles.bannerSub}>File a claim to trigger automated drone/orbital spectrometer scans on your geo-tagged land block.</Text>
        </View>

        {/* 1. Policy Context Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>1. Protection Policy Mapped</Text>
          <View style={styles.policyContext}>
            <View style={styles.policyIconBox}>
              <MaterialCommunityIcons name="shield-check" size={24} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.policyContextName}>{policyName}</Text>
              <Text style={styles.policyContextId}>Linked Policy ID: {policyId}</Text>
            </View>
            <View style={styles.activeBadge}>
              <Text style={styles.activeText}>VERIFIED</Text>
            </View>
          </View>
        </View>

        {/* 2. Select Damage Type */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>2. Choose Damage Category / नुकसान का प्रकार</Text>
          <Text style={styles.hintText}>Select the primary cause of plantation health failure:</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {DAMAGE_TYPES.map((type) => {
              const isSelected = selectedDamage === type.code;
              return (
                <TouchableOpacity
                  key={type.code}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => setSelectedDamage(type.code)}
                  disabled={isSubmitting}
                >
                  <MaterialCommunityIcons name={type.icon as any} size={16} color={isSelected ? '#FFFFFF' : COLORS.primary} style={{ marginRight: 6 }} />
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{type.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 3. Photos upload */}
        <View style={styles.card} onLayout={(e) => fieldPositions.current['photos'] = e.nativeEvent.layout.y}>
          <Text style={styles.cardTitle}>3. Geotagged Damage Photos / फोटो प्रमाण</Text>
          <Text style={styles.hintText}>Please upload 2 clear views of the affected plantation segment to accelerate MRV verification:</Text>
          {errors.photos && <Text style={{ color: '#EF4444', fontSize: 12, marginBottom: 12 }}>{errors.photos}</Text>}

          <View style={styles.photoRow}>
            {/* Photo 1: Close Up */}
            <TouchableOpacity
              style={[styles.photoCard, photos.damageClose && styles.photoCardActive]}
              onPress={() => handleCapturePhoto('damageClose')}
              disabled={cameraLoading !== null || isSubmitting}
            >
              {cameraLoading === 'damageClose' ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <>
                  <MaterialCommunityIcons name={photos.damageClose ? "check-circle" : "camera"} size={24} color={photos.damageClose ? COLORS.success : COLORS.primary} />
                  <Text style={styles.photoLabel}>Close-up Damage / तने का नुकसान</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Photo 2: General Field */}
            <TouchableOpacity
              style={[styles.photoCard, photos.generalField && styles.photoCardActive]}
              onPress={() => handleCapturePhoto('generalField')}
              disabled={cameraLoading !== null || isSubmitting}
            >
              {cameraLoading === 'generalField' ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <>
                  <MaterialCommunityIcons name={photos.generalField ? "check-circle" : "image-filter-hdr"} size={24} color={photos.generalField ? COLORS.success : COLORS.primary} />
                  <Text style={styles.photoLabel}>General Farm View / फार्म का नजारा</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. Explanation text */}
        <View style={styles.card} onLayout={(e) => fieldPositions.current['explanation'] = e.nativeEvent.layout.y}>
          <Text style={styles.cardTitle}>4. Detailed Explanation / नुकसान का विवरण</Text>
          <Text style={styles.hintText}>Describe what happened (duration, visual decay signs, weather conditions, etc.):</Text>
          
          <TextInput
            style={[styles.textArea, errors.explanation && { borderColor: '#EF4444', borderWidth: 1 }]}
            multiline
            numberOfLines={4}
            placeholder="e.g. Heavy storm winds on Thursday evening broke the primary timber trunk nodes on 3 border trees. Visual sapwood decay is visible..."
            placeholderTextColor="#94A3B8"
            value={explanation}
            onChangeText={(val) => { setExplanation(val); setErrors(prev => ({ ...prev, explanation: '' })); }}
            editable={!isSubmitting}
            textAlignVertical="top"
          />
          {errors.explanation && <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors.explanation}</Text>}
        </View>

        {/* Action Trigger Button */}
        <TouchableOpacity 
          style={styles.submitBtn} 
          activeOpacity={0.9}
          onPress={handleSubmitClaim}
          disabled={isSubmitting}
        >
          <LinearGradient colors={[COLORS.danger, '#F87171']} style={styles.submitGrad}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="alert-decagram" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.submitBtnText}>Submit Damage Report & Trigger Scan</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>
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
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  policyContext: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  policyIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E6F4EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  policyContextName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  policyContextId: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeText: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.success,
  },
  hintText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 12,
    lineHeight: 15,
  },
  chipRow: {
    paddingVertical: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 10,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  photoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  photoCard: {
    width: '48%',
    height: 96,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoCardActive: {
    backgroundColor: '#D1FAE5',
    borderColor: COLORS.success,
  },
  photoLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textDark,
    marginTop: 6,
    textAlign: 'center',
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    fontSize: 12,
    color: COLORS.textDark,
    fontWeight: '600',
    height: 100,
  },
  submitBtn: {
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 10,
    ...SHADOWS.soft,
  },
  submitGrad: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
