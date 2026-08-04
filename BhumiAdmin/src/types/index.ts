// BhumiCred Enterprise Ecosystem Typing Contracts

export type OnboardingStatus = 'Pending' | 'Approved' | 'Rejected' | 'Under Review' | 'Blocked';
export type LandVerificationStatus = 'Pending' | 'Verified' | 'Rejected' | 'Auditing';
export type CarbonProjectPhase = 'Feasibility' | 'Registration' | 'Active MRV' | 'Credit Issuance';
export type InsurancePolicyStatus = 'Pending Verification' | 'Active' | 'Claimed' | 'Expired';
export type ClaimStatus = 'Sub-Audit' | 'Approved' | 'Rejected' | 'Paid';
export type WithdrawalStatus = 'Pending Approval' | 'Approved' | 'Rejected' | 'Disbursed';
export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Escalated';
export type UserRole = 
  | 'super_admin' 
  | 'operations_admin' 
  | 'finance_manager' 
  | 'vendor_manager' 
  | 'carbon_project_manager' 
  | 'employee_manager' 
  | 'support_manager';

export interface Farmer {
  id: string;
  farmerId?: string;
  name: string;
  phone: string;
  email: string;
  location: {
    village: string;
    block: string;
    district: string;
    state: string;
  };
  kycStatus: OnboardingStatus;
  isActive: boolean;
  kycDocuments: {
    aadharNumber: string;
    panNumber: string;
    proofUrl: string;
  };
  sustainabilityScore: number; // 0 to 100
  registeredDate: string;
  totalAcreage: number;
  totalTrees: number;
  carbonCreditsGenerated: number;
  walletBalance: number;
}

export interface Land {
  id: string;
  farmerId: string;
  farmerName: string;
  surveyNumber: string;
  acreage: number;
  coordinates: [number, number]; // [Latitude, Longitude]
  boundaryPolygon: [number, number][]; // Polygon path for map
  cropType: string;
  soilOrganicCarbon: number; // % value
  proofDocumentUrl: string;
  status: LandVerificationStatus;
  verifiedDate?: string;
  remarks?: string;
}

export interface Vendor {
  id: string;
  vendorId?: string;
  storeName: string;
  ownerName: string;
  email: string;
  phone: string;
  category: 'Seeds & Organic' | 'Irrigation & Water' | 'Bio-Fertilizers' | 'Solar Tech' | 'Farm Machinery';
  kycStatus: OnboardingStatus;
  verified: boolean;
  revenueGenerated: number;
  rating: number;
  registeredDate: string;
  location?: {
    state: string;
    district: string;
    block: string;
    village: string;
  };
}

export interface Product {
  id: string;
  vendorId: string;
  vendorName: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  category: string;
  sustainabilityRating: number; // 1-5 stars
  isApproved: boolean;
  moderationStatus: 'Pending' | 'Approved' | 'Rejected';
  ecoBadges: string[]; // e.g. ["Certified Organic", "Zero Carbon Packaging"]
  isFeatured: boolean;
}

export interface CarbonProject {
  id: string;
  title: string;
  description: string;
  manager: string;
  assignedFarmerIds: string[];
  totalCreditsTarget: number;
  creditsIssued: number;
  phase: CarbonProjectPhase;
  progressPercentage: number;
  mrvReports: {
    reportId: string;
    auditor: string;
    date: string;
    pdfUrl: string;
    status: 'Verified' | 'Flagged';
  }[];
  startDate: string;
}

export interface InsurancePolicy {
  id: string;
  farmerId: string;
  farmerName: string;
  policyType: 'Green Shield Policy' | 'Eco Life Plan' | 'Agro Forest Secure Plan' | 'Green Family Plan';
  treeCount: number;
  premiumAmount: number;
  coverageAmount: number;
  plantationDate: string;
  status: InsurancePolicyStatus;
  greenFamilySerial?: string;
}

export interface InsuranceClaim {
  id: string;
  policyId: string;
  farmerId: string;
  farmerName: string;
  damageReason: 'Flood' | 'Pest Outbreak' | 'Severe Drought' | 'Windstorm';
  reportedDate: string;
  estimatedLossTrees: number;
  requestedAmount: number;
  status: ClaimStatus;
  remarks?: string;
}

export interface WithdrawalRequest {
  id: string;
  farmerId: string;
  farmerName: string;
  amount: number;
  paymentMethod?: 'bank' | 'upi';
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
  isPrimaryAccount?: boolean;
  upiId?: string;
  requestedDate: string;
  status: WithdrawalStatus;
  transactionHash?: string;
  processedBy?: string;
  remarks?: string;
}

export interface Order {
  id: string;
  buyerName: string;
  farmerName?: string;
  products: {
    productId: string;
    title: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  shippingAddress: string;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
  orderDate: string;
}

export interface SupportTicket {
  id: string;
  userName: string;
  userType: 'Farmer' | 'Vendor' | 'Buyer';
  subject: string;
  message: string;
  status: TicketStatus;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  createdDate: string;
  responses: {
    sender: string;
    message: string;
    date: string;
  }[];
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  onboardedDate: string;
  lastLogin: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  operator: string;
  role: UserRole | 'farmer' | 'vendor';
  action: string;
  ipAddress: string;
  success: boolean;
}

export interface GatewayLog {
  id: string;
  timestamp: string;
  method: string;
  endpoint: string;
  statusCode: number;
  responseTimeMs: number;
  error: string | null;
}

export interface CMSConfig {
  banners: {
    id: string;
    title: string;
    imageUrl: string;
    linkUrl: string;
    isActive: boolean;
  }[];
  announcementMarquee: string;
  isMarqueeActive: boolean;
  featuredCampaigns: {
    id: string;
    title: string;
    slogan: string;
    isActive: boolean;
  }[];
}
