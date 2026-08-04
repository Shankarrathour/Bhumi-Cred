export const mockCategories = [
  { id: 'soil', name: 'Soil Audit', icon: 'sprout', testCount: '5+' },
  { id: 'canopy', name: 'Canopy Density', icon: 'tree', testCount: '4+' },
  { id: 'carbon', name: 'Carbon Credits', icon: 'molecule-co2', testCount: '3+' },
  { id: 'saplings', name: 'Saplings', icon: 'flower-tulip', testCount: '6+' },
  { id: 'equipment', name: 'Tools & Kits', icon: 'shovel', testCount: '5+' },
];

export const mockTests = [
  // --------------------------------------------------------
  // 1. SOIL AUDIT CATEGORY
  // --------------------------------------------------------
  {
    id: 'soil_1',
    category: 'Soil Audit',
    category_id: 'soil',
    name: 'Complete Soil NPK & Carbon Audit',
    description: '12 parameters: Organic Carbon %, Nitrogen (N), Phosphorus (P), Potassium (K), pH, Moisture.',
    price: 499,
    discountedPrice: 299,
    rating: 4.9,
    reviews: 1240,
    reportTime: '48 Hours',
    homeCollection: true, // Field pickup
    parameters: 12,
    fastingRequired: true, // Physical Baseline required
    whyRequired: 'Complete NPK & Soil Organic Carbon verification is required to establish the foundational soil health index and register plots for the BhumiCred carbon credit program.',
  },
  {
    id: 'soil_2',
    category: 'Soil Audit',
    category_id: 'soil',
    name: 'Soil Organic Carbon (SOC) Scan',
    description: 'Measures carbon sponge percentage for regenerative agricultural payouts.',
    price: 299,
    discountedPrice: 149,
    rating: 4.8,
    reviews: 850,
    reportTime: '24 Hours',
    homeCollection: true,
    parameters: 4,
    fastingRequired: true,
    whyRequired: 'Soil Organic Carbon is the prime indicator of sustainable farming. Verified increases in SOC directly translate to tradable carbon offset token credits.',
  },
  {
    id: 'soil_3',
    category: 'Soil Audit',
    category_id: 'soil',
    name: 'Soil pH & Moisture Baseline',
    description: 'Rapid physical test for crop-suitability and micro-nutrient baseline.',
    price: 199,
    discountedPrice: 99,
    rating: 4.7,
    reviews: 512,
    reportTime: '12 Hours',
    homeCollection: true,
    parameters: 3,
    fastingRequired: false,
    whyRequired: 'Determines the acidity, alkalinity, and moisture holding capacity of your field soil, facilitating optimal organic bio-fertilizer dosing.',
  },

  // --------------------------------------------------------
  // 2. CANOPY DENSITY CATEGORY (NDVI Satellite scans)
  // --------------------------------------------------------
  {
    id: 'canopy_1',
    category: 'Canopy Density',
    category_id: 'canopy',
    name: 'Satellite NDVI Crop Health Scan',
    description: 'Generates NDVI biomass analytics and crop vegetative vitality index.',
    price: 399,
    discountedPrice: 199,
    rating: 4.8,
    reviews: 930,
    reportTime: 'Instant (Satellite)',
    homeCollection: false, // Digital only
    parameters: 6,
    fastingRequired: false,
    whyRequired: 'Utilizes Sentinel satellite multispectral data to assess chlorophyll absorption and vegetation density, giving you an official certified crop health report card.',
  },
  {
    id: 'canopy_2',
    category: 'Canopy Density',
    category_id: 'canopy',
    name: 'Biomass Density & Height Mapping',
    description: 'Calculates active woody carbon stock in boundaries and agroforestry plots.',
    price: 599,
    discountedPrice: 299,
    rating: 4.6,
    reviews: 410,
    reportTime: 'Instant (Satellite)',
    homeCollection: false,
    parameters: 5,
    fastingRequired: false,
    whyRequired: 'Measures tree growth height and boundary density profiles. Critical for verifying timber and non-timber biomass carbon storage milestones.',
  },

  // --------------------------------------------------------
  // 3. CARBON CREDITS
  // --------------------------------------------------------
  {
    id: 'carbon_1',
    category: 'Carbon Credits',
    category_id: 'carbon',
    name: 'Zero-Tillage Verification Audit',
    description: 'Registers crop residue management and minimum tillage farming practices.',
    price: 899,
    discountedPrice: 499,
    rating: 4.9,
    reviews: 1150,
    reportTime: '3 Days (Field Audit)',
    homeCollection: true,
    parameters: 8,
    fastingRequired: true,
    whyRequired: 'Physical audit verifying zero-tillage status and mulch coverage. High-priority carbon program eligibility with premium corporate offset partners.',
  },
  {
    id: 'carbon_2',
    category: 'Carbon Credits',
    category_id: 'carbon',
    name: 'Methane Reduction Paddy Audit',
    description: 'Verifies Alternate Wetting and Drying (AWD) cycles in paddy fields.',
    price: 1199,
    discountedPrice: 699,
    rating: 4.7,
    reviews: 320,
    reportTime: '4 Days (Sensor Sync)',
    homeCollection: true,
    parameters: 10,
    fastingRequired: true,
    whyRequired: 'Audits irrigation schedules and water baseline levels. Intermittent wetting and drying in rice paddies severely cuts methane emissions, unlocking elite carbon bonuses.',
  },

  // --------------------------------------------------------
  // 4. SAPLINGS SHOP
  // --------------------------------------------------------
  {
    id: 'sap_1',
    category: 'Saplings',
    category_id: 'saplings',
    name: 'Boundary Eucalyptus Sapling Bundle',
    description: 'Pack of 50 fast-growing boundary saplings, optimized for wood biomass.',
    price: 999,
    discountedPrice: 599,
    rating: 4.8,
    reviews: 1420,
    reportTime: 'Delivery (3 Days)',
    homeCollection: true, // Home delivered
    parameters: 50,
    fastingRequired: false,
    whyRequired: 'Highly resilient cloned eucalyptus saplings perfect for bund planting. Unlocks the "Green Family" tree insurance ecosystem milestones.',
  },
  {
    id: 'sap_2',
    category: 'Saplings',
    category_id: 'saplings',
    name: 'Agroforestry Teakwood Sapling Pack',
    description: 'Pack of 25 elite tissue-cultured teakwood saplings for long-term timber credits.',
    price: 1499,
    discountedPrice: 899,
    rating: 4.9,
    reviews: 950,
    reportTime: 'Delivery (3 Days)',
    homeCollection: true,
    parameters: 25,
    fastingRequired: false,
    whyRequired: 'Tissue-cultured elite teakwood saplings featuring straight growth and high wood density, providing massive carbon sequestration value and timber assets.',
  },

  // --------------------------------------------------------
  // 5. TOOLS & KITS
  // --------------------------------------------------------
  {
    id: 'eq_1',
    category: 'Tools & Kits',
    category_id: 'equipment',
    name: 'Kalyan Bio-Organic Fertilizer Kit',
    description: 'Contains Mycorrhiza bio-fertilizer and organic compost boosters.',
    price: 799,
    discountedPrice: 399,
    rating: 4.9,
    reviews: 890,
    reportTime: 'Delivery (2 Days)',
    homeCollection: true,
    parameters: 5,
    fastingRequired: false,
    whyRequired: 'Restores native soil micro-flora, increases root nutrient absorption, and boosts soil organic carbon accumulation naturally without synthetic chemicals.',
  },
  {
    id: 'eq_2',
    category: 'Tools & Kits',
    category_id: 'equipment',
    name: 'Crop Residue Mulching Attachment',
    description: 'Bio-shredder booster spray to rapidly decompose stubble instead of burning.',
    price: 599,
    discountedPrice: 299,
    rating: 4.8,
    reviews: 730,
    reportTime: 'Delivery (2 Days)',
    homeCollection: true,
    parameters: 3,
    fastingRequired: false,
    whyRequired: 'Shreds and decomposes crop residues instantly. Avoids harmful stubble burning practices, completely retaining soil nutrients and unlocking maximum green rank credits.',
  }
];

export const mockReports = [
  {
    id: 'REP-001',
    date: '2026-05-10',
    testName: 'Complete Soil NPK & Carbon Audit',
    status: 'Ready',
    abnormal: true,
    flags: ['Low Carbon Sponge'],
  },
  {
    id: 'REP-002',
    date: '2026-04-15',
    testName: 'Satellite NDVI Crop Health Scan',
    status: 'Ready',
    abnormal: false,
    flags: [],
  }
];

export const mockPackageCategories = [
  { id: 'all', name: 'All Audits & Bundles' },
  { id: 'basic', name: 'Basic Audit' },
  { id: 'comprehensive', name: 'Comprehensive Scan' },
  { id: 'carbon_premium', name: 'Carbon Programs' },
  { id: 'boundary_packs', name: 'Sapling Packs' },
];

export interface HealthPackage {
  id: string;
  category: string;
  categoryId: string;
  name: string;
  subtitle: string;
  price: number;
  oldPrice: number;
  discount: string;
  parameters: number;
  homeCollection: boolean;
  badge?: string;
  testsIncluded: string[];
  keyParameters: string[];
  description: string;
  reportTime: string;
  fastingRequired: boolean;
  whyRequired?: string;
  preparation?: string;
}

export const mockPackages: HealthPackage[] = [
  {
    id: 'bhumicheck_basic',
    category: 'Basic Audit',
    categoryId: 'basic',
    name: 'BhumiCheck Basic Soil Audit',
    subtitle: 'NPK Index · Moisture Benchmarking',
    price: 449,
    oldPrice: 1000,
    discount: '55% OFF',
    parameters: 6,
    homeCollection: true,
    testsIncluded: ['Nitrogen (N) Content', 'Phosphorus (P) Index', 'Potassium (K) Level', 'Soil pH Assessment'],
    keyParameters: ['Available N', 'Available P', 'Available K', 'Soil pH Index'],
    description: 'Perfect for smallholder farmers looking to establish a basic soil chemical baseline.',
    reportTime: '24 Hours',
    fastingRequired: true,
    preparation: 'Physical Soil Sampling Required. Please clear top weeds 24h before collector arrival.'
  },
  {
    id: 'bhumicheck_complete',
    category: 'Comprehensive Scan',
    categoryId: 'comprehensive',
    name: 'BhumiCheck Carbon Premium Audit',
    subtitle: 'Organic Carbon % · Drone NDVI Map',
    price: 1149,
    oldPrice: 2800,
    discount: '59% OFF',
    parameters: 15,
    homeCollection: true,
    badge: 'MOST POPULAR',
    testsIncluded: ['Soil Organic Carbon (SOC) %', 'NPK Macro-Nutrients', 'Sentinel Satellite NDVI Analysis', 'Trace Minerals Panel'],
    keyParameters: ['Organic Carbon %', 'Biomass Density Index', 'Soil Micro-flora Count', 'Moisture holding %'],
    description: 'Comprehensive farm health checking: soil chemical parameters, organic carbon, and remote NDVI scanning.',
    reportTime: '48 Hours',
    fastingRequired: true,
    preparation: 'Overnight field mapping checklist must be filled. Standard 4-corner plot samples collected.'
  },
  {
    id: 'boundary_sponge_pack',
    category: 'Sapling Packs',
    categoryId: 'boundary_packs',
    name: 'Boundary Carbon Sponge Package',
    subtitle: '50 Cloned Saplings + Bio-Fertilizer',
    price: 1349,
    oldPrice: 3000,
    discount: '55% OFF',
    parameters: 51,
    homeCollection: true,
    badge: 'MILESTONE ENABLED',
    testsIncluded: ['50 cl. Eucalyptus Boundary Saplings', 'Kalyan Bio-organic composting starter', '1 year MRV drone scanning subscription'],
    keyParameters: ['Saplings Bundle', 'Soil Bio-Activator', 'Ndvi Canopy tracking'],
    description: 'Everything required to plant boundary saplings, activate healthy soil, and begin sequestering carbon.',
    reportTime: 'Delivery (3 Days)',
    fastingRequired: false,
    preparation: 'Ready for planting on bunds and farm margins. Safe boundary access required for satellite mapping.'
  }
];
