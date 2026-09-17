import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../theme/theme';
import api from '../api/apiClient';
import { useConnectivityStore } from '../store/connectivityStore';

const { width } = Dimensions.get('window');

export interface SubsidizedProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  price_inr: number;
  subsidy_percent: number;
  scheme_code: string;
  scheme_name: string;
  max_subsidy_amount_inr: number;
  unit: string;
  stock: number;
  rating: number;
  image_url: string;
  vendor: string;
  eligibility_criteria: string;
}

export interface LineItem {
  product_id: string;
  product_name: string;
  category: string;
  quantity: number;
  unit_price_inr: number;
  item_total_price_inr: number;
  subsidy_percent: number;
  government_contribution_inr: number;
  farmer_payable_inr: number;
  image_url?: string;
}

export interface DeliveryTimelineEvent {
  stage: string;
  timestamp: string;
  status_label: string;
  notes?: string;
}

export interface GovtOrder {
  id: string;
  order_number: string;
  farmer_id: string;
  farmer_name: string;
  scheme_code: string;
  line_items: LineItem[];
  total_product_price_inr: number;
  total_government_subsidy_inr: number;
  total_farmer_payable_inr: number;
  voucher_applied?: string;
  delivery_address: string;
  status: string; // 'Placed' | 'Approved' | 'Dispatched' | 'Delivered'
  created_at: string;
  delivery_tracking?: {
    current_stage: string;
    dealer_hub?: string;
    dispatch_officer?: string;
    timeline: DeliveryTimelineEvent[];
  };
}

export interface SubsidyVerificationResult {
  is_eligible: boolean;
  verification_reference: string;
  farmer_id: string;
  scheme_code: string;
  scheme_name: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price_inr: number;
  total_product_price_inr: number;
  eligible_subsidy_percent: number;
  government_contribution_inr: number;
  farmer_payable_amount_inr: number;
  eligibility_notes: string;
}

const CATEGORIES = [
  'All',
  'Seeds',
  'Saplings',
  'Agricultural products',
  'Government-supported items',
];

const MOCK_FARMERS = [
  { id: 'FAR-101', name: 'Ramkumar Sharma', village: 'Pipariya, Hoshangabad' },
  { id: 'FAR-102', name: 'Shivpal Singh Patel', village: 'Sehore, MP' },
  { id: 'FAR-103', name: 'Anita Devi Kurmi', village: 'Ashta Ward 4' },
  { id: 'FAR-104', name: 'Devendra Yadav', village: 'Rehada Village' },
];

export function GovtMarketplaceView() {
  const isOnline = useConnectivityStore((state) => state.isOnline);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<SubsidizedProduct[]>([]);
  const [orders, setOrders] = useState<GovtOrder[]>([]);

  // Filters & Tabs
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'catalog' | 'orders'>('catalog');

  // Selected Item / Inspection Modal
  const [selectedProduct, setSelectedProduct] = useState<SubsidizedProduct | null>(null);
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>('FAR-101');
  const [orderQuantity, setOrderQuantity] = useState<number>(1);
  const [verificationResult, setVerificationResult] = useState<SubsidyVerificationResult | null>(null);
  const [generatedVoucherCode, setGeneratedVoucherCode] = useState<string | null>(null);

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState<GovtOrder | null>(null);

  // Loading states
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/govt/marketplace/products', {
        params: {
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          search: searchQuery.trim() ? searchQuery.trim() : undefined,
        },
      });
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setProducts(response.data.data);
      } else {
        throw new Error('Failed to load subsidized catalog.');
      }
    } catch (err: any) {
      console.warn('[GovtMarketplaceView] Fetch products error:', err);
      setError(err?.message || 'Unable to load subsidized products catalog.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await api.get('/govt/marketplace/orders');
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        setOrders(res.data.data);
      }
    } catch (err: any) {
      console.warn('[GovtMarketplaceView] Fetch orders error:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, [selectedCategory]);

  const handleVerifySubsidy = async (product: SubsidizedProduct) => {
    setIsVerifying(true);
    try {
      const farmerObj = MOCK_FARMERS.find((f) => f.id === selectedFarmerId);
      const payload = {
        farmer_id: selectedFarmerId,
        farmer_name: farmerObj?.name || 'Ramkumar Sharma',
        scheme_code: product.scheme_code,
        product_id: product.id,
        quantity: orderQuantity,
      };

      const res = await api.post('/govt/marketplace/verify-subsidy', payload);
      if (res.data && res.data.success) {
        setVerificationResult(res.data);
      }
    } catch (err: any) {
      Alert.alert('Verification Error', err?.response?.data?.detail || 'Failed to verify subsidy eligibility.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleGenerateVoucher = async (product: SubsidizedProduct) => {
    if (!verificationResult) return;
    setIsVerifying(true);
    try {
      const farmerObj = MOCK_FARMERS.find((f) => f.id === selectedFarmerId);
      const payload = {
        farmer_id: selectedFarmerId,
        farmer_name: farmerObj?.name || 'Ramkumar Sharma',
        scheme_code: product.scheme_code,
        product_id: product.id,
        quantity: orderQuantity,
        subsidy_amount_inr: verificationResult.government_contribution_inr,
      };

      const res = await api.post('/govt/marketplace/vouchers/generate', payload);
      if (res.data && res.data.success) {
        setGeneratedVoucherCode(res.data.data.voucher_code);
        Alert.alert('Voucher Generated', `Government Subsidy Voucher ${res.data.data.voucher_code} issued!`);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to generate voucher.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubsidizedCheckout = async (product: SubsidizedProduct) => {
    setIsCheckingOut(true);
    try {
      const farmerObj = MOCK_FARMERS.find((f) => f.id === selectedFarmerId);
      const payload = {
        farmer_id: selectedFarmerId,
        farmer_name: farmerObj?.name || 'Ramkumar Sharma',
        scheme_code: product.scheme_code,
        cart_items: [
          {
            product_id: product.id,
            quantity: orderQuantity,
          },
        ],
        voucher_code: generatedVoucherCode || undefined,
        delivery_address: `Krishi Supply Center, ${farmerObj?.village || 'Hoshangabad District'}, MP`,
      };

      const res = await api.post('/govt/marketplace/checkout', payload);
      if (res.data && res.data.success) {
        Alert.alert(
          'Order Placed Successfully!',
          `Order ${res.data.data.order_number} has been created.\nGovernment Subsidy: ₹${res.data.data.total_government_subsidy_inr.toLocaleString(
            'en-IN'
          )}\nFarmer Payable: ₹${res.data.data.total_farmer_payable_inr.toLocaleString('en-IN')}`
        );
        setSelectedProduct(null);
        setVerificationResult(null);
        setGeneratedVoucherCode(null);
        fetchOrders();
        setActiveTab('orders');
      }
    } catch (err: any) {
      Alert.alert('Checkout Failed', err?.response?.data?.detail || 'Unable to complete checkout.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, nextStatus: string) => {
    try {
      const res = await api.post(`/govt/marketplace/orders/${orderId}/status`, {
        status: nextStatus,
        remarks: `Order status advanced to ${nextStatus} by Government Nodal Officer.`,
      });
      if (res.data && res.data.success) {
        Alert.alert('Status Updated', `Order status changed to ${nextStatus}.`);
        fetchOrders();
        if (selectedOrder) {
          setSelectedOrder(res.data.data);
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to update order status.');
    }
  };

  if (!isOnline) {
    return (
      <View style={styles.stateContainer}>
        <MaterialCommunityIcons name="wifi-off" size={48} color="#EF4444" />
        <Text style={styles.stateTitle}>Offline Mode</Text>
        <Text style={styles.stateSubtitle}>Connect to network to browse Government Subsidized Catalog & generate vouchers.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchProducts}>
          <Text style={styles.retryBtnText}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
      {/* ── 1. HEADER ROW & SEGMENT SWITCHER ── */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>Government Subsidized Marketplace</Text>
          <Text style={styles.headerSub}>State Co-Funded Seeds, Saplings & Agri Tech</Text>
        </View>
        <View style={styles.tabToggleRow}>
          <TouchableOpacity
            style={[styles.tabToggleBtn, activeTab === 'catalog' && styles.tabToggleBtnActive]}
            onPress={() => setActiveTab('catalog')}
          >
            <Text style={[styles.tabToggleText, activeTab === 'catalog' && styles.tabToggleTextActive]}>Catalog</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabToggleBtn, activeTab === 'orders' && styles.tabToggleBtnActive]}
            onPress={() => setActiveTab('orders')}
          >
            <Text style={[styles.tabToggleText, activeTab === 'orders' && styles.tabToggleTextActive]}>
              Orders ({orders.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'catalog' ? (
        <>
          {/* ── 2. SEARCH & CATEGORY FILTERS ── */}
          <View style={styles.searchBarRow}>
            <MaterialCommunityIcons name="magnify" size={20} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search seeds, saplings, solar pumps..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={fetchProducts}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => { setSearchQuery(''); fetchProducts(); }}>
                <MaterialCommunityIcons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={{ gap: 6, paddingBottom: 12 }}>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ── 3. PRODUCT GRID ── */}
          {isLoading ? (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="large" color="#0F766E" />
              <Text style={styles.loadingText}>Loading Subsidized Agricultural Catalog...</Text>
            </View>
          ) : products.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="store-off-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Subsidized Items Found</Text>
              <Text style={styles.emptySub}>No products match your search or selected category filter.</Text>
            </View>
          ) : (
            <View style={styles.productGrid}>
              {products.map((prod) => {
                const subsidyAmount = Math.round(prod.price_inr * (prod.subsidy_percent / 100));
                const farmerPayable = prod.price_inr - subsidyAmount;

                return (
                  <View key={prod.id} style={styles.productCard}>
                    <View style={styles.imageContainer}>
                      <Image source={{ uri: prod.image_url }} style={styles.productImage} resizeMode="cover" />
                      <View style={styles.subsidyBadge}>
                        <Text style={styles.subsidyBadgeText}>{prod.subsidy_percent}% GOVT SUBSIDY</Text>
                      </View>
                    </View>

                    <View style={styles.cardContent}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={styles.schemeTag}>{prod.scheme_code}</Text>
                        <Text style={styles.categoryTag}>{prod.category}</Text>
                      </View>
                      <Text style={styles.productName} numberOfLines={2}>{prod.name}</Text>
                      <Text style={styles.vendorText}>By {prod.vendor}</Text>

                      {/* Pricing Breakdown */}
                      <View style={styles.priceContainer}>
                        <Text style={styles.fullPriceText}>Original: ₹{prod.price_inr.toLocaleString('en-IN')}</Text>
                        <View style={styles.payableRow}>
                          <Text style={styles.payableLabel}>Farmer Payable:</Text>
                          <Text style={styles.payableValue}>₹{farmerPayable.toLocaleString('en-IN')}</Text>
                        </View>
                        <Text style={styles.savedText}>Govt Contribution: ₹{subsidyAmount.toLocaleString('en-IN')}</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.orderBtn}
                        onPress={() => {
                          setSelectedProduct(prod);
                          setOrderQuantity(1);
                          setVerificationResult(null);
                          setGeneratedVoucherCode(null);
                        }}
                      >
                        <MaterialCommunityIcons name="cart-arrow-down" size={14} color="#FFFFFF" />
                        <Text style={styles.orderBtnText}>Verify Subsidy & Order</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </>
      ) : (
        /* ── 4. SUBSIDIZED ORDERS LIST TAB ── */
        <View style={{ paddingVertical: 8 }}>
          {orders.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="clipboard-list-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Subsidized Orders</Text>
              <Text style={styles.emptySub}>No government subsidized procurement orders have been placed yet.</Text>
            </View>
          ) : (
            orders.map((ord) => (
              <View key={ord.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderNumber}>{ord.order_number}</Text>
                    <Text style={styles.orderFarmer}>Farmer: {ord.farmer_name} ({ord.farmer_id})</Text>
                  </View>
                  <View style={styles.orderStatusBadge}>
                    <Text style={styles.orderStatusText}>{ord.status}</Text>
                  </View>
                </View>

                {/* Items Summary */}
                {ord.line_items && ord.line_items.map((item, idx) => (
                  <View key={idx} style={styles.orderLineItem}>
                    <MaterialCommunityIcons name="package-variant-closed" size={16} color="#0F766E" />
                    <Text style={styles.orderLineText} numberOfLines={1}>
                      {item.product_name} x {item.quantity} ({item.subsidy_percent}% Subsidy)
                    </Text>
                  </View>
                ))}

                {/* Pricing Summary */}
                <View style={styles.orderPriceRow}>
                  <Text style={styles.orderPriceLabel}>Total: ₹{ord.total_product_price_inr.toLocaleString('en-IN')}</Text>
                  <Text style={styles.orderGovtLabel}>Govt: ₹{ord.total_government_subsidy_inr.toLocaleString('en-IN')}</Text>
                  <Text style={styles.orderNetLabel}>Payable: ₹{ord.total_farmer_payable_inr.toLocaleString('en-IN')}</Text>
                </View>

                {/* Tracking & Actions */}
                <View style={styles.orderFooter}>
                  <TouchableOpacity
                    style={styles.trackBtn}
                    onPress={() => setSelectedOrder(ord)}
                  >
                    <MaterialCommunityIcons name="truck-delivery-outline" size={14} color="#0F766E" />
                    <Text style={styles.trackBtnText}>Track Delivery</Text>
                  </TouchableOpacity>

                  {ord.status === 'Placed' && (
                    <TouchableOpacity
                      style={styles.advanceStatusBtn}
                      onPress={() => handleUpdateOrderStatus(ord.id, 'Approved')}
                    >
                      <Text style={styles.advanceStatusText}>Approve Order</Text>
                    </TouchableOpacity>
                  )}

                  {ord.status === 'Approved' && (
                    <TouchableOpacity
                      style={styles.advanceStatusBtn}
                      onPress={() => handleUpdateOrderStatus(ord.id, 'Dispatched')}
                    >
                      <Text style={styles.advanceStatusText}>Dispatch Order</Text>
                    </TouchableOpacity>
                  )}

                  {ord.status === 'Dispatched' && (
                    <TouchableOpacity
                      style={[styles.advanceStatusBtn, { backgroundColor: '#059669' }]}
                      onPress={() => handleUpdateOrderStatus(ord.id, 'Delivered')}
                    >
                      <Text style={styles.advanceStatusText}>Mark Delivered</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* ── 5. PRODUCT SUBSIDY VERIFICATION & CHECKOUT MODAL ── */}
      {selectedProduct && (
        <Modal animationType="slide" transparent visible={!!selectedProduct} onRequestClose={() => setSelectedProduct(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Subsidized Item Procurement</Text>
                <TouchableOpacity onPress={() => setSelectedProduct(null)}>
                  <Ionicons name="close" size={24} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalProdName}>{selectedProduct.name}</Text>
                <Text style={styles.modalProdDesc}>{selectedProduct.description}</Text>

                {/* Farmer Selection */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Select Eligible Beneficiary Farmer *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', gap: 6 }}>
                    {MOCK_FARMERS.map((f) => (
                      <TouchableOpacity
                        key={f.id}
                        style={[styles.farmerChip, selectedFarmerId === f.id && styles.farmerChipActive]}
                        onPress={() => setSelectedFarmerId(f.id)}
                      >
                        <Text style={[styles.farmerChipText, selectedFarmerId === f.id && styles.farmerChipTextActive]}>
                          {f.name} ({f.id})
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Quantity Control */}
                <View style={styles.qtyRow}>
                  <Text style={styles.inputLabel}>Quantity ({selectedProduct.unit}):</Text>
                  <View style={styles.qtyControl}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                    >
                      <Text style={styles.qtyBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyVal}>{orderQuantity}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => setOrderQuantity(orderQuantity + 1)}
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Subsidy Calculation Breakdown Box */}
                {!verificationResult ? (
                  <TouchableOpacity
                    style={[styles.actionCTA, isVerifying && { opacity: 0.6 }]}
                    onPress={() => handleVerifySubsidy(selectedProduct)}
                    disabled={isVerifying}
                  >
                    {isVerifying ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="calculator-variant" size={16} color="#FFFFFF" />
                        <Text style={styles.actionCTAText}>Verify Eligibility & Calculate Subsidy</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View style={styles.calculationBox}>
                    <View style={styles.calcHeader}>
                      <MaterialCommunityIcons name="check-decagram" size={18} color="#059669" />
                      <Text style={styles.calcTitle}>Eligible under {verificationResult.scheme_name}</Text>
                    </View>

                    <View style={styles.calcRow}>
                      <Text style={styles.calcLabel}>Total Original Price:</Text>
                      <Text style={styles.calcVal}>₹{verificationResult.total_product_price_inr.toLocaleString('en-IN')}</Text>
                    </View>

                    <View style={styles.calcRow}>
                      <Text style={[styles.calcLabel, { color: '#059669' }]}>Government Contribution ({verificationResult.eligible_subsidy_percent}%):</Text>
                      <Text style={[styles.calcVal, { color: '#059669', fontWeight: '800' }]}>
                        -₹{verificationResult.government_contribution_inr.toLocaleString('en-IN')}
                      </Text>
                    </View>

                    <View style={[styles.calcRow, { paddingTop: 6, borderTopWidth: 1, borderTopColor: '#BBF7D0' }]}>
                      <Text style={[styles.calcLabel, { fontSize: 13, fontWeight: '800', color: '#0F172A' }]}>Farmer Net Payable Amount:</Text>
                      <Text style={[styles.calcVal, { fontSize: 15, fontWeight: '800', color: '#0F766E' }]}>
                        ₹{verificationResult.farmer_payable_amount_inr.toLocaleString('en-IN')}
                      </Text>
                    </View>

                    {/* Voucher Generator / Status */}
                    {!generatedVoucherCode ? (
                      <TouchableOpacity
                        style={styles.voucherBtn}
                        onPress={() => handleGenerateVoucher(selectedProduct)}
                      >
                        <MaterialCommunityIcons name="ticket-percent-outline" size={14} color="#0F766E" />
                        <Text style={styles.voucherBtnText}>Generate Official Subsidy Voucher</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.voucherBadgeBox}>
                        <MaterialCommunityIcons name="qrcode" size={18} color="#059669" />
                        <Text style={styles.voucherBadgeText}>Voucher Code: {generatedVoucherCode} (APPLIED)</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={[styles.checkoutBtn, isCheckingOut && { opacity: 0.6 }]}
                      onPress={() => handleSubsidizedCheckout(selectedProduct)}
                      disabled={isCheckingOut}
                    >
                      {isCheckingOut ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.checkoutBtnText}>Confirm Subsidized Order Checkout</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* ── 6. ORDER DELIVERY TRACKING MODAL ── */}
      {selectedOrder && (
        <Modal animationType="slide" transparent visible={!!selectedOrder} onRequestClose={() => setSelectedOrder(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Delivery Tracking Log</Text>
                <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                  <Ionicons name="close" size={24} color="#0F172A" />
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F766E', marginBottom: 2 }}>{selectedOrder.order_number}</Text>
              <Text style={{ fontSize: 11, color: '#64748B', marginBottom: 12 }}>Beneficiary: {selectedOrder.farmer_name}</Text>

              <ScrollView showsVerticalScrollIndicator={false}>
                {selectedOrder.delivery_tracking?.timeline ? (
                  selectedOrder.delivery_tracking.timeline.map((ev, idx) => (
                    <View key={idx} style={styles.timelineRow}>
                      <View style={styles.timelineDot} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.timelineAction}>{ev.status_label}</Text>
                        <Text style={styles.timelineTime}>{ev.timestamp}</Text>
                        {ev.notes ? <Text style={styles.timelineNotes}>{ev.notes}</Text> : null}
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noDataText}>No delivery events logged yet.</Text>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingTop: 12 },
  stateContainer: { padding: 32, alignItems: 'center', justifyContent: 'center', minHeight: 240 },
  stateTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 12 },
  stateSubtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 6, lineHeight: 18 },
  loadingText: { fontSize: 14, fontWeight: '600', color: '#0F766E', marginTop: 12 },
  retryBtn: { marginTop: 16, backgroundColor: '#0F766E', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  retryBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 11, color: '#64748B' },
  tabToggleRow: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 10, padding: 2 },
  tabToggleBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  tabToggleBtnActive: { backgroundColor: '#0F766E' },
  tabToggleText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  tabToggleTextActive: { color: '#FFFFFF' },
  searchBarRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, paddingHorizontal: 12, height: 42, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 13, color: '#0F172A', marginLeft: 6 },
  categoryScroll: { marginBottom: 10 },
  categoryChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#E2E8F0', marginRight: 6 },
  categoryChipActive: { backgroundColor: '#0F766E' },
  categoryChipText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  categoryChipTextActive: { color: '#FFFFFF' },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginTop: 8 },
  emptySub: { fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4 },
  productGrid: { gap: 12 },
  productCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden', ...SHADOWS.soft },
  imageContainer: { height: 130, width: '100%', position: 'relative' },
  productImage: { width: '100%', height: '100%' },
  subsidyBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: '#059669', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  subsidyBadgeText: { color: '#FFFFFF', fontWeight: '800', fontSize: 10 },
  cardContent: { padding: 12 },
  schemeTag: { fontSize: 10, fontWeight: '800', color: '#0F766E', backgroundColor: '#CCFBF1', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  categoryTag: { fontSize: 10, fontWeight: '700', color: '#64748B', backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  productName: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginTop: 6 },
  vendorText: { fontSize: 11, color: '#64748B', marginTop: 2 },
  priceContainer: { backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8, marginVertical: 8 },
  fullPriceText: { fontSize: 11, color: '#64748B', textDecorationLine: 'line-through' },
  payableRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  payableLabel: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
  payableValue: { fontSize: 15, fontWeight: '800', color: '#0F766E' },
  savedText: { fontSize: 11, fontWeight: '700', color: '#059669', marginTop: 2 },
  orderBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F766E', paddingVertical: 8, borderRadius: 10, gap: 4 },
  orderBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  orderCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', ...SHADOWS.soft },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  orderNumber: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  orderFarmer: { fontSize: 11, color: '#64748B', marginTop: 2 },
  orderStatusBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  orderStatusText: { fontSize: 11, fontWeight: '700', color: '#059669' },
  orderLineItem: { flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 2 },
  orderLineText: { fontSize: 12, color: '#334155', flex: 1 },
  orderPriceRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8, marginVertical: 8 },
  orderPriceLabel: { fontSize: 11, color: '#64748B' },
  orderGovtLabel: { fontSize: 11, fontWeight: '700', color: '#059669' },
  orderNetLabel: { fontSize: 11, fontWeight: '800', color: '#0F766E' },
  orderFooter: { flexDirection: 'row', gap: 6, marginTop: 4 },
  trackBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0', paddingVertical: 6, borderRadius: 8, gap: 4 },
  trackBtnText: { fontSize: 11, fontWeight: '700', color: '#0F766E' },
  advanceStatusBtn: { backgroundColor: '#0F766E', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, justifyContent: 'center' },
  advanceStatusText: { color: '#FFFFFF', fontWeight: '800', fontSize: 11 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  modalProdName: { fontSize: 16, fontWeight: '800', color: '#0F766E' },
  modalProdDesc: { fontSize: 12, color: '#64748B', marginVertical: 4 },
  inputGroup: { marginVertical: 10 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 4 },
  farmerChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: '#F1F5F9', marginRight: 6 },
  farmerChipActive: { backgroundColor: '#0F766E' },
  farmerChipText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  farmerChipTextActive: { color: '#FFFFFF' },
  qtyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  qtyVal: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  actionCTA: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F766E', paddingVertical: 10, borderRadius: 12, marginTop: 12, gap: 6 },
  actionCTAText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  calculationBox: { backgroundColor: '#F0FDF4', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#BBF7D0', marginVertical: 10 },
  calcHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  calcTitle: { fontSize: 12, fontWeight: '800', color: '#166534' },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 3 },
  calcLabel: { fontSize: 12, color: '#475569' },
  calcVal: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
  voucherBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', paddingVertical: 8, borderRadius: 8, marginTop: 8, gap: 4 },
  voucherBtnText: { fontSize: 11, fontWeight: '700', color: '#0F766E' },
  voucherBadgeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', padding: 8, borderRadius: 8, marginTop: 8, gap: 6 },
  voucherBadgeText: { fontSize: 11, fontWeight: '800', color: '#15803D' },
  checkoutBtn: { backgroundColor: '#059669', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  checkoutBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  timelineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#0F766E', marginTop: 4 },
  timelineAction: { fontSize: 12, fontWeight: '800', color: '#0F172A' },
  timelineTime: { fontSize: 10, color: '#94A3B8' },
  timelineNotes: { fontSize: 11, color: '#475569', marginTop: 2 },
  noDataText: { fontSize: 11, color: '#94A3B8', fontStyle: 'italic' },
});
