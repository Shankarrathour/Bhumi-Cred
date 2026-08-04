import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../src/theme/theme';
import AppSafeArea from '../../src/components/AppSafeArea';

export default function VendorTabsLayout() {
  return (
    <AppSafeArea edges={['bottom']}>
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.textSecondary,
      tabBarStyle: {
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        elevation: 8,
        shadowColor: '#064E3B',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        height: 68,
        paddingBottom: 9,
        paddingTop: 7,
      },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="view-dashboard" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="package-variant" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="truck-delivery" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="store-cog" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add-product"
        options={{
          title: 'Add Product',
          href: null, // hides from tab bar
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          href: null, // hides from tab bar
        }}
      />
      <Tabs.Screen
        name="bank-details"
        options={{
          title: 'Bank Details',
          href: null, // hides from tab bar
        }}
      />
      <Tabs.Screen
        name="security"
        options={{
          title: 'Security',
          href: null, // hides from tab bar
        }}
      />
      <Tabs.Screen
        name="help-support"
        options={{
          title: 'Help & Support',
          href: null, // hides from tab bar
        }}
      />
    </Tabs>
    </AppSafeArea>
  );
}
