import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../src/theme/theme';
import AppSafeArea from '../../src/components/AppSafeArea';

export default function TabsLayout() {
  return (
    <AppSafeArea edges={['bottom']}>
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        elevation: 8,
        shadowColor: '#064E3B',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        height: 75,
        paddingBottom: 14,
        paddingTop: 8,
      },
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.textSecondary,
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '700',
      },
    }}>
      <Tabs.Screen 
        name="index" 
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons 
              name={focused ? "home-variant" : "home-variant-outline"} 
              size={size + 2} 
              color={color} 
            />
          ),
        }} 
      />
      <Tabs.Screen 
        name="projects" 
        options={{
          title: 'Projects',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons 
              name={focused ? "chart-areaspline-variant" : "chart-areaspline"} 
              size={size + 2} 
              color={color} 
            />
          ),
        }} 
      />
      <Tabs.Screen 
        name="marketplace" 
        options={{
          title: 'Marketplace',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons 
              name={focused ? "storefront" : "storefront-outline"} 
              size={size + 2} 
              color={color} 
            />
          ),
        }} 
      />
      <Tabs.Screen 
        name="wallet" 
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons 
              name={focused ? "wallet" : "wallet-outline"} 
              size={size + 2} 
              color={color} 
            />
          ),
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons 
              name={focused ? "account" : "account-outline"} 
              size={size + 2} 
              color={color} 
            />
          ),
        }} 
      />
      
      {/* Hide inactive navigation targets from old screens */}
      <Tabs.Screen name="bookings" options={{ href: null }} />
      <Tabs.Screen name="book-action" options={{ href: null }} />
      <Tabs.Screen name="reports" options={{ href: null }} />
      <Tabs.Screen name="track" options={{ href: null }} />
    </Tabs>
    </AppSafeArea>
  );
}
