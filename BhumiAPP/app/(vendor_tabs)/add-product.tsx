import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Modal, FlatList, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import api from '../../src/api/apiClient';
import { COLORS, SHADOWS } from '../../src/theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AmbientEcoBackground } from '../../src/components/AmbientEcoBackground';

const CATEGORIES = ['Saplings', 'Seeds', 'Fertilizers', 'Farming tools', 'Irrigation systems'];

export default function AddProductScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    original_price: '',
    stock: '',
    sku: '',
    unit: 'piece',
    category: '',
    category_id: ''
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const pickImage = async (mode: 'camera' | 'gallery') => {
    try {
      let result;
      if (mode === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Camera permission is required.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Gallery permission is required.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: true, quality: 0.8 });
      }
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImages((current) => [...current, ...result.assets.map((a) => a.uri)]);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const removeImage = (uri: string) => {
    setImages((current) => current.filter((img) => img !== uri));
  };

  // Uploads every locally-picked image to the newly created product, one at a
  // time — reuses the same POST-per-file convention as vendor profile/KYC
  // uploads (DocumentUploadField), just called in a loop for multiple images.
  const uploadImagesToProduct = async (productId: string) => {
    setUploadingImages(true);
    let failures = 0;
    for (const uri of images) {
      try {
        const filename = uri.split('/').pop() || 'product.jpg';
        const formData = new FormData();
        formData.append('file', { uri, name: filename, type: 'image/jpeg' } as any);
        await api.post(`/vendor/products/${productId}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } catch {
        failures += 1;
      }
    }
    setUploadingImages(false);
    return failures;
  };

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/categories');
        if (data && data.success && data.data) {
          setCategories(data.data);
        } else if (Array.isArray(data)) {
            setCategories(data);
        }
      } catch (err) {
        console.warn('Failed to fetch categories', err);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.stock || !form.category_id || !form.sku || !form.original_price || !form.unit) {
      Alert.alert('Missing Fields', 'All fields are required.');
      return;
    }

    setLoading(true);
    try {
      const { data: product } = await api.post('/vendor/products', {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        original_price: parseFloat(form.original_price),
        stock_quantity: parseInt(form.stock, 10),
        category_id: form.category_id,
        sku: form.sku,
        unit: form.unit
      });

      if (images.length > 0 && product?.id) {
        const failures = await uploadImagesToProduct(product.id);
        if (failures > 0) {
          Alert.alert('Product Added', `Product added, but ${failures} of ${images.length} image(s) failed to upload. You can try again from your product list.`);
          router.replace('/(vendor_tabs)/products');
          return;
        }
      }

      Alert.alert('Success', 'Product added successfully!');
      router.replace('/(vendor_tabs)/products');
    } catch (error: any) {
      const msg = error.response?.data?.message || error.response?.data?.detail || 'Failed to add product.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AmbientEcoBackground style={styles.container}><ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerRow}><View><Text style={styles.eyebrow}>MARKETPLACE CATALOGUE</Text><Text style={styles.header}>Add New Product</Text><Text style={styles.subheader}>Create a listing for your BhumiCred store</Text></View><View style={styles.headerIcon}><MaterialCommunityIcons name="package-variant-plus" size={24} color={COLORS.primaryDark} /></View></View>
      
      <View style={styles.card}>
        <Text style={styles.label}>Product Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Organic Tomatoes"
          placeholderTextColor="#94A3B8"
          value={form.name}
          onChangeText={t => setForm({ ...form, name: t })}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          placeholder="Detailed description..."
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={3}
          value={form.description}
          onChangeText={t => setForm({ ...form, description: t })}
        />

        <Text style={styles.label}>Price (₹)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 50"
          placeholderTextColor="#94A3B8"
          keyboardType="numeric"
          value={form.price}
          onChangeText={t => setForm({ ...form, price: t })}
        />

        <Text style={styles.label}>Original Price (₹)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 60"
          placeholderTextColor="#94A3B8"
          keyboardType="numeric"
          value={form.original_price}
          onChangeText={t => setForm({ ...form, original_price: t })}
        />

        <Text style={styles.label}>Stock Quantity</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 100"
          placeholderTextColor="#94A3B8"
          keyboardType="numeric"
          value={form.stock}
          onChangeText={t => setForm({ ...form, stock: t })}
        />

        <Text style={styles.label}>SKU</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. ORG-TOM-01"
          placeholderTextColor="#94A3B8"
          value={form.sku}
          onChangeText={t => setForm({ ...form, sku: t })}
        />

        <Text style={styles.label}>Unit</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. kg, piece, packet"
          placeholderTextColor="#94A3B8"
          value={form.unit}
          onChangeText={t => setForm({ ...form, unit: t })}
        />

        <Text style={styles.label}>Add Images</Text>
        <View style={styles.imageButtonRow}>
          <TouchableOpacity style={styles.imageActionBtn} onPress={() => pickImage('camera')} activeOpacity={0.8}>
            <Text style={styles.imageActionBtnText}>📷 Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.imageActionBtn} onPress={() => pickImage('gallery')} activeOpacity={0.8}>
            <Text style={styles.imageActionBtnText}>🖼 Upload from Device</Text>
          </TouchableOpacity>
        </View>

        {images.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewRow} contentContainerStyle={{ paddingRight: 8 }}>
            {images.map((uri) => (
              <View key={uri} style={styles.imagePreviewItem}>
                <Image source={{ uri }} style={styles.imagePreviewThumb} />
                <TouchableOpacity style={styles.imageRemoveBtn} onPress={() => removeImage(uri)} activeOpacity={0.8}>
                  <MaterialCommunityIcons name="close" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        <Text style={styles.label}>Category</Text>
        <TouchableOpacity 
          style={[styles.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
          onPress={() => setShowDropdown(true)}
        >
          <Text style={{ color: form.category ? '#0f172a' : '#94a3b8', fontSize: 16 }}>
            {form.category || 'Select a category'}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={20} color="#94a3b8" />
        </TouchableOpacity>

        {/* Dropdown Modal */}
        <Modal visible={showDropdown} transparent animationType="fade">
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDropdown(false)}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <FlatList 
                data={categories.length > 0 ? categories : CATEGORIES.map((c, i) => ({ id: `temp-${i}`, name: c }))}
                keyExtractor={(item: any) => item.id || item.name}
                renderItem={({item}: any) => (
                  <TouchableOpacity 
                    style={styles.categoryItem}
                    onPress={() => {
                      setForm({...form, category: item.name, category_id: item.id});
                      setShowDropdown(false);
                    }}
                  >
                    <Text style={[styles.categoryText, form.category === item.name && { color: COLORS.accent, fontWeight: 'bold' }]}>
                      {item.name}
                    </Text>
                    {form.category === item.name && <MaterialCommunityIcons name="check" size={20} color={COLORS.accent} />}
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Add Product</Text>
          )}
        </TouchableOpacity>
        {uploadingImages && <Text style={styles.uploadingImagesText}>Uploading images…</Text>}
      </View>
    </ScrollView></AmbientEcoBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  eyebrow: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  header: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    marginTop: 5,
  },
  subheader: {
    color: '#A7F3D0',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  headerIcon: {
    height: 46,
    width: 46,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.limeGlow,
  },
  card: {
    backgroundColor: '#F7F8FA',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.textDark,
    backgroundColor: '#F8FAFC',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    ...SHADOWS.glow,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  uploadingImagesText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  imageButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  imageActionBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  imageActionBtnText: {
    color: COLORS.textDark,
    fontSize: 13,
    fontWeight: '700',
  },
  imagePreviewRow: {
    marginTop: 12,
  },
  imagePreviewItem: {
    marginRight: 10,
    position: 'relative',
  },
  imagePreviewThumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#EAF5E4',
  },
  imageRemoveBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F7F8FA',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#F7F8FA',
    borderRadius: 16,
    padding: 16,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primaryDark,
    marginBottom: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  categoryText: {
    fontSize: 16,
    color: '#334155',
  }
});
