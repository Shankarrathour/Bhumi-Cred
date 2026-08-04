export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkType: 'Test' | 'Package' | 'Category' | 'External';
  linkValue?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'Percentage' | 'Fixed';
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
  expiryDate: string;
  isActive: boolean;
  usageCount: number;
}

export interface Campaign {
  id: string;
  title: string;
  channel: 'SMS' | 'WhatsApp' | 'Email' | 'Push';
  recipientsCount: number;
  scheduledFor: string;
  status: 'Draft' | 'Scheduled' | 'Sent' | 'Failed';
  messageTemplate: string;
}

export interface ApiLog {
  id: string;
  timestamp: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  statusCode: number;
  latencyMs: number;
  ip: string;
  userAgent: string;
}
