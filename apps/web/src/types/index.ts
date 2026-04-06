export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  baseCurrency: string;
  basePrice: number;
  compareAtPrice: number | null;
  averageRating: number;
  totalReviews: number;
  minOrderQty: number;
  vendorId: string;
  categoryId: string | null;
  status: string;
  images: ProductImage[];
  variants: ProductVariant[];
  vendor?: VendorPublic;
  category?: Category;
}

export interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  attributes: Record<string, string>;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  children?: Category[];
}

export interface VendorPublic {
  id: string;
  businessName: string;
  businessSlug: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  isVerified: boolean;
  averageRating: number;
  totalReviews: number;
  country: string;
  city: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface Review {
  id: string;
  authorName: string;
  authorAvatar: string | null;
  rating: number;
  title: string | null;
  content: string | null;
  isVerified: boolean;
  helpfulCount: number;
  vendorReply: string | null;
  createdAt: string;
}
