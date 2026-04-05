// Shared TypeScript types used across API and Web apps
// These mirror the Prisma enums but are usable without Prisma client

export type UserRole = 'BUYER' | 'VENDOR' | 'VENDOR_STAFF' | 'LOGISTICS_PARTNER' | 'ADMIN' | 'SUPER_ADMIN';

export type UserStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';

export type KycStatus = 'NOT_SUBMITTED' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export type VendorTier = 'FREE' | 'PREMIUM' | 'ENTERPRISE';

export type ProductStatus = 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'PAUSED' | 'REJECTED' | 'OUT_OF_STOCK';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'PARTIALLY_SHIPPED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'REFUNDED';

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';

export type PaymentMethod = 'STRIPE_CARD' | 'BANK_TRANSFER' | 'ESCROW';

export type ShippingMode =
  | 'SEA_FREIGHT_FCL'
  | 'SEA_FREIGHT_LCL'
  | 'AIR_FREIGHT'
  | 'COURIER_EXPRESS'
  | 'ROAD_TRANSPORT';

export type RfqStatus = 'OPEN' | 'QUOTED' | 'NEGOTIATING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'CONVERTED_TO_ORDER';

export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED_BUYER' | 'RESOLVED_VENDOR' | 'ESCALATED' | 'CLOSED';

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

// Paginated response
export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Error response
export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  firstName: string;
  lastName: string;
}

// Shipping calculator input
export interface ShippingCalculation {
  originCountry: string;
  destinationCountry: string;
  weight: number; // kg
  length?: number; // cm
  width?: number; // cm
  height?: number; // cm
  declaredValue?: number;
  currency: string;
}

// Shipping quote result
export interface ShippingQuote {
  partnerId: string;
  partnerName: string;
  shippingMode: ShippingMode;
  cost: number;
  currency: string;
  minTransitDays: number;
  maxTransitDays: number;
  insuranceCost?: number;
}
