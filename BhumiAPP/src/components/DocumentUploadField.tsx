import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../api/apiClient';
import { COLORS, TYPOGRAPHY } from '../theme/theme';

interface DocumentUploadFieldProps {    
  label: string;
  required?: boolean;
  value: string | null;
  onUploaded: (url: string) => void;
  uploadUrl: string;
  extraFields?: Record<string, string>;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}

export default function DocumentUploadField({
  label,
  required,
  value,
  onUploaded,
  uploadUrl,
  extraFields,
  icon = 'camera-outline',
}: DocumentUploadFieldProps) {
  const [uploading, setUploading] = useState(false);

  const doUpload = async (uri: string) => {
    setUploading(true);
    try {
      const filename = uri.split('/').pop() || 'upload.jpg';
      const formData = new FormData();
      formData.append('file', { uri, name: filename, type: 'image/jpeg' } as any);
      if (extraFields) {
        Object.entries(extraFields).forEach(([key, val]) => formData.append(key, val));
      }
      const res = await api.post(uploadUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url: string | undefined = res.data?.url ?? res.data?.data?.url;
      if (url) {
        onUploaded(url);
      } else {
        Alert.alert('Upload Error', 'Upload succeeded but no file URL was returned.');
      }
    } catch (error: any) {
      const msg: string = error?.response?.data?.message || 'Upload failed. Please try again.';
      Alert.alert('Upload Error', msg);
    } finally {
      setUploading(false);
    }
  };

  const pick = async (mode: 'camera' | 'gallery') => {
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
        result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.8 });
      }
      if (!result.canceled && result.assets && result.assets.length > 0) {
        doUpload(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const handlePress = () => {
    if (uploading) return;
    Alert.alert(label, 'Choose how you want to upload', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Take Photo', onPress: () => pick('camera') },
      { text: 'Upload From Device', onPress: () => pick('gallery') },
    ]);
  };

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}{required ? ' *' : ''}</Text>
      <TouchableOpacity style={styles.uploadBox} onPress={handlePress} activeOpacity={0.8} disabled={uploading}>
        {value ? (
          <Image source={{ uri: value }} style={styles.thumbnail} />
        ) : (
          <View style={styles.placeholderIcon}>
            <MaterialCommunityIcons name={icon} size={24} color={COLORS.primary} />
          </View>
        )}
        <View style={styles.uploadTextWrap}>
          {uploading ? (
            <View style={styles.row}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.uploadingText}>Uploading…</Text>
            </View>
          ) : (
            <Text style={styles.uploadText}>{value ? 'Tap to replace' : 'Take Photo / Upload From Device'}</Text>
          )}
        </View>
        {value && !uploading && <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.success} />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 16 },
  label: { ...TYPOGRAPHY.caption, color: '#334155', marginBottom: 7, marginLeft: 4, fontWeight: '700' },
  uploadBox: { flexDirection: 'row', alignItems: 'center', minHeight: 64, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  thumbnail: { width: 44, height: 44, borderRadius: 8, marginRight: 12 },
  placeholderIcon: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  uploadTextWrap: { flex: 1 },
  uploadText: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, fontSize: 13 },
  uploadingText: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, fontSize: 13, marginLeft: 8 },
  row: { flexDirection: 'row', alignItems: 'center' },
});
