import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "../../src/api/apiClient";
import { COLORS, SHADOWS } from "../../src/theme/theme";
import {
  formatMoney,
  mockProducts,
  normalizeProducts,
  VendorProduct,
} from "../../src/vendor/vendorData";

const tone = (status: string) =>
  status.toLowerCase().includes("active")
    ? ["#DCFCE7", "#15803D"]
    : status.toLowerCase().includes("pending")
      ? ["#FEF3C7", "#B45309"]
      : ["#FEE2E2", "#B91C1C"];

export default function VendorProducts() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [products, setProducts] = useState<VendorProduct[]>(mockProducts);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const res = await api.get("/vendor/products");
      setProducts(normalizeProducts(res.data));
      setError("");
    } catch {
      setProducts(mockProducts);
      setError(
        "Live products could not be loaded. Showing demo inventory. Pull down to retry.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const removeProduct = (item: VendorProduct) =>
    Alert.alert(
      "Delete product?",
      `${item.name} will be removed from your catalogue.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/vendor/products/${item.id}`);
              setProducts((current) =>
                current.filter((product) => product.id !== item.id),
              );
            } catch {
              setProducts((current) =>
                current.filter((product) => product.id !== item.id),
              );
              Alert.alert(
                "Saved locally",
                "The product will be removed from the server once you reconnect.",
              );
            }
          },
        },
      ],
    );
  const summary = [
    { label: "Total", value: products.length, icon: "package-variant" },
    {
      label: "Active",
      value: products.filter((p) => p.status === "Active").length,
      icon: "check-circle-outline",
    },
    {
      label: "Pending",
      value: products.filter((p) => p.status === "Pending").length,
      icon: "clock-outline",
    },
    {
      label: "Out of stock",
      value: products.filter(
        (p) => p.stock === 0 || p.status === "Out of Stock",
      ).length,
      icon: "alert-outline",
    },
  ];
  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductCard item={item} onDelete={() => removeProduct(item)} />
        )}
        contentContainerStyle={[styles.list, { paddingTop: insets.top + 16 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={COLORS.primary}
          />
        }
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>My Products</Text>
                <Text style={styles.subtitle}>
                  Manage your marketplace catalogue
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push("/(vendor_tabs)/add-product")}
              >
                <MaterialCommunityIcons name="plus" size={19} color="#063B2E" />
                <Text style={styles.addText}>Add Product</Text>
              </TouchableOpacity>
            </View>
            {error ? (
              <View style={styles.error}>
                <MaterialCommunityIcons
                  name="cloud-alert-outline"
                  size={18}
                  color="#B45309"
                />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={load}>
                  <Text style={styles.retry}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            <View style={styles.summary}>
              {summary.map((item) => (
                <View key={item.label} style={styles.summaryCard}>
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={19}
                    color={COLORS.primaryLight}
                  />
                  <Text style={styles.summaryValue}>{item.value}</Text>
                  <Text style={styles.summaryLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.listTitle}>All products</Text>
            {loading ? (
              <View style={styles.loading}>
                <ActivityIndicator color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading catalogue…</Text>
              </View>
            ) : null}
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons
              name="package-variant-closed"
              size={48}
              color="#94A3B8"
            />
            <Text style={styles.emptyTitle}>No products yet</Text>
            <Text style={styles.emptyText}>
              Your product catalogue will appear here.
            </Text>
          </View>
        }
      />
    </View>
  );
}
function ProductCard({
  item,
  onDelete,
}: {
  item: VendorProduct;
  onDelete: () => void;
}) {
  const [bg, fg] = tone(item.status);
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Image source={{ uri: item.image }} style={styles.image} />
        <View style={styles.productMain}>
          <View style={styles.nameRow}>
            <Text style={styles.productName} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={[styles.badge, { backgroundColor: bg }]}>
              <Text style={[styles.badgeText, { color: fg }]}>
                {item.status}
              </Text>
            </View>
          </View>
          <Text style={styles.category}>{item.category}</Text>
          <Text style={styles.price}>
            {formatMoney(item.price)}
            <Text style={styles.unit}>/{item.unit}</Text>
          </Text>
        </View>
      </View>
      <View style={styles.metrics}>
        <Metric icon="cube-outline" text={`${item.stock} ${item.unit} stock`} />
        <Metric icon="star" text={`${item.rating.toFixed(1)} rating`} />
        <Metric icon="cart-outline" text={`${item.sold} sold`} />
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.edit}>
          <MaterialCommunityIcons
            name="pencil-outline"
            size={17}
            color={COLORS.primary}
          />
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.delete} onPress={onDelete}>
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={17}
            color="#DC2626"
          />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
function Metric({ icon, text }: any) {
  return (
    <View style={styles.metric}>
      <MaterialCommunityIcons name={icon} size={15} color="#64748B" />
      <Text style={styles.metricText}>{text}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  list: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: { color: "#FFF", fontSize: 24, fontWeight: "900" },
  subtitle: { color: "#A7F3D0", fontSize: 12, marginTop: 3, fontWeight: "600" },
  addButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    ...SHADOWS.limeGlow,
  },
  addText: { color: COLORS.primaryDark, fontWeight: "800", fontSize: 11 },
  error: {
    backgroundColor: "#FFF7E6",
    borderColor: "#FDE68A",
    borderWidth: 1,
    borderRadius: 14,
    padding: 11,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  errorText: { color: "#92400E", fontSize: 11, flex: 1, lineHeight: 15 },
  retry: { color: "#B45309", fontWeight: "800", fontSize: 12 },
  summary: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 8,
    marginBottom: 16,
  },
  summaryCard: {
    width: "48.5%",
    minHeight: 82,
    backgroundColor: "#F7F8FA",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    ...SHADOWS.soft,
  },
  summaryValue: {
    fontSize: 19,
    fontWeight: "900",
    color: COLORS.textDark,
    marginTop: 4,
  },
  summaryLabel: { color: COLORS.textSecondary, fontSize: 11, marginTop: 1 },
  listTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 10,
  },
  loading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F7F8FA",
    padding: 13,
    borderRadius: 14,
    marginBottom: 10,
  },
  loadingText: { color: COLORS.textSecondary },
  card: {
    backgroundColor: "#F7F8FA",
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    ...SHADOWS.soft,
  },
  cardTop: { flexDirection: "row", minWidth: 0 },
  image: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#EAF5E4",
  },
  productMain: { flex: 1, minWidth: 0, marginLeft: 10 },
  nameRow: { flexDirection: "row", gap: 4, alignItems: "flex-start" },
  productName: {
    flex: 1,
    color: COLORS.textDark,
    fontSize: 14,
    fontWeight: "800",
  },
  category: { color: COLORS.textSecondary, fontSize: 11, marginTop: 3 },
  price: {
    color: COLORS.primaryDark,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 5,
  },
  unit: { color: COLORS.textSecondary, fontSize: 11, fontWeight: "600" },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    flexShrink: 1,
  },
  badgeText: { fontSize: 8.5, fontWeight: "900" },
  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 10,
    marginTop: 12,
  },
  metric: { flexDirection: "row", gap: 4, alignItems: "center" },
  metricText: { color: COLORS.textSecondary, fontSize: 10.5 },
  cardActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  edit: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#F0FDF4",
    borderRadius: 10,
    paddingVertical: 9,
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
  },
  delete: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FFF5F5",
    borderRadius: 10,
    paddingVertical: 9,
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
  },
  editText: { color: COLORS.primary, fontSize: 12, fontWeight: "800" },
  deleteText: { color: "#DC2626", fontSize: 12, fontWeight: "800" },
  empty: {
    alignItems: "center",
    backgroundColor: "#F7F8FA",
    borderRadius: 18,
    padding: 28,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyTitle: {
    color: COLORS.textDark,
    fontSize: 17,
    fontWeight: "800",
    marginTop: 12,
  },
  emptyText: { color: COLORS.textSecondary, fontSize: 13, marginTop: 5 },
});
