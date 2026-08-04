import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { useMarketplaceStore } from '../../src/store/marketplaceStore';

const { width } = Dimensions.get('window');

export default function WishlistScreen() {
  const router = useRouter();
  
  const wishlistedProducts = useMarketplaceStore((state) => state.wishlistProducts);
  const toggleWishlist = useMarketplaceStore((state) => state.toggleWishlist);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wishlist</Text>
        <View style={{ width: 40 }} />
      </View>

      {wishlistedProducts.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="heart-broken-outline" size={80} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
          <Text style={styles.emptySub}>Save your favorite saplings and tools to view them here later!</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => router.back()}>
            <Text style={styles.shopBtnText}>Explore Marketplace</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
          {wishlistedProducts.map((prod) => (
            <TouchableOpacity 
              key={prod.id} 
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => router.push(`/marketplace/product/${prod.id}` as any)}
            >
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name={prod.image as any} size={40} color={COLORS.primary} />
              </View>
              
              <View style={styles.infoCol}>
                <Text style={styles.catText}>{prod.category}</Text>
                <Text style={styles.nameText} numberOfLines={1}>{prod.name}</Text>
                <Text style={styles.vendorText} numberOfLines={1}>{prod.vendor}</Text>
                
                <View style={styles.priceRow}>
                  <Text style={styles.priceText}>₹{prod.price}</Text>
                  <Text style={styles.oldPriceText}>₹{prod.originalPrice}</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.removeBtn}
                onPress={() => toggleWishlist(prod.id)}
              >
                <MaterialCommunityIcons name="heart" size={24} color={COLORS.danger} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textDark,
    marginTop: 20,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  shopBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
  listContainer: {
    padding: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.soft,
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoCol: {
    flex: 1,
  },
  catText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  nameText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 2,
  },
  vendorText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textDark,
    marginRight: 8,
  },
  oldPriceText: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  removeBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
