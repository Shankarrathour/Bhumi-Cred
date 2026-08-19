import { create } from 'zustand';
console.log("[marketplaceStore] Module Start");
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/apiClient';
import { useAuthStore } from './authStore';

export interface Category {
  id: string;
  name: string;
  icon?: string;
  image_url?: string;
  description?: string;
  color?: string;
  display_order: number;
  slug: string;
  is_active: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug?: string;
  category: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewCount?: number;
  image: string; // Ionicons/Material Icon names or primary_image URL
  images?: string[]; // Array of additional images for carousel
  description: string;
  vendor: string;
  distance: string; // distance from farmer
  inStock: boolean;
}

export interface ProductDetail extends Product {
  sku: string;
  stock_quantity: number;
  unit: string;
  brand?: string;
  crop_tags: string[];
  soil_tags: string[];
  season_tags: string[];
  delivery_time?: string;
  is_featured: boolean;
  total_sold: number;
}


export interface CartItem {
  id?: string; // CartItem ID from backend
  product: Product;
  quantity: number;
  subtotal?: number; // from backend
}

export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  status: string;
  vendorName: string;
  otp: string;
}

export interface CartSummary {
  total_items: number;
  subtotal: number;
  discount: number;
  grand_total: number;
}

export interface CheckoutAddress {
  full_name: string;
  mobile: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface CheckoutSummaryResponse {
  items: any[];
  total_items: number;
  subtotal: number;
  discount: number;
  grand_total: number;
  delivery_charge: number;
  final_total: number;
  delivery_address: CheckoutAddress;
  stock_valid: boolean;
}

export interface OrderListItem {
  order_id: string;
  order_number: string;
  status: string;
  total_items: number;
  final_total: number;
  created_at: string;
}

export interface OrderDetails {
  id: string;
  order_number: string;
  status: string;
  status_history: any[];
  items: any[];
  subtotal: number;
  discount: number;
  delivery_charge: number;
  final_total: number;
  delivery_address: CheckoutAddress;
  created_at: string;
}

interface MarketplaceState {
  categories: Category[];
  products: Product[];
  currentPage: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  cart: CartItem[];
  cartSummary: CartSummary | null;
  checkoutAddress: CheckoutAddress | null;
  checkoutSummaryResponse: CheckoutSummaryResponse | null;
  orders: OrderListItem[];
  activeOrderDetails: Record<string, OrderDetails>;
  isLoading: boolean;
  cartActionLoadingId: string | null;
  productDetailsCache: Record<string, ProductDetail>;
  cropRecommendationsCache: Record<string, Product[]>;
  soilRecommendationsCache: Record<string, Product[]>;
  wishlistProducts: Product[];
  fetchCategories: () => Promise<void>;
  fetchProducts: (params?: { page?: number; limit?: number; search?: string; category_slug?: string; reset?: boolean }) => Promise<void>;
  fetchProductDetails: (id: string) => Promise<void>;
  fetchCropRecommendations: (crop: string) => Promise<void>;
  fetchSoilRecommendations: (soil: string) => Promise<void>;
  fetchWishlist: () => Promise<void>;
  fetchCart: () => Promise<void>;
  fetchOrders: () => Promise<void>;
  fetchOrderDetails: (orderId: string, force?: boolean) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  
  setCheckoutAddress: (address: CheckoutAddress) => void;
  prepareCheckout: (address: CheckoutAddress) => Promise<boolean>;
  checkout: (vendorName: string, paymentMethod?: string) => Promise<string>;
  
  acceleratedCheckoutItem: CartItem | null;
  setAcceleratedCheckoutItem: (item: CartItem | null) => void;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
}

const defaultProducts: Product[] = [
  // 1. Saplings (Tree Plantation)
  {
    id: 'prod_sap1',
    name: 'Hybrid Eucalyptus Sapling',
    category: 'Saplings',
    price: 15,
    originalPrice: 25,
    rating: 4.8,
    image: 'tree-outline',
    images: ['tree-outline', 'leaf', 'flower-outline', 'sprout-outline'],
    description: 'Fast-growing structural pulpwood sapling with low initial water requirement. Perfect for borders.',
    vendor: 'Bhumi Forest Nursery',
    distance: '3.5 km',
    inStock: true,
  },
  {
    id: 'prod_sap2',
    name: 'Grafted Mango (Alphonso)',
    category: 'Saplings',
    price: 75,
    originalPrice: 120,
    rating: 4.9,
    image: 'leaf',
    description: 'Premium mango sapling yielding heavy crop from Year 4 onwards. Highly heat resilient.',
    vendor: 'Hindustan Agri Farms',
    distance: '6.2 km',
    inStock: true,
  },
  // 2. Seeds
  {
    id: 'prod_seed1',
    name: 'Sonalika Wheat Seeds (HVY)',
    category: 'Seeds',
    price: 320, // per 10kg
    originalPrice: 450,
    rating: 4.7,
    image: 'water-outline',
    description: 'High yielding sustainable wheat seed variant designed for zero-tillage deep rooting.',
    vendor: 'Jai Kisaan Seed Store',
    distance: '1.2 km',
    inStock: true,
  },
  // 3. Fertilizers
  {
    id: 'prod_fert1',
    name: 'Neem-Coated Bio Organic Compost',
    category: 'Fertilizers',
    price: 240, // per 25kg
    originalPrice: 380,
    rating: 4.9,
    image: 'flower-outline',
    description: 'Rich organic matter compost containing neem oil fractions to prevent underground pests.',
    vendor: 'Gramin Bio Store',
    distance: '2.8 km',
    inStock: true,
  },
  // 4. Farming Tools
  {
    id: 'prod_tool1',
    name: 'Ergonomic Sapling Planting Auger',
    category: 'Farming tools',
    price: 650,
    originalPrice: 900,
    rating: 4.6,
    image: 'hammer',
    description: 'Special hand-drill auger to easily prepare perfect 6-inch deep pits for saplings.',
    vendor: 'Jai Kisaan Seed Store',
    distance: '1.2 km',
    inStock: true,
  },
  // 5. Irrigation
  {
    id: 'prod_irri1',
    name: 'Gravity Drip Irrigation Set (1 Acre)',
    category: 'Irrigation systems',
    price: 2450,
    originalPrice: 4200,
    rating: 4.8,
    image: 'water-pump',
    description: 'Complete gravity-assisted drip tubing bundle with filters and micro-drippers.',
    vendor: 'Hindustan Agri Farms',
    distance: '6.2 km',
    inStock: true,
  },
];

const activeDetailRequests: Record<string, AbortController> = {};
const activeQuantityRequests: Record<string, ReturnType<typeof setTimeout>> = {};

export const useMarketplaceStore = create<MarketplaceState>()(
  persist(
    (set, get) => ({
      categories: [],
      products: defaultProducts,
      currentPage: 1,
      hasMore: true,
      isLoadingMore: false,
      cart: [],
      cartSummary: null,
      checkoutAddress: null,
      checkoutSummaryResponse: null,
      orders: [],
      activeOrderDetails: {},
      wishlist: [],
      wishlistProducts: [],
      cropRecommendationsCache: {},
      soilRecommendationsCache: {},
      isLoading: false,
      cartActionLoadingId: null,
      productDetailsCache: {},
      acceleratedCheckoutItem: null,

      fetchCategories: async () => {
        if (get().categories.length > 0) return; // Cache hit
        try {
          const { data } = await api.get('/categories');
          set({ categories: data });
        } catch (err) {
          console.warn('[marketplaceStore] fetchCategories failed:', err);
        }
      },

      fetchProducts: async (params = {}) => {
        const { page = 1, limit = 20, search, category_slug, reset = false } = params;
        
        if (reset) {
          set({ isLoading: true });
        } else {
          set({ isLoadingMore: true });
        }

        try {
          const query = new URLSearchParams({
            skip: ((page - 1) * limit).toString(),
            limit: limit.toString(),
          });
          
          if (search) query.append('search', search);
          if (category_slug && category_slug !== 'All') query.append('category_slug', category_slug);

          const { data } = await api.get(`/products?${query.toString()}`);
          
          const mappedProducts: Product[] = data.items.map((p: any) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            category: p.category?.name || 'Uncategorized',
            price: p.price,
            originalPrice: p.original_price,
            rating: p.rating || 4.5,
            reviewCount: p.review_count || 0,
            image: p.primary_image || 'leaf',
            description: p.description || '',
            vendor: 'Verified Dealer',
            distance: 'Est. 2 hrs',
            inStock: true,
          }));

          set((state) => ({
            products: reset ? mappedProducts : [...state.products, ...mappedProducts],
            currentPage: data.page,
            hasMore: data.has_next,
            isLoading: false,
            isLoadingMore: false,
          }));
        } catch (err) {
          console.warn('[marketplaceStore] fetchProducts failed:', err);
          set({ isLoading: false, isLoadingMore: false });
        }
      },

      fetchProductDetails: async (id: string) => {
        if (get().productDetailsCache[id]) return;

        if (activeDetailRequests[id]) {
          activeDetailRequests[id].abort();
        }
        const controller = new AbortController();
        activeDetailRequests[id] = controller;

        try {
          const { data } = await api.get(`/products/${id}`, { signal: controller.signal });
          
          const detail: ProductDetail = {
            id: data.id,
            name: data.name,
            slug: data.slug,
            category: data.category?.name || 'Uncategorized',
            price: data.price,
            originalPrice: data.original_price,
            rating: data.rating || 4.5,
            reviewCount: data.review_count || 0,
            image: data.primary_image || 'leaf',
            images: data.images || [],
            description: data.description || '',
            vendor: data.brand || 'Verified Dealer',
            distance: 'Est. 2 hrs',
            inStock: data.stock_quantity > 0,
            sku: data.sku,
            stock_quantity: data.stock_quantity,
            unit: data.unit || 'unit',
            brand: data.brand,
            crop_tags: data.crop_tags || [],
            soil_tags: data.soil_tags || [],
            season_tags: data.season_tags || [],
            delivery_time: data.delivery_time,
            is_featured: data.is_featured || false,
            total_sold: data.total_sold || 0,
          };

          set((state) => ({
            productDetailsCache: { ...state.productDetailsCache, [id]: detail }
          }));
        } catch (err: any) {
          if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
            return;
          }
          console.warn(`[marketplaceStore] fetchProductDetails failed for ${id}:`, err);
        } finally {
          if (activeDetailRequests[id] === controller) {
            delete activeDetailRequests[id];
          }
        }
      },

      setAcceleratedCheckoutItem: (item) => set({ acceleratedCheckoutItem: item }),
      
      fetchWishlist: async () => {
        const { isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated) return;
        
        try {
          const { data } = await api.get('/wishlist');
          if (data && Array.isArray(data.items)) {
            const serverWishlistIds = data.items.map((item: any) => item.product.id);
            const serverWishlistProducts = data.items.map((item: any) => {
              const p = item.product;
              return {
                id: p.id,
                name: p.name,
                slug: p.slug,
                category: p.category?.name || 'Uncategorized',
                price: p.price,
                originalPrice: p.original_price,
                rating: p.rating || 4.5,
                reviewCount: p.review_count || 0,
                image: p.primary_image || 'leaf',
                description: p.description || '',
                vendor: p.brand || 'Verified Dealer',
                distance: 'Est. 2 hrs',
                inStock: true,
              };
            });
            set({ wishlist: serverWishlistIds, wishlistProducts: serverWishlistProducts });
          }
        } catch (err) {
          console.warn('[marketplaceStore] fetchWishlist failed:', err);
        }
      },

      toggleWishlist: async (productId) => {
        const currentWishlist = get().wishlist;
        const currentWishlistProducts = get().wishlistProducts;
        const isCurrentlyWishlisted = currentWishlist.includes(productId);
        
        // Optimistic UI update
        if (isCurrentlyWishlisted) {
          set({ 
            wishlist: currentWishlist.filter(id => id !== productId),
            wishlistProducts: currentWishlistProducts.filter(p => p.id !== productId) 
          });
        } else {
          // Find from local products cache
          const prodObj = get().products.find(p => p.id === productId) 
                       || (get().productDetailsCache[productId] as Product);
          set({ 
            wishlist: [...currentWishlist, productId],
            wishlistProducts: prodObj ? [...currentWishlistProducts, prodObj] : currentWishlistProducts
          });
        }

        // Sync with backend if authenticated
        const { isAuthenticated } = useAuthStore.getState();
        if (isAuthenticated) {
          try {
            const { data } = await api.post('/wishlist/toggle', { product_id: productId });
            // If there's a desync, we fetch the wishlist again to ensure data integrity
            if (data.wishlisted !== !isCurrentlyWishlisted) {
              get().fetchWishlist();
            }
          } catch (err) {
            console.warn('[marketplaceStore] toggleWishlist failed:', err);
            // Revert optimistic update on error
            set({ 
              wishlist: currentWishlist,
              wishlistProducts: currentWishlistProducts
            });
          }
        }
      },

      // ============================================
      // CART INTEGRATION
      // ============================================

      fetchCart: async () => {
        const { isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated) return;
        
        try {
          const { data } = await api.get('/cart');
          if (data && Array.isArray(data.items)) {
            const mappedCart: CartItem[] = data.items.map((item: any) => ({
              id: item.id,
              product: {
                id: item.product.id,
                name: item.product.name,
                slug: item.product.slug,
                category: item.product.category?.name || 'Uncategorized',
                price: item.product.price,
                originalPrice: item.product.original_price,
                rating: item.product.rating || 4.5,
                reviewCount: item.product.review_count || 0,
                image: item.product.primary_image || 'leaf',
                description: item.product.description || '',
                vendor: item.product.brand || 'Verified Dealer',
                distance: 'Est. 2 hrs',
                inStock: true,
              },
              quantity: item.quantity,
              subtotal: item.subtotal,
            }));
            
            set({ 
              cart: mappedCart,
              cartSummary: {
                total_items: data.total_items,
                subtotal: data.subtotal,
                discount: data.discount,
                grand_total: data.grand_total,
              }
            });
          }
        } catch (err) {
          console.warn('[marketplaceStore] fetchCart failed:', err);
        }
      },

      addToCart: async (product, quantity = 1) => {
        set({ cartActionLoadingId: product.id });
        
        const currentCart = get().cart;
        const existingItem = currentCart.find((item) => item.product.id === product.id);

        const { isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated) {
          if (existingItem) {
            set({ cart: currentCart.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item) });
          } else {
            set({ cart: [...currentCart, { product, quantity }] });
          }
          set({ cartActionLoadingId: null });
          return;
        }

        try {
          await api.post('/cart', { product_id: product.id, quantity });
          await get().fetchCart();
        } catch (err: any) {
          console.warn('[marketplaceStore] addToCart failed:', err);
          if (err.response?.data?.detail) {
             alert(err.response.data.detail);
          } else {
             alert('Failed to add to cart.');
          }
        } finally {
          set({ cartActionLoadingId: null });
        }
      },

      removeFromCart: async (productId) => {
        set({ cartActionLoadingId: productId });
        const currentCart = get().cart;
        const { isAuthenticated } = useAuthStore.getState();

        if (!isAuthenticated) {
          set({ cart: currentCart.filter((item) => item.product.id !== productId) });
          set({ cartActionLoadingId: null });
          return;
        }

        try {
          await api.delete(`/cart/${productId}`);
          await get().fetchCart();
        } catch (err: any) {
          console.warn('[marketplaceStore] removeFromCart failed:', err);
        } finally {
          set({ cartActionLoadingId: null });
        }
      },

      updateQuantity: async (productId, quantity) => {
        const currentCart = get().cart;
        const existingItem = currentCart.find(i => i.product.id === productId);
        if (!existingItem || existingItem.quantity === quantity) return;

        if (quantity <= 0) {
          await get().removeFromCart(productId);
          return;
        }

        const { isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated) {
          set({ cart: currentCart.map((item) => item.product.id === productId ? { ...item, quantity } : item) });
          return;
        }

        // Optimistic UI for smooth debounce behavior
        set({ cart: currentCart.map((item) => item.product.id === productId ? { ...item, quantity } : item) });

        // Cancel previous request if any
        if (activeQuantityRequests[productId]) {
          clearTimeout(activeQuantityRequests[productId]);
        }

        activeQuantityRequests[productId] = setTimeout(async () => {
          try {
            await api.patch(`/cart/${productId}`, { quantity });
            await get().fetchCart();
          } catch (err: any) {
            console.warn('[marketplaceStore] updateQuantity failed:', err);
            // Revert on failure
            get().fetchCart();
            if (err.response?.data?.detail) {
               alert(err.response.data.detail);
            }
          }
          delete activeQuantityRequests[productId];
        }, 500); // 500ms debounce
      },

      clearCart: async () => {
        set({ cart: [], cartSummary: null });
        const { isAuthenticated, accessToken } = useAuthStore.getState();
        if (isAuthenticated && accessToken) {
          try {
            await api.post('/cart/clear');
          } catch (err) {
            console.warn('[marketplaceStore] clearCart backend sync notice:', err);
          }
        }
      },

      fetchCropRecommendations: async (crop) => {
        if (!crop) return;
        
        // Use cached results if available
        if (get().cropRecommendationsCache[crop]) {
          return;
        }

        try {
          const { data } = await api.get('/recommendations/crop', { params: { crop } });
          set((state) => ({
            cropRecommendationsCache: {
              ...state.cropRecommendationsCache,
              [crop]: data,
            },
          }));
        } catch (err) {
          console.warn('[marketplaceStore] fetchCropRecommendations failed:', err);
        }
      },

      fetchSoilRecommendations: async (soil) => {
        if (!soil) return;
        
        // Use cached results if available
        if (get().soilRecommendationsCache[soil]) {
          return;
        }

        try {
          const { data } = await api.get('/recommendations/soil', { params: { soil } });
          set((state) => ({
            soilRecommendationsCache: {
              ...state.soilRecommendationsCache,
              [soil]: data,
            },
          }));
        } catch (err) {
          console.warn('[marketplaceStore] fetchSoilRecommendations failed:', err);
        }
      },

      fetchOrders: async () => {
        const { isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated) return;
        
        try {
          const { data } = await api.get('/orders', { params: { limit: 10 } });
          set({ orders: data.items || [] });
        } catch (err) {
          console.warn('[marketplaceStore] fetchOrders failed:', err);
        }
      },

      fetchOrderDetails: async (orderId, force = false) => {
        const { isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated) return;
        
        // Cache check
        if (!force && get().activeOrderDetails[orderId]) return;

        try {
          const { data } = await api.get(`/orders/${orderId}`);
          set((state) => ({
            activeOrderDetails: {
              ...state.activeOrderDetails,
              [orderId]: data,
            },
          }));
        } catch (err) {
          console.warn('[marketplaceStore] fetchOrderDetails failed:', err);
        }
      },

      cancelOrder: async (orderId) => {
        try {
          const { data } = await api.patch(`/orders/${orderId}/cancel`);
          set((state) => ({
            activeOrderDetails: {
              ...state.activeOrderDetails,
              [orderId]: data,
            },
          }));
          get().fetchOrders();
        } catch (err: any) {
          console.warn('[marketplaceStore] cancelOrder failed:', err);
          throw err;
        }
      },

      setCheckoutAddress: (address) => {
        set({ checkoutAddress: address });
      },

      prepareCheckout: async (address) => {
        const { isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated) return true; // Local mock flow
        
        try {
          const { data } = await api.post('/checkout', { delivery_address: address });
          set({ checkoutSummaryResponse: data });
          if (!data.stock_valid) {
            alert('Some items in your cart are out of stock.');
            return false;
          }
          return true;
        } catch (err: any) {
          console.warn('[marketplaceStore] prepareCheckout failed:', err);
          if (err.response?.data?.detail) {
             alert(err.response.data.detail);
          } else {
             alert('Failed to prepare checkout.');
          }
          return false;
        }
      },

      checkout: async (vendorName, paymentMethod = 'wallet') => {
        const { isAuthenticated } = useAuthStore.getState();
        const address = get().checkoutAddress;
        
        // Accelerated checkout or unauthenticated fallback
        if (get().acceleratedCheckoutItem || !isAuthenticated) {
           set({ isLoading: true });
           await new Promise((resolve) => setTimeout(resolve, 1500));
           const orderId = `ODR-${Math.floor(Math.random() * 90000) + 10000}`;
           
           const itemsToCheckout = get().acceleratedCheckoutItem ? [get().acceleratedCheckoutItem as CartItem] : get().cart;
           const total = itemsToCheckout.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

           const newOrder: Order = {
             id: orderId,
             date: new Date().toISOString().split('T')[0],
             items: itemsToCheckout,
             total,
             status: 'Order Placed',
             vendorName,
             otp: `${Math.floor(Math.random() * 9000) + 1000}`,
           };

           set({
             isLoading: false,
             checkoutSummaryResponse: null,
           });

           return orderId;
        }

        // Authenticated Backend Checkout
        if (!address) {
          alert('Delivery address is missing.');
          throw new Error('Address missing');
        }

        set({ isLoading: true });
        try {
          const { data } = await api.post('/orders', { 
            delivery_address: address,
            payment_method: paymentMethod
          });
          
          // Clear cart immediately upon successful order creation
          set({ 
             cart: [], 
             cartSummary: null,
             checkoutSummaryResponse: null,
          });
          
          // Refresh orders after successful checkout
          get().fetchOrders();
          
          return data.order_id;
        } catch (err: any) {
          console.warn('[marketplaceStore] checkout failed:', err);
          if (err.response?.data?.detail) {
             alert(err.response.data.detail);
          } else {
             alert('Failed to place order.');
          }
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'bhumicred_marketplace_store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => {
        const { productDetailsCache, cropRecommendationsCache, soilRecommendationsCache, wishlistProducts, cart, cartSummary, checkoutSummaryResponse, orders, activeOrderDetails, ...rest } = state;
        return rest;
      },
    }
  )
);
