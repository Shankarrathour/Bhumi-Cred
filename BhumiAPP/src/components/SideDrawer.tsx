import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Animated, Dimensions, Image, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '../theme/theme';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;

export interface SideDrawerItem {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  onPress: () => void;
}

interface SideDrawerProps {
  visible: boolean;
  onClose: () => void;
  userName: string;
  userSubtitle: string;
  userPhotoUri?: string | null;
  items: SideDrawerItem[];
  onLogout: () => void;
  appVersion?: string;
}

export default function SideDrawer({
  visible,
  onClose,
  userName,
  userSubtitle,
  userPhotoUri,
  items,
  onLogout,
  appVersion = 'BhumiCred v1.2.0',
}: SideDrawerProps) {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const runClose = (after?: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -DRAWER_WIDTH, duration: 250, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setModalVisible(false);
      onClose();
      after?.();
    });
  };

  return (
    <Modal transparent visible={modalVisible} animationType="none" onRequestClose={() => runClose()}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={() => runClose()}>
          <Animated.View style={[styles.backdropFill, { opacity: opacityAnim }]} />
        </Pressable>

        <Animated.View style={[styles.content, { transform: [{ translateX: slideAnim }] }]}>
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.header}>
            <View style={styles.userBox}>
              <View style={styles.avatar}>
                {userPhotoUri ? (
                  <Image source={{ uri: userPhotoUri }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{(userName?.[0] ?? '?').toUpperCase()}</Text>
                )}
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>{userName}</Text>
                <Text style={styles.userSub}>{userSubtitle}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => runClose()}>
              <MaterialCommunityIcons name="close" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.itemsContainer} showsVerticalScrollIndicator={false}>
            {items.map((item, index) => (
              <TouchableOpacity key={index} style={styles.item} onPress={() => runClose(item.onPress)}>
                <View style={styles.itemIconBox}>
                  <MaterialCommunityIcons name={item.icon} size={22} color={COLORS.primary} />
                </View>
                <Text style={styles.itemLabel}>{item.label}</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color="#CBD5E1" />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: 20 + insets.bottom }]}>
            <TouchableOpacity style={styles.logoutBtn} onPress={() => runClose(onLogout)}>
              <MaterialCommunityIcons name="logout" size={20} color={COLORS.danger} />
              <Text style={styles.logoutBtnText}>Logout</Text>
            </TouchableOpacity>
            <Text style={styles.appVersion}>{appVersion}</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  backdropFill: { flex: 1, backgroundColor: 'rgba(2,44,34,0.4)' },
  content: { width: DRAWER_WIDTH, height: '100%', backgroundColor: '#FFFFFF', ...SHADOWS.glow },
  header: { paddingTop: Platform.OS === 'ios' ? 60 : 45, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  userBox: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginRight: 12 },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  userInfo: { flex: 1 },
  userName: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  userSub: { color: '#D1FAE5', fontSize: 11, marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)' },
  itemsContainer: { flex: 1, padding: 16 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, marginBottom: 10 },
  itemIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  itemLabel: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.textDark },
  footer: { borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingHorizontal: 16, paddingTop: 16 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 12, paddingVertical: 12 },
  logoutBtnText: { color: COLORS.danger, fontWeight: '800', fontSize: 14 },
  appVersion: { textAlign: 'center', color: '#94A3B8', fontSize: 11, marginTop: 10 },
});
