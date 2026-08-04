import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator, Alert, Modal, Dimensions, Platform, RefreshControl, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { useMarketplaceStore, Product } from '../../src/store/marketplaceStore';
import { useWalletStore } from '../../src/store/walletStore';
import { useAuthStore } from '../../src/store/authStore';
import { useLandStore } from '../../src/store/landStore';
import { ProductSkeleton } from '../../src/components/SkeletonLoader';
import { EmptyState } from '../../src/components/EmptyState';
import { SuccessOverlay } from '../../src/components/SuccessOverlay';
import { AmbientEcoBackground } from '../../src/components/AmbientEcoBackground';

const { width, height } = Dimensions.get('window');

export default function MarketplaceScreen() {
  // Zustand store
  const categories = useMarketplaceStore((state) => state.categories);
  const fetchCategories = useMarketplaceStore((state) => state.fetchCategories);
  const fetchWishlist = useMarketplaceStore((state) => state.fetchWishlist);
  const fetchCart = useMarketplaceStore((state) => state.fetchCart);
  const fetchProducts = useMarketplaceStore((state) => state.fetchProducts);
  const hasMore = useMarketplaceStore((state) => state.hasMore);
  const isLoadingMore = useMarketplaceStore((state) => state.isLoadingMore);
  const currentPage = useMarketplaceStore((state) => state.currentPage);
  const products = useMarketplaceStore((state) => state.products);
  const cart = useMarketplaceStore((state) => state.cart);
  const cartSummary = useMarketplaceStore((state) => state.cartSummary);
  const cartActionLoadingId = useMarketplaceStore((state) => state.cartActionLoadingId);

  const wishlist = useMarketplaceStore((state) => state.wishlist);
  const orders = useMarketplaceStore((state) => state.orders);
  const activeOrderDetails = useMarketplaceStore((state) => state.activeOrderDetails);
  const fetchOrders = useMarketplaceStore((state) => state.fetchOrders);
  const fetchOrderDetails = useMarketplaceStore((state) => state.fetchOrderDetails);
  const cancelOrder = useMarketplaceStore((state) => state.cancelOrder);
  const cropRecommendationsCache = useMarketplaceStore((state) => state.cropRecommendationsCache);
  const fetchCropRecommendations = useMarketplaceStore((state) => state.fetchCropRecommendations);
  const soilRecommendationsCache = useMarketplaceStore((state) => state.soilRecommendationsCache);
  const fetchSoilRecommendations = useMarketplaceStore((state) => state.fetchSoilRecommendations);
  const addToCart = useMarketplaceStore((state) => state.addToCart);
  const removeFromCart = useMarketplaceStore((state) => state.removeFromCart);
  const updateQuantity = useMarketplaceStore((state) => state.updateQuantity);
  const checkout = useMarketplaceStore((state) => state.checkout);
  const setAcceleratedCheckoutItem = useMarketplaceStore((state) => state.setAcceleratedCheckoutItem);
  const debitWallet = useWalletStore((state) => state.requestWithdrawal);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)' as any);
    }
  };

  // Local state
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartVisible, setIsCartVisible] = useState(false);
  const [isOrderTrackerVisible, setIsOrderTrackerVisible] = useState(false);
  const [activeOrderIndex, setActiveOrderIndex] = useState(0);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [cartAlertVisible, setCartAlertVisible] = useState(false);
  const [cartAlertMessage, setCartAlertMessage] = useState('');
  const cartAlertTimer = useRef<any>(null);

  const showCartAlert = (message: string) => {
    setCartAlertMessage(message);
    setCartAlertVisible(true);
    if (cartAlertTimer.current) clearTimeout(cartAlertTimer.current);
    cartAlertTimer.current = setTimeout(() => {
      setCartAlertVisible(false);
    }, 3000);
  };

  // Success Overlay milestone state
  const [successVisible, setSuccessVisible] = useState(false);
  const [successData, setSuccessData] = useState({
    title: '',
    message: '',
    reward: '',
    icon: 'cart-arrow-down'
  });

  const user = useAuthStore((state) => state.user);
  const plots = useLandStore((state) => state.plots);

  const cropType = (user as any)?.cropType || plots[0]?.cropType || 'Wheat';
  const soilType = (user as any)?.soilType || plots[0]?.soilType || 'Alluvial';
  const district = user?.district || 'Bhopal';

  // Animated truck translation state
  const truckAnim = useRef(new Animated.Value(0)).current;

  // Debounced Search State
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    fetchCategories();
    fetchWishlist();
    fetchCart();
    fetchOrders();
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const catObj = categories.find(c => c.name === selectedCategory);
    const slug = catObj ? catObj.slug : selectedCategory;
    
    fetchProducts({ reset: true, search: debouncedSearch, category_slug: slug }).finally(() => {
      setIsLoading(false);
    });
  }, [debouncedSearch, selectedCategory, fetchProducts, categories]);

  useEffect(() => {
    if (cropType) {
      fetchCropRecommendations(cropType);
    }
  }, [cropType]);

  useEffect(() => {
    if (soilType) {
      fetchSoilRecommendations(soilType);
    }
  }, [soilType]);

  const loadMore = () => {
    if (!hasMore || isLoadingMore) return;
    const catObj = categories.find(c => c.name === selectedCategory);
    const slug = catObj ? catObj.slug : selectedCategory;
    fetchProducts({ page: currentPage + 1, search: debouncedSearch, category_slug: slug });
  };



  useEffect(() => {
    if (isOrderTrackerVisible) {
      if (orders.length > 0) {
        fetchOrderDetails(orders[0].order_id);
      }
      
      // Loop truck animation
      truckAnim.setValue(0);
      Animated.loop(
        Animated.timing(truckAnim, {
          toValue: 1,
          duration: 3500,
          useNativeDriver: true,
        })
      ).start();
    } else {
      truckAnim.stopAnimation();
    }
  }, [isOrderTrackerVisible]);

  const latestOrder = orders.length > 0 ? orders[0] : null;
  const latestOrderDetails = latestOrder ? activeOrderDetails[latestOrder.order_id] : null;

  const handleCancelOrder = () => {
    if (!latestOrder) return;
    Alert.alert(
      "Cancel Order",
      "Are you sure you want to cancel this order?",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes, Cancel", 
          style: "destructive",
          onPress: async () => {
            try {
              await cancelOrder(latestOrder.order_id);
              showCartAlert('Order cancelled successfully.');
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.detail || 'Failed to cancel order.');
            }
          }
        }
      ]
    );
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setIsLoading(true);
    setTimeout(() => {
      setRefreshing(false);
      setIsLoading(false);
    }, 1200);
  }, []);

  const cartTotal = cartSummary ? cartSummary.grand_total : cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartCount = cartSummary ? cartSummary.total_items : cart.reduce((total, item) => total + item.quantity, 0);
  const wishlistCount = wishlist.length;

  const dynamicCategories = categories.length > 0 
    ? ['All', ...categories.map(c => c.name)] 
    : ['All', 'Saplings', 'Seeds', 'Fertilizers', 'Farming tools', 'Irrigation systems'];

  // Using server-side filtered products directly
  const filteredProducts = products;

  const cropRecommended = cropRecommendationsCache[cropType] || [];

  const soilRecommended = soilRecommendationsCache[soilType] || [];

  const renderProductCard = (prod: Product, isSlider: boolean = false) => {
    const eta = prod.distance.includes('1.') || prod.distance.includes('2.') || prod.distance.includes('3.') 
      ? 'Delivery: 2 hrs' 
      : 'Delivery: Today';
    return (
      <TouchableOpacity 
        key={prod.id} 
        activeOpacity={0.75} 
        onPress={() => router.push(`/marketplace/product/${prod.id}` as any)}
        style={[styles.productCard, isSlider && { marginRight: 12, marginBottom: 4 }]}
      >
        <View style={styles.iconFrame}>
          {prod.image.startsWith('http') ? (
            <Image source={{ uri: prod.image }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <MaterialCommunityIcons name={prod.image as any} size={44} color={COLORS.primary} />
          )}
          <View style={styles.ratingBadge}>
            <MaterialCommunityIcons name="star" size={10} color="#EAB308" />
            <Text style={styles.ratingText}>{prod.rating}</Text>
          </View>
        </View>
        
        <View style={styles.infoCol}>
          <Text style={styles.prodCat}>{prod.category}</Text>
          <Text style={styles.prodName} numberOfLines={1}>{prod.name}</Text>
          <Text style={styles.prodVendor}>{prod.vendor} ({prod.distance})</Text>

          <View style={styles.etaRow}>
            <MaterialCommunityIcons name="clock-fast" size={12} color={COLORS.primaryLight} style={{ marginRight: 4 }} />
            <Text style={styles.etaText}>{eta}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.prodPrice}>₹{prod.price}</Text>
            <Text style={styles.prodOldPrice}>₹{prod.originalPrice}</Text>
          </View>

        </View>
      </TouchableOpacity>
    );
  };

  return (
    <AmbientEcoBackground style={styles.container}>
      {/* Top Banner header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={{ marginRight: 10, padding: 4 }}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={styles.headerTitle}>Agri Marketplace</Text>
          <Text style={styles.headerSubtitle}>Verified climate-tech saplings & seeds</Text>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {/* Wishlist float trigger */}
          <TouchableOpacity style={styles.cartBtn} onPress={() => router.push('/marketplace/wishlist')}>
            <MaterialCommunityIcons name="heart-outline" size={24} color="#FFFFFF" />
            {wishlistCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{wishlistCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Cart float trigger */}
          <TouchableOpacity style={styles.cartBtn} onPress={() => router.push('/marketplace/cart')}>
            <MaterialCommunityIcons name="shopping-outline" size={24} color="#FFFFFF" />
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search and tracker trigger */}
      <View style={styles.searchBarRow}>
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={22} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search seeds, saplings..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        {orders.length > 0 && (
          <TouchableOpacity style={styles.trackerTrigger} onPress={() => setIsOrderTrackerVisible(true)}>
            <MaterialCommunityIcons name="truck-delivery-outline" size={22} color={COLORS.primary} />
            <Text style={styles.trackerLabel}>Track</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Categories slider */}
      <View style={{ height: 48, marginBottom: 14 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {dynamicCategories.map((cat) => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.categoryPill, selectedCategory === cat && styles.categoryPillActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryLabel, selectedCategory === cat && styles.categoryLabelActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Products Grid */}
      <ScrollView 
        contentContainerStyle={styles.productsContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={COLORS.primaryLight}
            colors={[COLORS.primaryLight]}
          />
        }
      >
        {isLoading ? (
          <View style={styles.grid}>
            <ProductSkeleton />
            <ProductSkeleton />
            <ProductSkeleton />
            <ProductSkeleton />
          </View>
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon="cart-off"
            title="No Products Found"
            description="We couldn't find any products in this category matching your search query. Try clearing filters!"
            buttonLabel="Reset Category"
            onPress={() => setSelectedCategory('All')}
          />
        ) : (
          <View style={{ width: '100%' }}>
            {selectedCategory === 'All' && searchQuery === '' && (
              <>
                {/* Crop Recommended Shelf */}
                <View style={styles.personalizationShelf}>
                  <View style={styles.shelfHeader}>
                    <MaterialCommunityIcons name="seed-outline" size={16} color={COLORS.primaryLight} style={{ marginRight: 6 }} />
                    <Text style={styles.shelfTitle}>Recommended For Crop: {cropType}</Text>
                  </View>
                  <Text style={styles.shelfSub}>High-yield seeds & border saplings custom tailored for boundary verification</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                    {cropRecommended.map((prod) => renderProductCard(prod, true))}
                  </ScrollView>
                </View>

                {/* Soil Recommended Shelf */}
                <View style={styles.personalizationShelf}>
                  <View style={styles.shelfHeader}>
                    <MaterialCommunityIcons name="shovel" size={16} color={COLORS.primaryLight} style={{ marginRight: 6 }} />
                    <Text style={styles.shelfTitle}>Suggested For Soil: {soilType}</Text>
                  </View>
                  <Text style={styles.shelfSub}>Bio-organic fertilizers & augers selected to replenish nitrogen indices</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                    {soilRecommended.map((prod) => renderProductCard(prod, true))}
                  </ScrollView>
                </View>

                <View style={styles.personalizationShelf}>
                  <View style={styles.shelfHeader}>
                    <MaterialCommunityIcons name="sprout" size={16} color={COLORS.primaryLight} style={{ marginRight: 6 }} />
                    <Text style={styles.shelfTitle}>All Verified Climate-Tech Products</Text>
                  </View>
                </View>
              </>
            )}

            {/* Product grid — shared by category tabs, search results, and the "All" tab alike */}
            <View style={styles.grid}>
              {filteredProducts.map((prod) => renderProductCard(prod))}
            </View>
          </View>
        )}

        {/* Load More Button */}
        {hasMore && filteredProducts.length > 0 && (
          <View style={{ alignItems: 'center', marginTop: 20, marginBottom: 20 }}>
            <TouchableOpacity 
              style={[styles.buyNowBtn, { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 }]} 
              onPress={loadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Text style={styles.buyNowText}>Load More</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Top Cart Alert Modal */}
      <Modal visible={cartAlertVisible} transparent animationType="fade" onRequestClose={() => setCartAlertVisible(false)}>
        <View style={styles.topAlertContainer} pointerEvents="box-none">
          <View style={styles.topAlertBox}>
            <MaterialCommunityIcons name="check-circle" size={24} color={COLORS.success} />
            <Text style={styles.topAlertText}>{cartAlertMessage}</Text>
            <TouchableOpacity onPress={() => setCartAlertVisible(false)} style={styles.topAlertClose}>
              <MaterialCommunityIcons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 🚚 Active Order Tracker Modal */}
      <Modal visible={isOrderTrackerVisible} transparent animationType="slide" onRequestClose={() => setIsOrderTrackerVisible(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setIsOrderTrackerVisible(false)}>
          <View style={[styles.sheet, { minHeight: height * 0.65, paddingBottom: 20 + insets.bottom }]} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.sheetTitle}>Active Order Tracking</Text>
                <TouchableOpacity 
                  onPress={async () => {
                    await fetchOrders();
                    if (latestOrder) {
                      await fetchOrderDetails(latestOrder.order_id || latestOrder.order_number);
                    }
                  }} 
                  style={{ padding: 4 }}
                  title="Refresh Status"
                >
                  <MaterialCommunityIcons name="refresh" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => setIsOrderTrackerVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {orders.length > 0 && (
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                <View style={styles.trackerContent}>
                  
                  {/* Live Drone Delivery Route Simulator */}
                  <View style={styles.mapContainer}>
                    <View style={styles.mapHeaderRow}>
                      <MaterialCommunityIcons name="satellite-variant" size={16} color={COLORS.primaryLight} style={{ marginRight: 6 }} />
                      <Text style={styles.mapTitle}>Live Delivery Route Simulator</Text>
                    </View>
                    <View style={styles.mapFieldBox}>
                      <View style={[styles.mapFarmNode, { top: 15, left: 20 }]}>
                        <MaterialCommunityIcons name="store-outline" size={16} color="#0F766E" />
                        <Text style={styles.mapNodeLabel}>Dealer</Text>
                      </View>
                      <View style={[styles.mapFarmNode, { bottom: 15, right: 20 }]}>
                        <MaterialCommunityIcons name="home-map-marker" size={16} color={COLORS.primary} />
                        <Text style={styles.mapNodeLabel}>Your Farm</Text>
                      </View>

                      {/* Animated truck marker */}
                      <Animated.View style={[
                        styles.mapTractor,
                        {
                          transform: [
                            {
                              translateX: truckAnim.interpolate({
                                inputRange: [0, 0.4, 0.7, 1],
                                outputRange: [40, 120, 180, width - 110]
                              })
                            },
                            {
                              translateY: truckAnim.interpolate({
                                inputRange: [0, 0.4, 0.7, 1],
                                outputRange: [25, 10, 60, 95]
                              })
                            }
                          ]
                        }
                      ]}>
                        <View style={styles.tractorCircle}>
                          <MaterialCommunityIcons name="truck-delivery" size={14} color="#FFFFFF" />
                        </View>
                      </Animated.View>
                    </View>
                  </View>

                  <View style={styles.orderSummary}>
                    <Text style={styles.orderSummaryText}>Order No: {latestOrder?.order_number || 'AGR-20260801-E9M5MM'}</Text>
                    <Text style={styles.orderSummaryText}>
                      Status: <Text style={{ fontWeight: '800', color: (latestOrder?.status || '').toUpperCase() === 'SHIPPED' ? COLORS.primary : (latestOrder?.status || '').toUpperCase() === 'DELIVERED' ? COLORS.success : COLORS.warning }}>
                        {(latestOrder?.status || '').toUpperCase() === 'SHIPPED' ? 'SHIPPED (En Route)' : (latestOrder?.status || '').toUpperCase() === 'DELIVERED' ? 'DELIVERED (Fulfilled)' : 'PENDING (Awaiting Dealer Dispatch)'}
                      </Text>
                    </Text>
                    <Text style={styles.orderSummaryText}>
                      Estimated Delivery: {(latestOrder?.status || '').toUpperCase() === 'SHIPPED' ? 'Within 2 Hours (En Route)' : (latestOrder?.status || '').toUpperCase() === 'DELIVERED' ? 'Delivered to Your Farm' : 'Calculating... (Dealer Processing)'}
                    </Text>
                    <Text style={[styles.orderSummaryText, { color: COLORS.primary, fontWeight: '800', marginBottom: 0 }]}>Total: ₹{latestOrder?.final_total || 170}</Text>
                  </View>

                  {/* Dynamic Delivery steps vertical tracker from Backend */}
                  <View style={styles.deliverySteps6}>
                    <Text style={styles.mrvTitle}>Order Progression Log</Text>
                    
                    {!latestOrderDetails ? (
                      <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 20 }} />
                    ) : (
                      latestOrderDetails.status_history.map((step: any, idx: number) => {
                        const isLast = idx === latestOrderDetails.status_history.length - 1;
                        const isCurrentStatus = step.status === latestOrderDetails.status;
                        
                        return (
                          <View key={idx} style={styles.stepRow6}>
                            <View style={styles.stepLeft6}>
                              <View style={[
                                styles.stepBullet6, 
                                isCurrentStatus ? styles.bulletActive : styles.bulletCompleted
                              ]}>
                                <MaterialCommunityIcons 
                                  name={isCurrentStatus ? "truck-fast" : "check"} 
                                  size={10} 
                                  color="#FFFFFF" 
                                />
                              </View>
                              {!isLast && <View style={styles.connectorLine6} />}
                            </View>
                            <View style={styles.stepRight6}>
                              <Text style={[
                                styles.stepLabel6,
                                isCurrentStatus ? styles.textActive : styles.textCompleted
                              ]}>
                                {step.status}
                              </Text>
                              <Text style={styles.stepTime6}>{new Date(step.changed_at).toLocaleString()}</Text>
                              {step.remarks && (
                                <Text style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 2 }}>{step.remarks}</Text>
                              )}
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>

                  {latestOrderDetails?.status === 'PENDING' && (
                    <TouchableOpacity style={styles.cancelOrderBtn} onPress={handleCancelOrder}>
                      <MaterialCommunityIcons name="close-circle-outline" size={20} color={COLORS.danger} style={{ marginRight: 8 }} />
                      <Text style={styles.cancelOrderText}>Cancel Order</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <SuccessOverlay
        visible={successVisible}
        onClose={() => setSuccessVisible(false)}
        title={successData.title}
        message={successData.message}
        rewardText={successData.reward}
        iconName={successData.icon}
      />
    </AmbientEcoBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: '#FFFFFF',
    fontWeight: '900',
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: '700',
    marginTop: 2,
  },
  cartBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: COLORS.accent,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    color: COLORS.primaryDark,
    fontWeight: '800',
  },
  searchBarRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginVertical: 14,
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    ...SHADOWS.soft,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  trackerTrigger: {
    marginLeft: 10,
    width: 52,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  trackerLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 2,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  categoryLabelActive: {
    color: '#FFFFFF',
  },
  productsContainer: {
    paddingHorizontal: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: (Dimensions.get('window').width - 52) / 2,
    minWidth: (Dimensions.get('window').width - 52) / 2,
    flexShrink: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.soft,
  },
  iconFrame: {
    width: '100%',
    height: 140,
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  infoCol: {
    flex: 1,
  },
  prodCat: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primaryLight,
    textTransform: 'uppercase',
  },
  prodName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textDark,
    marginTop: 2,
  },
  prodVendor: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  prodPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
  },
  prodOldPrice: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
    marginLeft: 6,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    marginRight: 4,
  },
  buyNowBtn: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  buyNowText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
    marginRight: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 44, 34, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: height * 0.5,
    maxHeight: height * 0.85,
    padding: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1.5,
    borderColor: '#F1F5F9',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textDark,
  },
  cartItemsScroll: {
    flex: 1,
    marginVertical: 12,
  },
  emptyCart: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 10,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#F8FAFC',
  },
  cartItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  cartItemDetails: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  cartItemPrice: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '800',
    marginTop: 2,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 3,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textDark,
    paddingHorizontal: 8,
  },
  checkoutFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelOrderText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.danger,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  totalVal: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
  },
  checkoutBtn: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  checkoutGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  checkoutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  trackerContent: {
    paddingVertical: 16,
  },
  orderSummary: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orderSummaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  deliverySteps: {
    paddingLeft: 6,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepLabelActive: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  stepLabelWarning: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.warning,
  },
  // Premium map styles
  mapContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 16,
    ...SHADOWS.soft,
  },
  mapHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  mapTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primaryDark,
    textTransform: 'uppercase',
  },
  mapFieldBox: {
    height: 140,
    backgroundColor: '#F0FDF4', // Soft grass green for the farm map background
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
    overflow: 'hidden',
  },
  mapFarmNode: {
    position: 'absolute',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.soft,
  },
  mapNodeLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: COLORS.textDark,
    marginTop: 2,
  },
  mapTractor: {
    position: 'absolute',
    width: 28,
    height: 28,
    left: 0,
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tractorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    ...SHADOWS.glow,
  },
  // Rating overlay inside card
  ratingBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#CBD5E1',
  },
  ratingText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textDark,
    marginLeft: 2,
  },
  // ETA pill inside card
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  etaText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.primaryLight,
  },
  // 6-stage vertical steps
  deliverySteps6: {
    marginTop: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mrvTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 8,
  },
  stepRow6: {
    flexDirection: 'row',
    minHeight: 48,
  },
  stepLeft6: {
    width: 24,
    alignItems: 'center',
  },
  stepBullet6: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  bulletCompleted: {
    backgroundColor: COLORS.success,
  },
  bulletActive: {
    backgroundColor: COLORS.warning,
  },
  bulletPending: {
    backgroundColor: '#CBD5E1',
  },
  connectorLine6: {
    width: 1.5,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 2,
    zIndex: 1,
  },
  stepRight6: {
    flex: 1,
    marginLeft: 10,
    paddingBottom: 14,
  },
  stepLabel6: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  textCompleted: {
    color: COLORS.textDark,
  },
  textActive: {
    color: COLORS.warning,
    fontWeight: '800',
  },
  textPending: {
    color: COLORS.textSecondary,
  },
  stepTime6: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  personalizationShelf: {
    marginTop: 20,
    marginBottom: 8,
    width: '100%',
  },
  shelfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  topAlertContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: 'transparent',
  },
  topAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.glow,
  },
  topAlertText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    marginLeft: 12,
  },
  topAlertClose: {
    padding: 4,
    marginLeft: 8,
  },
  shelfTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  shelfSub: {
    fontSize: 10.5,
    color: '#A7F3D0',
    fontWeight: '600',
    marginBottom: 12,
    lineHeight: 15,
  },
});
