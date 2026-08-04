import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions, Platform, Modal, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, TYPOGRAPHY, SHADOWS } from '../../../src/theme/theme';
import { useMarketplaceStore } from '../../../src/store/marketplaceStore';

const { width } = Dimensions.get('window');

export default function ProductDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const products = useMarketplaceStore((state) => state.products);
  const productDetailsCache = useMarketplaceStore((state) => state.productDetailsCache);
  const fetchProductDetails = useMarketplaceStore((state) => state.fetchProductDetails);
  
  const addToCart = useMarketplaceStore((state) => state.addToCart);
  const clearCart = useMarketplaceStore((state) => state.clearCart);
  const setAcceleratedCheckoutItem = useMarketplaceStore((state) => state.setAcceleratedCheckoutItem);
  const wishlist = useMarketplaceStore((state) => state.wishlist);
  const toggleWishlist = useMarketplaceStore((state) => state.toggleWishlist);
  const cartActionLoadingId = useMarketplaceStore((state) => state.cartActionLoadingId);

  const [isLoading, setIsLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [showCartPopup, setShowCartPopup] = useState(false);

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      fetchProductDetails(id).finally(() => setIsLoading(false));
    }
  }, [id]);

  const product = productDetailsCache[id] || products.find(p => p.id === id);
  const qty = 1;

  if (isLoading && !product) {
    return (
      <View style={styles.errorContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Product not found!</Text>
        <TouchableOpacity style={styles.backBtnError} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isWishlisted = wishlist.includes(product.id);
  const discountPercent = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  
  // Custom mapping for 4 specific products to bypass AsyncStorage cache
  const customImageMapping: Record<string, string[]> = {
    'prod_sap1': ['tree-outline', 'pine-tree', 'leaf', 'forest'],
    'prod_sap2': ['leaf', 'tree-outline', 'fruit-cherries'],
    'prod_seed1': ['water-outline', 'sprout'],
    'prod_fert1': ['flask-outline', 'leaf-circle-outline']
  };

  const images = product.images || customImageMapping[product.id] || [product.image];

  const handleAddToCart = () => {
    addToCart(product, qty);
    setShowCartPopup(true);
  };

  const handleBuyNow = async () => {
    setIsLoading(true);
    await clearCart();
    await addToCart(product, qty);
    setAcceleratedCheckoutItem(null); // Use real backend cart checkout flow
    setIsLoading(false);
    router.push('/marketplace/address');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={() => toggleWishlist(product.id)}>
          <MaterialCommunityIcons name={isWishlisted ? "heart" : "heart-outline"} size={24} color={isWishlisted ? COLORS.danger : "#FFFFFF"} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Product Image Area */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const slide = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveSlide(slide);
            }}
          >
            {images.map((img, index) => (
              <View key={index} style={{ width: width, height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                {img.startsWith('http') ? (
                  <Image source={{ uri: img }} style={{ width: width * 0.8, height: width * 0.5, borderRadius: 20 }} resizeMode="cover" />
                ) : (
                  <View style={[styles.iconFrame, { width: 100, height: 100, borderRadius: 20 }]}>
                    <MaterialCommunityIcons name={img as any} size={64} color={COLORS.primary} />
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
          
          {images.length > 1 && (
            <View style={styles.paginationContainer}>
              {images.map((_, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.paginationDot, 
                    activeSlide === index ? styles.paginationDotActive : null
                  ]} 
                />
              ))}
            </View>
          )}

          {discountPercent > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discountPercent}% OFF</Text>
            </View>
          )}

          {images.length > 1 && (
            <View style={styles.imageCounterBadge}>
              <Text style={styles.imageCounterText}>
                {activeSlide + 1}/{images.length}
              </Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.category}>{product.category}</Text>
          <Text style={styles.title}>{product.name}</Text>
          
          <View style={styles.metaRow}>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>{product.rating} ★</Text>
            </View>
            <Text style={styles.stockStatus}>
              {product.inStock ? 'In Stock' : 'Out of Stock'}
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{product.price}</Text>
            <Text style={styles.oldPrice}>₹{product.originalPrice}</Text>
          </View>

          <View style={styles.divider} />

          {/* Delivery & Vendor Info */}
          <View style={styles.vendorBox}>
            <MaterialCommunityIcons name="storefront-outline" size={20} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.vendorName}>Sold by {product.vendor}</Text>
              <Text style={styles.deliveryText}>
                {product.distance.includes('1.') || product.distance.includes('2.') || product.distance.includes('3.') 
                  ? 'Fast Delivery (approx. 2 hrs)' 
                  : 'Standard Delivery (Today)'} • {product.distance} away
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.sectionTitle}>Product Description</Text>
          <Text style={styles.description}>{product.description}</Text>

          {/* Tags (Only from backend details) */}
          {(product as any).crop_tags?.length > 0 && (
            <View style={styles.tagSection}>
              <Text style={styles.tagTitle}>Suitable Crops</Text>
              <View style={styles.tagRow}>
                {(product as any).crop_tags.map((tag: string, idx: number) => (
                  <View key={`crop-${idx}`} style={styles.tagBadge}>
                    <Text style={styles.tagBadgeText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {(product as any).soil_tags?.length > 0 && (
            <View style={styles.tagSection}>
              <Text style={styles.tagTitle}>Ideal Soil Types</Text>
              <View style={styles.tagRow}>
                {(product as any).soil_tags.map((tag: string, idx: number) => (
                  <View key={`soil-${idx}`} style={styles.tagBadge}>
                    <Text style={styles.tagBadgeText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      {/* Bottom Action Bar (Flipkart Style) */}
      <View style={[styles.bottomBar, { paddingBottom: (Platform.OS === 'ios' ? 20 : 12) + insets.bottom }]}>
        <TouchableOpacity 
          style={styles.addToCartBtn} 
          onPress={handleAddToCart}
          disabled={cartActionLoadingId === product.id}
        >
          {cartActionLoadingId === product.id ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 6 }} />
          ) : (
            <MaterialCommunityIcons name="cart-plus" size={20} color={COLORS.textDark} style={{ marginRight: 6 }} />
          )}
          <Text style={styles.addToCartText}>
            {cartActionLoadingId === product.id ? 'Adding...' : 'Add to Cart'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.buyNowBtn} onPress={handleBuyNow}>
          <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.buyNowGradient}>
            <MaterialCommunityIcons name="flash" size={20} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.buyNowText}>Buy Now</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      {/* Custom Add to Cart Pop-up */}
      <Modal
        visible={showCartPopup}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCartPopup(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBox}>
              <MaterialCommunityIcons name="check-circle" size={48} color={COLORS.success} />
            </View>
            <Text style={styles.modalTitle}>Added to Cart</Text>
            <Text style={styles.modalSubtitle}>"{product.name}" has been added to your cart successfully.</Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowCartPopup(false)}>
                <Text style={styles.modalBtnCancelText}>Keep Shopping</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalBtnPrimary} 
                onPress={() => {
                  setShowCartPopup(false);
                  router.push('/marketplace/cart');
                }}
              >
                <Text style={styles.modalBtnPrimaryText}>View Cart</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  errorText: {
    fontSize: 18,
    color: COLORS.textDark,
    fontWeight: '700',
    marginBottom: 16,
  },
  backBtnError: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFF',
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    zIndex: 10,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconFrame: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#ECFCCB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 100, // Space for bottom bar
  },
  imageContainer: {
    width: width,
    height: width * 0.55,
    backgroundColor: '#F8FAFC',
    position: 'relative',
    marginTop: 10,
    paddingBottom: 20,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    flexDirection: 'row',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    ...SHADOWS.glow,
  },
  cartBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 12,
  },
  cartBtnText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  buyBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buyBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    ...SHADOWS.glow,
  },
  modalIconBox: {
    marginBottom: 16,
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textDark,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  modalBtnCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  modalBtnPrimary: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalBtnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 16,
    backgroundColor: COLORS.primary,
  },
  imagePlaceholder: {
    width: '80%',
    height: '80%',
    backgroundColor: '#ECFCCB',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: COLORS.danger,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  discountText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 12,
  },
  imageCounterBadge: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  infoContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    minHeight: Dimensions.get('window').height * 0.5,
    marginTop: -20,
    ...SHADOWS.glow,
  },
  category: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textDark,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingBadge: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 12,
  },
  ratingText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 12,
  },
  stockStatus: {
    color: COLORS.success,
    fontWeight: '700',
    fontSize: 13,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  price: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.textDark,
    marginRight: 12,
  },
  oldPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },
  vendorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
  },
  vendorName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  deliveryText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    height: Platform.OS === 'ios' ? 80 : 60,
  },
  addToCartBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    height: 60,
  },
  addToCartText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  buyNowBtn: {
    flex: 1,
    height: 60,
  },
  buyNowGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyNowText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tagSection: {
    marginTop: 16,
  },
  tagTitle: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textDark,
    fontWeight: '700',
    marginBottom: 8,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
  },
  tagBadgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textDark,
    fontWeight: '600',
  }
});
