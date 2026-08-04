import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, StyleProp, ViewStyle } from 'react-native';
import { COLORS } from '../theme/theme';

interface SkeletonProps {
  style?: StyleProp<ViewStyle>;
}

export const SkeletonBase: React.FC<SkeletonProps> = ({ style }) => {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, [opacity]);

  return (
    <Animated.View 
      style={[
        styles.base, 
        { opacity }, 
        style
      ]} 
    />
  );
};

export const CardSkeleton: React.FC<SkeletonProps> = ({ style }) => (
  <View style={[styles.card, style]}>
    <SkeletonBase style={styles.titleLine} />
    <SkeletonBase style={styles.bodyLine} />
    <SkeletonBase style={styles.footerLine} />
  </View>
);

export const ProductSkeleton: React.FC<SkeletonProps> = ({ style }) => (
  <View style={[styles.product, style]}>
    <SkeletonBase style={styles.imagePlaceholder} />
    <SkeletonBase style={styles.titleLineShort} />
    <SkeletonBase style={styles.bodyLine} />
    <SkeletonBase style={styles.buttonPlaceholder} />
  </View>
);

export const ListSkeleton: React.FC<SkeletonProps> = ({ style }) => (
  <View style={[styles.list, style]}>
    <SkeletonBase style={styles.circlePlaceholder} />
    <View style={styles.listTextCol}>
      <SkeletonBase style={styles.titleLine} />
      <SkeletonBase style={styles.bodyLineShort} />
    </View>
  </View>
);

export const TimelineSkeleton: React.FC<SkeletonProps> = ({ style }) => (
  <View style={[styles.timeline, style]}>
    <View style={styles.timelineLeft}>
      <SkeletonBase style={styles.smallCircle} />
      <SkeletonBase style={styles.verticalLine} />
    </View>
    <View style={styles.timelineRight}>
      <CardSkeleton style={{ marginBottom: 0, height: 100 }} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#E2F0D9', // Soft eco green placeholder base
    borderRadius: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 120,
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  product: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  list: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  timeline: {
    flexDirection: 'row',
    marginBottom: 16,
    height: 120,
  },
  titleLine: {
    height: 16,
    width: '70%',
    borderRadius: 8,
  },
  titleLineShort: {
    height: 14,
    width: '50%',
    borderRadius: 7,
    marginTop: 8,
  },
  bodyLine: {
    height: 12,
    width: '90%',
    borderRadius: 6,
    marginTop: 8,
  },
  bodyLineShort: {
    height: 10,
    width: '60%',
    borderRadius: 5,
    marginTop: 6,
  },
  footerLine: {
    height: 12,
    width: '40%',
    borderRadius: 6,
    marginTop: 8,
  },
  imagePlaceholder: {
    height: 100,
    width: '100%',
    borderRadius: 14,
  },
  buttonPlaceholder: {
    height: 36,
    width: '100%',
    borderRadius: 10,
    marginTop: 12,
  },
  circlePlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  listTextCol: {
    flex: 1,
    marginLeft: 12,
  },
  timelineLeft: {
    width: 32,
    alignItems: 'center',
  },
  timelineRight: {
    flex: 1,
    marginLeft: 12,
  },
  smallCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primaryLight,
  },
  verticalLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#E2E8F0',
    marginTop: 4,
  },
});
