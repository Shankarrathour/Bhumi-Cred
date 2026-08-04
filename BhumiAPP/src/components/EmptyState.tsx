import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../theme/theme';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  buttonLabel?: string;
  onPress?: () => void;
  type?: 'land' | 'family' | 'orders' | 'projects' | 'default';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  buttonLabel,
  onPress,
  type = 'default',
}) => {
  
  const renderOnboardingContent = () => {
    switch (type) {
      case 'land':
        return (
          <View style={styles.guidanceBox}>
            <View style={styles.guidanceStep}>
              <View style={styles.bulletNumber}><Text style={styles.bulletText}>1</Text></View>
              <Text style={styles.guidanceText}>Geo-tag your farm boundary from the top '+' button.</Text>
            </View>
            <View style={styles.guidanceStep}>
              <View style={styles.bulletNumber}><Text style={styles.bulletText}>2</Text></View>
              <Text style={styles.guidanceText}>Satellites scan your soil NPK index and initial biomass density.</Text>
            </View>
            <View style={styles.guidanceStep}>
              <View style={styles.bulletNumber}><Text style={styles.bulletText}>3</Text></View>
              <Text style={styles.guidanceText}>Verification completes in 24 hours, unlocking your carbon credits ledger!</Text>
            </View>
          </View>
        );
      case 'family':
        return (
          <View style={styles.guidanceBox}>
            <Text style={styles.guidanceTitle}>Why plant a Green Family?</Text>
            <Text style={styles.guidanceSubtitle}>Every group of 5 border trees acts as a verified carbon sponge. Maintain your family unit to trigger quarterly ₹1,000 milestones.</Text>
            <View style={styles.familyProgressRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={[styles.treeBubble, i <= 3 ? styles.treeFilled : styles.treeEmpty]}>
                  <MaterialCommunityIcons name="tree" size={14} color={i <= 3 ? '#FFFFFF' : '#94A3B8'} />
                </View>
              ))}
            </View>
            <Text style={styles.familyProgressLabel}>3/5 Trees Scheduled • 2 more to trigger family payout</Text>
          </View>
        );
      case 'orders':
        return (
          <View style={styles.guidanceBox}>
            <Text style={styles.guidanceTitle}>Trending in Bhopal District</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionScroll}>
              {[
                { name: 'Bio Compost', icon: 'rose-outline', price: '₹240' },
                { name: 'Wheat Seeds', icon: 'water-outline', price: '₹320' },
                { name: 'Planting Auger', icon: 'hammer-outline', price: '₹650' },
              ].map((item, idx) => (
                <View key={idx} style={styles.suggestionCard}>
                  <MaterialCommunityIcons name={item.icon as any} size={20} color={COLORS.primaryLight} />
                  <Text style={styles.suggestName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.suggestPrice}>{item.price}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        );
      case 'projects':
        return (
          <View style={styles.guidanceBox}>
            <Text style={styles.guidanceTitle}>Why enroll in Carbon Projects?</Text>
            <Text style={styles.guidanceSubtitle}>Sustainable Wheat & Agroforestry verification programs pay you direct subsidies for practicing zero-tillage boundary sapling agriculture.</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name={icon as any} size={42} color={COLORS.primaryLight} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      
      {/* Dynamic guidance guides */}
      {renderOnboardingContent()}
      
      {buttonLabel && onPress && (
        <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.8}>
          <Text style={styles.btnText}>{buttonLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.soft,
    marginVertical: 14,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primaryDark,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  description: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 12,
    marginBottom: 16,
    fontWeight: '600',
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 20,
    ...SHADOWS.limeGlow,
    marginTop: 10,
  },
  btnText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  guidanceBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    width: '100%',
    marginBottom: 16,
  },
  guidanceStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  bulletNumber: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  bulletText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  guidanceText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    flex: 1,
  },
  guidanceTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginBottom: 4,
  },
  guidanceSubtitle: {
    fontSize: 10,
    color: COLORS.textSecondary,
    lineHeight: 14,
    fontWeight: '500',
  },
  familyProgressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 6,
  },
  treeBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
  },
  treeFilled: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  treeEmpty: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  familyProgressLabel: {
    fontSize: 9.5,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '700',
    marginTop: 2,
  },
  suggestionScroll: {
    marginTop: 10,
  },
  suggestionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    width: 90,
    alignItems: 'center',
    marginRight: 8,
  },
  suggestName: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textDark,
    marginTop: 4,
  },
  suggestPrice: {
    fontSize: 8.5,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 2,
  },
});
