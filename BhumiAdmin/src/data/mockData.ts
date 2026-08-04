import { 
  Farmer, 
  Land, 
  Vendor, 
  Product, 
  CarbonProject, 
  InsurancePolicy, 
  InsuranceClaim, 
  WithdrawalRequest, 
  Order,
  SupportTicket, 
  Employee,
  CMSConfig
} from '../types';

// 👥 1. SEED FARMERS DATA
export const seedFarmers: Farmer[] = [
  {
    id: "FRM-001",
    name: "Gurdev Singh Dhillon",
    phone: "+91 98450 12093",
    email: "gurdev.dhillon@grainmail.com",
    location: { village: "Karnal Khurd", block: "Gharaunda", district: "Karnal", state: "Haryana" },
    kycStatus: "Approved",
    isActive: true,
    kycDocuments: { aadharNumber: "4820-1920-3028", panNumber: "BGSPD8391A", proofUrl: "/proofs/gurdev_aadhar.pdf" },
    sustainabilityScore: 88,
    registeredDate: "2026-01-10",
    totalAcreage: 12.5,
    totalTrees: 840,
    carbonCreditsGenerated: 148.5,
    walletBalance: 42500
  },
  {
    id: "FRM-002",
    name: "Rajeshwar Prasad Yadav",
    phone: "+91 94520 83921",
    email: "rajeshwar.yadav@ruralmail.in",
    location: { village: "Babatpur", block: "Harahua", district: "Varanasi", state: "Uttar Pradesh" },
    kycStatus: "Pending",
    isActive: true,
    kycDocuments: { aadharNumber: "7291-8830-1923", panNumber: "DKRPY4832G", proofUrl: "/proofs/rajeshwar_aadhar.pdf" },
    sustainabilityScore: 65,
    registeredDate: "2026-05-18",
    totalAcreage: 6.2,
    totalTrees: 320,
    carbonCreditsGenerated: 0,
    walletBalance: 0
  },
  {
    id: "FRM-003",
    name: "Mahadevappa Gowda",
    phone: "+91 88390 12839",
    email: "mahadevappa.g@krishimail.com",
    location: { village: "Hunsur Hobli", block: "Hunsur", district: "Mysuru", state: "Karnataka" },
    kycStatus: "Approved",
    isActive: true,
    kycDocuments: { aadharNumber: "9123-4820-2918", panNumber: "APMGP1298Z", proofUrl: "/proofs/mahadevappa_aadhar.pdf" },
    sustainabilityScore: 92,
    registeredDate: "2025-11-04",
    totalAcreage: 18.0,
    totalTrees: 1450,
    carbonCreditsGenerated: 312.0,
    walletBalance: 89000
  },
  {
    id: "FRM-004",
    name: "Ramesh Tukaram Patil",
    phone: "+91 99230 48392",
    email: "ramesh.patil@mahacrop.org",
    location: { village: "Manchar", block: "Ambegaon", district: "Pune", state: "Maharashtra" },
    kycStatus: "Under Review",
    isActive: true,
    kycDocuments: { aadharNumber: "5829-1920-4829", panNumber: "CDRPP1209B", proofUrl: "/proofs/ramesh_aadhar.pdf" },
    sustainabilityScore: 72,
    registeredDate: "2026-04-12",
    totalAcreage: 8.5,
    totalTrees: 480,
    carbonCreditsGenerated: 42.8,
    walletBalance: 12500
  },
  {
    id: "FRM-005",
    name: "Sukhwinder Pal Brar",
    phone: "+91 94170 38291",
    email: "sukhwinder.brar@braragri.com",
    location: { village: "Jaitu", block: "Kotkapura", district: "Faridkot", state: "Punjab" },
    kycStatus: "Approved",
    isActive: true,
    kycDocuments: { aadharNumber: "2830-4819-3019", panNumber: "ALSPB9283Q", proofUrl: "/proofs/sukhwinder_aadhar.pdf" },
    sustainabilityScore: 95,
    registeredDate: "2025-08-20",
    totalAcreage: 25.0,
    totalTrees: 2100,
    carbonCreditsGenerated: 580.4,
    walletBalance: 174000
  },
  {
    id: "FRM-006",
    name: "Bhupatbhai Solanki",
    phone: "+91 98250 83921",
    email: "bhupat.solanki@gujaratkrishi.in",
    location: { village: "Maliya", block: "Maliya Hatina", district: "Junagadh", state: "Gujarat" },
    kycStatus: "Rejected",
    isActive: true,
    kycDocuments: { aadharNumber: "3829-2819-4820", panNumber: "BSBPS1920K", proofUrl: "/proofs/bhupat_aadhar.pdf" },
    sustainabilityScore: 40,
    registeredDate: "2026-02-15",
    totalAcreage: 4.8,
    totalTrees: 0,
    carbonCreditsGenerated: 0,
    walletBalance: 0
  },
  {
    id: "FRM-007",
    name: "Savita Mahadev Phadke",
    phone: "+91 91720 39281",
    email: "savita.phadke@shendriya.org",
    location: { village: "Baramati Rural", block: "Baramati", district: "Pune", state: "Maharashtra" },
    kycStatus: "Approved",
    isActive: true,
    kycDocuments: { aadharNumber: "8829-1920-5821", panNumber: "AVSMP1928C", proofUrl: "/proofs/savita_aadhar.pdf" },
    sustainabilityScore: 86,
    registeredDate: "2026-03-01",
    totalAcreage: 9.4,
    totalTrees: 610,
    carbonCreditsGenerated: 78.2,
    walletBalance: 24500
  }
];

// 🗺️ 2. SEED LANDS DATA
export const seedLands: Land[] = [
  {
    id: "LND-001",
    farmerId: "FRM-001",
    farmerName: "Gurdev Singh Dhillon",
    surveyNumber: "SRV-201/A",
    acreage: 7.5,
    coordinates: [29.845, 76.982],
    boundaryPolygon: [
      [29.846, 76.980], [29.848, 76.983], [29.844, 76.985], [29.842, 76.981]
    ],
    cropType: "Rice-Wheat Agroforestry (Poplar Trees)",
    soilOrganicCarbon: 1.45,
    proofDocumentUrl: "/proofs/karnal_land_registry.pdf",
    status: "Verified",
    verifiedDate: "2026-01-15"
  },
  {
    id: "LND-002",
    farmerId: "FRM-002",
    farmerName: "Rajeshwar Prasad Yadav",
    surveyNumber: "SRV-1024/7",
    acreage: 4.5,
    coordinates: [25.448, 82.859],
    boundaryPolygon: [
      [25.450, 82.857], [25.451, 82.861], [25.447, 82.862], [25.446, 82.858]
    ],
    cropType: "Horticulture (Mango & Mustard Canopy)",
    soilOrganicCarbon: 0.88,
    proofDocumentUrl: "/proofs/varanasi_land_registry.pdf",
    status: "Pending",
    remarks: "Pending visual satellite confirmation of tree densities"
  },
  {
    id: "LND-003",
    farmerId: "FRM-003",
    farmerName: "Mahadevappa Gowda",
    surveyNumber: "SRV-304/B",
    acreage: 12.0,
    coordinates: [12.285, 76.321],
    boundaryPolygon: [
      [12.287, 76.319], [12.289, 76.323], [12.284, 76.324], [12.282, 76.320]
    ],
    cropType: "Silviculture (Melia Dubia & Coffee plantation)",
    soilOrganicCarbon: 1.82,
    proofDocumentUrl: "/proofs/mysuru_land_registry.pdf",
    status: "Verified",
    verifiedDate: "2025-11-10"
  },
  {
    id: "LND-004",
    farmerId: "FRM-004",
    farmerName: "Ramesh Tukaram Patil",
    surveyNumber: "SRV-98/C",
    acreage: 6.0,
    coordinates: [19.012, 73.854],
    boundaryPolygon: [
      [19.014, 73.852], [19.015, 73.856], [19.010, 73.857], [19.009, 73.853]
    ],
    cropType: "Bamboo Cultivation (Reclaim Wasteland)",
    soilOrganicCarbon: 1.12,
    proofDocumentUrl: "/proofs/pune_land_registry.pdf",
    status: "Auditing",
    remarks: "Geo-tag boundaries are currently matching with adjacent canal reserves. Rerun checks."
  },
  {
    id: "LND-005",
    farmerId: "FRM-005",
    farmerName: "Sukhwinder Pal Brar",
    surveyNumber: "SRV-412/1",
    acreage: 20.0,
    coordinates: [30.478, 74.839],
    boundaryPolygon: [
      [30.482, 74.835], [30.485, 74.842], [30.475, 74.845], [30.472, 74.838]
    ],
    cropType: "Poplar & Eucalyptus Timber agro-carbon system",
    soilOrganicCarbon: 1.95,
    proofDocumentUrl: "/proofs/punjab_land_registry.pdf",
    status: "Verified",
    verifiedDate: "2025-08-25"
  }
];

// 🏪 3. SEED VENDORS DATA
export const seedVendors: Vendor[] = [
  {
    id: "VND-001",
    storeName: "Bhumi Biotech Solutions",
    ownerName: "Dr. Vikram Sethi",
    email: "contact@bhumibiotech.com",
    phone: "+91 98891 02938",
    category: "Bio-Fertilizers",
    kycStatus: "Approved",
    verified: true,
    revenueGenerated: 284000,
    rating: 4.8,
    registeredDate: "2025-10-12"
  },
  {
    id: "VND-002",
    storeName: "Surya Urja Pumps",
    ownerName: "Dinesh K. Patel",
    email: "sales@suryaurjapumps.co.in",
    phone: "+91 94250 18291",
    category: "Solar Tech",
    kycStatus: "Approved",
    verified: true,
    revenueGenerated: 625000,
    rating: 4.5,
    registeredDate: "2025-09-04"
  },
  {
    id: "VND-003",
    storeName: "Greenroots Organic Seeds",
    ownerName: "Amrita Sen",
    email: "amrita.sen@greenroots.in",
    phone: "+91 82910 83921",
    category: "Seeds & Organic",
    kycStatus: "Pending",
    verified: false,
    revenueGenerated: 0,
    rating: 0,
    registeredDate: "2026-05-22"
  },
  {
    id: "VND-004",
    storeName: "Precision Agri Drips",
    ownerName: "Harish Rao",
    email: "harish@precisionagri.com",
    phone: "+91 90029 48392",
    category: "Irrigation & Water",
    kycStatus: "Under Review",
    verified: false,
    revenueGenerated: 18000,
    rating: 4.2,
    registeredDate: "2026-02-10"
  }
];

// 🛍️ 4. SEED PRODUCTS DATA
export const seedProducts: Product[] = [
  {
    id: "PRD-001",
    vendorId: "VND-001",
    vendorName: "Bhumi Biotech Solutions",
    title: "Mycorrhizal Bio-Stimulant (Root booster)",
    description: "Concentrated symbiotic soil inoculant that dramatically increases water and phosphate absorption, capturing massive soil carbon.",
    price: 650,
    stock: 240,
    imageUrl: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop&q=80",
    category: "Bio-Fertilizers",
    sustainabilityRating: 5,
    isApproved: true,
    moderationStatus: "Approved",
    ecoBadges: ["Soil Inoculant", "Organic Certified", "Carbon Sequestering Base"],
    isFeatured: true
  },
  {
    id: "PRD-002",
    vendorId: "VND-001",
    vendorName: "Bhumi Biotech Solutions",
    title: "Nitrogen Fixing Liquid Bio-Azotobacter",
    description: "Rhizosphere bacterial culture that fixes atmospheric nitrogen in cropping fields, cutting urea dependency by 40%.",
    price: 380,
    stock: 500,
    imageUrl: "https://images.unsplash.com/photo-1599933333649-788e9f55e5c3?w=500&auto=format&fit=crop&q=80",
    category: "Bio-Fertilizers",
    sustainabilityRating: 4.8,
    isApproved: true,
    moderationStatus: "Approved",
    ecoBadges: ["Zero Chemical Residue", "Methane Mitigation"],
    isFeatured: false
  },
  {
    id: "PRD-003",
    vendorId: "VND-002",
    vendorName: "Surya Urja Pumps",
    title: "5HP Solar Brushless DC Monoblock Pump",
    description: "Submersible highly efficient solar-powered water extractor with dynamic controller, ensuring zero emission irrigation.",
    price: 48500,
    stock: 15,
    imageUrl: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=500&auto=format&fit=crop&q=80",
    category: "Solar Tech",
    sustainabilityRating: 5,
    isApproved: true,
    moderationStatus: "Approved",
    ecoBadges: ["Solar Powered", "Zero Coal Fuel Reliance", "Energy Class-A Star"],
    isFeatured: true
  },
  {
    id: "PRD-004",
    vendorId: "VND-003",
    vendorName: "Greenroots Organic Seeds",
    title: "Indo-Semitic High Carbon Sequestration Wheat Seeds",
    description: "Special hybrid seed stock optimized for deep-rooted architecture, allowing soils to lock 20% more organic carbons.",
    price: 1800,
    stock: 80,
    imageUrl: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop&q=80",
    category: "Seeds & Organic",
    sustainabilityRating: 4.5,
    isApproved: false,
    moderationStatus: "Pending",
    ecoBadges: ["Deep Root System", "Non-GMO", "Eco-Packaging"],
    isFeatured: false
  }
];

// 🌲 5. SEED CARBON PROJECTS DATA
export const seedCarbonProjects: CarbonProject[] = [
  {
    id: "PRJ-001",
    title: "Karnal Agroforestry Carbon Sink Program",
    description: "High-density Poplar tree planting over rural boundaries in Gharaunda, locking atmospheric carbons into valuable local timber.",
    manager: "Aarti V. Rao",
    assignedFarmerIds: ["FRM-001", "FRM-005"],
    totalCreditsTarget: 50000,
    creditsIssued: 12500,
    phase: "Active MRV",
    progressPercentage: 42,
    mrvReports: [
      { reportId: "MRV-RPT-001", auditor: "SGS India Climate Services", date: "2025-12-04", pdfUrl: "/reports/mrv_karnal_v1.pdf", status: "Verified" }
    ],
    startDate: "2025-04-10"
  },
  {
    id: "PRJ-002",
    title: "Gangetic Plain Regenerative Soil Organic Initiative",
    description: "Transitioning 1,000 farmers in eastern Uttar Pradesh to zero-tillage and bio-inoculant agriculture, raising soil carbon quotients.",
    manager: "Dr. K. Raghavan",
    assignedFarmerIds: ["FRM-002"],
    totalCreditsTarget: 120000,
    creditsIssued: 0,
    phase: "Registration",
    progressPercentage: 15,
    mrvReports: [],
    startDate: "2026-02-12"
  },
  {
    id: "PRJ-003",
    title: "Deccan Dryland Bamboo Afforestation Program",
    description: "Reclaiming semi-arid degraded soils in Ambegaon using quick-growth high biomass bamboo species, generating robust voluntary carbon credits.",
    manager: "S. Deshmukh",
    assignedFarmerIds: ["FRM-004", "FRM-007"],
    totalCreditsTarget: 85000,
    creditsIssued: 0,
    phase: "Feasibility",
    progressPercentage: 5,
    mrvReports: [],
    startDate: "2026-04-20"
  }
];

// 🛡️ 6. SEED INSURANCE POLICIES & CLAIMS DATA
export const seedInsurancePolicies: InsurancePolicy[] = [
  {
    id: "POL-001",
    farmerId: "FRM-001",
    farmerName: "Gurdev Singh Dhillon",
    policyType: "Green Shield Policy",
    treeCount: 500,
    premiumAmount: 8500,
    coverageAmount: 250000,
    plantationDate: "2026-01-18",
    status: "Active",
    greenFamilySerial: "GF-KRNL-928392-A"
  },
  {
    id: "POL-002",
    farmerId: "FRM-003",
    farmerName: "Mahadevappa Gowda",
    policyType: "Agro Forest Secure Plan",
    treeCount: 1200,
    premiumAmount: 24000,
    coverageAmount: 600000,
    plantationDate: "2025-11-15",
    status: "Active",
    greenFamilySerial: "GF-MYS-817290-K"
  },
  {
    id: "POL-003",
    farmerId: "FRM-004",
    farmerName: "Ramesh Tukaram Patil",
    policyType: "Green Family Plan",
    treeCount: 400,
    premiumAmount: 5000,
    coverageAmount: 180000,
    plantationDate: "2026-04-15",
    status: "Pending Verification"
  }
];

export const seedInsuranceClaims: InsuranceClaim[] = [
  {
    id: "CLM-001",
    policyId: "POL-001",
    farmerId: "FRM-001",
    farmerName: "Gurdev Singh Dhillon",
    damageReason: "Windstorm",
    reportedDate: "2026-05-10",
    estimatedLossTrees: 60,
    requestedAmount: 30000,
    status: "Sub-Audit",
    remarks: "Requires satellite orthomosaic proof validation of fallen tree count"
  }
];

// 💰 7. SEED WITHDRAWALS & TRANSACTIONS DATA
export const seedWithdrawals: WithdrawalRequest[] = [
  {
    id: "WTH-001",
    farmerId: "FRM-001",
    farmerName: "Gurdev Singh Dhillon",
    amount: 15000,
    bankName: "State Bank of India",
    accountNumber: "38290129304",
    ifscCode: "SBIN0001048",
    requestedDate: "2026-05-24",
    status: "Pending Approval"
  },
  {
    id: "WTH-002",
    farmerId: "FRM-003",
    farmerName: "Mahadevappa Gowda",
    amount: 35000,
    bankName: "HDFC Bank",
    accountNumber: "501002381928",
    ifscCode: "HDFC0000142",
    requestedDate: "2026-05-22",
    status: "Disbursed",
    transactionHash: "0x3ab82dc81a9c8f615309db8cdeef8e9ac63b82dfc72f10dbe9a81c1cde",
    processedBy: "super_admin"
  }
];

// 📦 8. SEED ORDERS DATA
export const seedOrders: Order[] = [
  {
    id: "AGR-20260801-E9M5MM",
    buyerName: "Rajeshwar Prasad (Farmer)",
    farmerName: "Rajeshwar Prasad",
    products: [
      { productId: "PRD-004", title: "KR-10 Improved Pea Seed", quantity: 1, price: 120 }
    ],
    totalAmount: 170,
    shippingAddress: "Plot #103, Babatpur, Varanasi, UP - 221006",
    status: "Pending",
    orderDate: "2026-08-01"
  },
  {
    id: "ORD-001",
    buyerName: "Zenith Agri Exports Corp",
    farmerName: "Gurdev Singh Dhillon",
    products: [
      { productId: "PRD-001", title: "Mycorrhizal Bio-Stimulant (Root booster)", quantity: 20, price: 650 }
    ],
    totalAmount: 13000,
    shippingAddress: "Warehouse 4B, JNPT Port, Navi Mumbai, MH, 400707",
    status: "Shipped",
    orderDate: "2026-05-15"
  }
];

// 💬 9. SEED SUPPORT TICKETS
export const seedSupportTickets: SupportTicket[] = [
  {
    id: "TCK-001",
    userName: "Gurdev Singh Dhillon",
    userType: "Farmer",
    subject: "Error uploading land registry document",
    message: "Platform crashes repeatedly at 90% upload during land registration. The file size is 4.8MB in PDF. Please assist.",
    status: "In Progress",
    priority: "High",
    createdDate: "2026-05-25",
    responses: [
      { sender: "System Support", message: "Hello Gurdev, please ensure your PDF is flattened and is below 5MB. If the error persists, clear your browser cache.", date: "2026-05-26" }
    ]
  },
  {
    id: "TCK-002",
    userName: "Dr. Vikram Sethi",
    userType: "Vendor",
    subject: "GST attribution inquiry",
    message: "Do bio-fertilizers require separate CGST reporting on the invoice builder drawer, or is it handled automatically u/s 194J?",
    status: "Open",
    priority: "Medium",
    createdDate: "2026-05-27",
    responses: []
  }
];

// 👥 10. SEED EMPLOYEES DATA
export const seedEmployees: Employee[] = [
  { id: "EMP-001", name: "Anand Verma", email: "anand.verma@bhumicred.com", role: "super_admin", isActive: true, onboardedDate: "2025-01-10", lastLogin: "2026-05-28 07:15" },
  { id: "EMP-002", name: "Siddharth Rao", email: "s.rao@bhumicred.com", role: "operations_admin", isActive: true, onboardedDate: "2025-03-12", lastLogin: "2026-05-27 18:22" },
  { id: "EMP-003", name: "Nisha Goel", email: "nisha.goel@bhumicred.com", role: "finance_manager", isActive: true, onboardedDate: "2025-06-15", lastLogin: "2026-05-28 06:45" },
  { id: "EMP-004", name: "Kunal Shah", email: "kunal.shah@bhumicred.com", role: "vendor_manager", isActive: true, onboardedDate: "2025-05-20", lastLogin: "2026-05-26 14:02" },
  { id: "EMP-005", name: "Dr. Prerna Patil", email: "prerna.p@bhumicred.com", role: "carbon_project_manager", isActive: true, onboardedDate: "2025-08-01", lastLogin: "2026-05-28 08:00" },
  { id: "EMP-006", name: "Varun Nair", email: "varun.n@bhumicred.com", role: "support_manager", isActive: true, onboardedDate: "2025-11-10", lastLogin: "2026-05-27 10:30" }
];


// 🖥️ 12. SEED CMS CONFIGURATION
export const seedCMSConfig: CMSConfig = {
  banners: [
    { id: "BNR-001", title: "Join the Carbon Revolution: Monsoon Program Active!", imageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80", linkUrl: "/programs", isActive: true },
    { id: "BNR-002", title: "Plantation Insurance: Safeguard your future trees with Green Shield", imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80", linkUrl: "/insurance", isActive: true }
  ],
  announcementMarquee: "🔴 CRITICAL ADVISORY: State government announces 25% premium subsidy on Agroforestry plantations for Varanasi district farmers! Check Government Schemes section.",
  isMarqueeActive: true,
  featuredCampaigns: [
    { id: "CMP-001", title: "Varanasi Net-Zero Green Farmers Group", slogan: "Binding 500+ smallholding fields into India's premier organic carbon community.", isActive: true },
    { id: "CMP-002", title: "Punjab Agroforestry Pioneers", slogan: "Securing carbon reserves while guaranteeing timber commercial yields.", isActive: true }
  ]
};
export const STATES_AND_DISTRICTS: Record<string, string[]> = {
  'Haryana': ['Karnal'],
  'Uttar Pradesh': ['Varanasi'],
  'Karnataka': ['Mysuru'],
  'Maharashtra': ['Pune'],
  'Punjab': ['Faridkot'],
  'Gujarat': ['Junagadh']
};

export const DISTRICT_BLOCKS: Record<string, string[]> = {
  'Karnal': ['Gharaunda'],
  'Varanasi': ['Harahua'],
  'Mysuru': ['Hunsur'],
  'Pune': ['Ambegaon', 'Baramati'],
  'Faridkot': ['Kotkapura'],
  'Junagadh': ['Maliya Hatina']
};

export const BLOCK_VILLAGES: Record<string, string[]> = {
  'Gharaunda': ['Karnal Khurd'],
  'Harahua': ['Babatpur'],
  'Hunsur': ['Hunsur Hobli'],
  'Ambegaon': ['Manchar'],
  'Baramati': ['Baramati Rural'],
  'Kotkapura': ['Jaitu'],
  'Maliya Hatina': ['Maliya']
};
