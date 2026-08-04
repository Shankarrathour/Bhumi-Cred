import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, FlatList, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { COLORS, TYPOGRAPHY, SHADOWS } from '../src/theme/theme';
import { mockTests, mockCategories, mockPackages } from '../src/mock/mockData';
import { PremiumTestCard } from '../src/components/PremiumTestCard';
import { PremiumPackageCard } from '../src/components/PremiumPackageCard';
import { PremiumBottomSheet } from '../src/components/PremiumBottomSheet';

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isFilterSheetOpen, setFilterSheetOpen] = useState(false);

  // Active state applied to dataset computation
  const [filterTestType, setFilterTestType] = useState<'all' | 'packages' | 'profiles'>('all');
  const [filterCollection, setFilterCollection] = useState<'all' | 'home' | 'lab'>('all');

  // Temporary values modified inside sheet, committed only on Apply
  const [tempFilterTestType, setTempFilterTestType] = useState<'all' | 'packages' | 'profiles'>('all');
  const [tempFilterCollection, setTempFilterCollection] = useState<'all' | 'home' | 'lab'>('all');

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style);
    }
  };

  // Combine tests and packages with identifying field
  const allItems = [
    ...mockTests.map(t => ({ ...t, searchItemType: 'test' })),
    ...mockPackages.map(p => ({ ...p, searchItemType: 'package' }))
  ];

  const filteredResults = allItems.filter(item => {
    // 1. Match search queries
    const nameMatches = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const descMatches = ('description' in item && typeof item.description === 'string') 
      ? item.description.toLowerCase().includes(searchQuery.toLowerCase()) 
      : false;
    const categoryMatches = item.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesQuery = nameMatches || descMatches || categoryMatches;

    // 2. Category Chip Restriction
    const catId = item.searchItemType === 'package' ? (item as any).categoryId : (item as any).category_id;
    const matchesCategory = selectedCategory === 'all' ? true : catId === selectedCategory;

    // 3. Bottom Sheet Test Type logic
    let matchesType = true;
    if (filterTestType === 'packages') {
      matchesType = item.searchItemType === 'package';
    } else if (filterTestType === 'profiles') {
      matchesType = item.searchItemType === 'test' && (
        item.name.toLowerCase().includes('audit') || 
        item.name.toLowerCase().includes('package') || 
        item.name.toLowerCase().includes('verification')
      );
    }

    // 4. Collection Method Filter logic
    let matchesCollection = true;
    if (filterCollection === 'home') {
      matchesCollection = item.homeCollection === true;
    } else if (filterCollection === 'lab') {
      matchesCollection = item.homeCollection === false;
    }

    return matchesQuery && matchesCategory && matchesType && matchesCollection;
  });

  const renderCategoryChips = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
      <TouchableOpacity 
        style={[styles.chip, selectedCategory === 'all' && styles.activeChip]}
        onPress={() => {
          triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
          setSelectedCategory('all');
        }}
        accessibilityRole="button"
      >
        <Text style={[styles.chipText, selectedCategory === 'all' && styles.activeChipText]}>All Items</Text>
      </TouchableOpacity>
      {mockCategories.map((cat) => (
        <TouchableOpacity 
          key={cat.id} 
          style={[styles.chip, selectedCategory === cat.id && styles.activeChip]}
          onPress={() => {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
            setSelectedCategory(cat.id);
          }}
          accessibilityRole="button"
        >
          <Text style={[styles.chipText, selectedCategory === cat.id && styles.activeChipText]}>
            {cat.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Sticky Top Header */}
      <View style={styles.topHeaderBg}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity 
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }} 
            style={styles.backButton}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textLight} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>BhumiCred Shop</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={22} color={COLORS.textLight} style={{ opacity: 0.7 }} />
            <TextInput
              style={styles.searchText}
              placeholder='Search Audits, Saplings, Tools...'
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialCommunityIcons name="close-circle" size={20} color={COLORS.textLight} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity 
            style={styles.filterBtn} 
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              setTempFilterTestType(filterTestType);
              setTempFilterCollection(filterCollection);
              setFilterSheetOpen(true);
            }}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="tune" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Chips */}
      <View style={styles.chipsContainer}>
        {renderCategoryChips()}
      </View>

      {/* Results List */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsCount}>{filteredResults.length} items available</Text>
        <FlatList
          data={filteredResults}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            if (item.searchItemType === 'package') {
              return (
                <PremiumPackageCard 
                  packageData={item as any} 
                  onPress={() => router.push(`/package/${item.id}`)} 
                />
              );
            }
            return (
              <PremiumTestCard 
                test={item as any} 
                onPress={() => router.push(`/test/${item.id}`)} 
              />
            );
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="sprout" size={64} color={COLORS.border} />
              <Text style={styles.emptyTitle}>No results found</Text>
              <Text style={styles.emptyText}>Try adjusting your search text or filter options.</Text>
            </View>
          }
        />
      </View>

      {/* Filter Bottom Sheet */}
      <PremiumBottomSheet visible={isFilterSheetOpen} onClose={() => setFilterSheetOpen(false)}>
        <Text style={styles.sheetTitle}>Filter Options</Text>
        
        <Text style={styles.filterSectionTitle}>Catalog Type</Text>
        <View style={styles.filterRow}>
          <TouchableOpacity 
            style={[styles.filterChip, tempFilterTestType === 'all' && styles.filterChipActive]}
            onPress={() => setTempFilterTestType('all')}
          >
            <Text style={tempFilterTestType === 'all' ? styles.filterChipTextActive : styles.filterChipText}>All Items</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, tempFilterTestType === 'packages' && styles.filterChipActive]}
            onPress={() => setTempFilterTestType('packages')}
          >
            <Text style={tempFilterTestType === 'packages' ? styles.filterChipTextActive : styles.filterChipText}>Bundles</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, tempFilterTestType === 'profiles' && styles.filterChipActive]}
            onPress={() => setTempFilterTestType('profiles')}
          >
            <Text style={tempFilterTestType === 'profiles' ? styles.filterChipTextActive : styles.filterChipText}>Audits</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.filterSectionTitle}>Inspection / Collection Mode</Text>
        <View style={styles.filterRow}>
          <TouchableOpacity 
            style={[styles.filterChip, tempFilterCollection === 'home' && styles.filterChipActive]}
            onPress={() => setTempFilterCollection('home')}
          >
            <MaterialCommunityIcons 
              name="drone" 
              size={16} 
              color={tempFilterCollection === 'home' ? COLORS.textLight : COLORS.textSecondary} 
            />
            <Text style={[tempFilterCollection === 'home' ? styles.filterChipTextActive : styles.filterChipText, { marginLeft: 6 }]}>
              Field Drone Audit
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, tempFilterCollection === 'lab' && styles.filterChipActive]}
            onPress={() => setTempFilterCollection('lab')}
          >
            <MaterialCommunityIcons 
              name="office-building" 
              size={16} 
              color={tempFilterCollection === 'lab' ? COLORS.textLight : COLORS.textSecondary} 
            />
            <Text style={[tempFilterCollection === 'lab' ? styles.filterChipTextActive : styles.filterChipText, { marginLeft: 6 }]}>
              Kiosk Delivery / Kiosk Visit
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.applyFilterBtn} 
          onPress={() => {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
            setFilterTestType(tempFilterTestType);
            setFilterCollection(tempFilterCollection);
            setFilterSheetOpen(false);
          }}
          accessibilityRole="button"
        >
          <Text style={styles.applyFilterText}>Apply Filters</Text>
        </TouchableOpacity>
      </PremiumBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4FDF9',
  },
  topHeaderBg: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'ios' ? 50 : 45,
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textLight,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginRight: 12,
  },
  searchText: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.textLight,
    marginLeft: 8,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  chipsContainer: {
    paddingVertical: 16,
  },
  chipScroll: {
    paddingHorizontal: 16,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    backgroundColor: COLORS.surface,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  activeChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  activeChipText: {
    color: COLORS.textLight,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  resultsCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textDark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  sheetTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textDark,
    marginBottom: 24,
  },
  filterSectionTitle: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textDark,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    marginRight: 10,
    marginBottom: 10,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textDark,
  },
  filterChipTextActive: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    fontWeight: 'bold',
  },
  applyFilterBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 40,
  },
  applyFilterText: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textLight,
    fontWeight: 'bold',
  }
});
