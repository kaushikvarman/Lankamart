'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Rating } from '@/components/ui/rating';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';
import type { VendorPublic, Product, Review } from '@/types';

interface VendorTabsProps {
  vendor: VendorPublic;
  products: Product[];
}

const mockReviews: Review[] = [
  {
    id: 'vr-1',
    authorName: 'Michael Thompson',
    authorAvatar: null,
    rating: 5,
    title: 'Excellent vendor!',
    content: 'Great communication, fast shipping, and high-quality products. Will definitely order again.',
    isVerified: true,
    helpfulCount: 18,
    vendorReply: 'Thank you for your wonderful feedback!',
    createdAt: '2024-03-20',
  },
  {
    id: 'vr-2',
    authorName: 'Lisa Anderson',
    authorAvatar: null,
    rating: 5,
    title: 'Highly recommended',
    content: 'Professional service and authentic products. Very satisfied with my purchase.',
    isVerified: true,
    helpfulCount: 12,
    vendorReply: null,
    createdAt: '2024-03-15',
  },
  {
    id: 'vr-3',
    authorName: 'David Kumar',
    authorAvatar: null,
    rating: 4,
    title: 'Good experience',
    content: 'Quality products and reasonable prices. Shipping took a bit longer than expected but worth the wait.',
    isVerified: false,
    helpfulCount: 7,
    vendorReply: null,
    createdAt: '2024-03-10',
  },
];

export function VendorTabs({ vendor, products }: VendorTabsProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'about' | 'reviews'>('products');

  const tabs = [
    { id: 'products' as const, label: `Products (${products.length})` },
    { id: 'about' as const, label: 'About' },
    { id: 'reviews' as const, label: `Reviews (${mockReviews.length})` },
  ];

  return (
    <div>
      {/* Tab Headers */}
      <div className="border-b border-slate-200 mb-8">
        <div className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-2 font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link key={product.id} href={`/products/${product.slug}`}>
                <Card className="group h-full hover:shadow-lg transition-shadow">
                  <div className="relative aspect-square overflow-hidden rounded-t-lg">
                    <Image
                      src={product.images[0]?.url || ''}
                      alt={product.name}
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.compareAtPrice && (
                      <Badge variant="destructive" className="absolute top-3 left-3">
                        Save {Math.round(((product.compareAtPrice - product.basePrice) / product.compareAtPrice) * 100)}%
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors min-h-[3rem]">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-3">
                      <Rating rating={product.averageRating} size="sm" />
                      <span className="text-sm text-slate-600">
                        ({product.totalReviews})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-slate-900">
                        {formatPrice(product.basePrice)}
                      </span>
                      {product.compareAtPrice && (
                        <span className="text-sm text-slate-500 line-through">
                          {formatPrice(product.compareAtPrice)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* About Tab */}
        {activeTab === 'about' && (
          <div className="max-w-3xl">
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                  About {vendor.businessName}
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3">Company Overview</h3>
                    <p className="text-slate-700 leading-relaxed">
                      {vendor.description || 'A trusted vendor on LankaMart, offering high-quality products to customers worldwide.'}
                    </p>
                    <p className="text-slate-700 leading-relaxed mt-4">
                      We are committed to providing authentic, premium-quality products sourced directly from {vendor.country === 'LK' ? 'Sri Lanka' : 'India'}.
                      Our mission is to connect global buyers with the finest goods from our region, ensuring quality, authenticity, and excellent customer service.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3">Business Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-slate-600">Business Type</div>
                        <div className="font-medium text-slate-900">Manufacturer & Exporter</div>
                      </div>
                      <div>
                        <div className="text-slate-600">Location</div>
                        <div className="font-medium text-slate-900">
                          {vendor.city}, {vendor.country === 'LK' ? 'Sri Lanka' : 'India'}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-600">Year Established</div>
                        <div className="font-medium text-slate-900">2020</div>
                      </div>
                      <div>
                        <div className="text-slate-600">Certifications</div>
                        <div className="font-medium text-slate-900">ISO 9001, HACCP</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3">Why Choose Us</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-slate-700">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>100% authentic products with quality guarantees</span>
                      </li>
                      <li className="flex items-start gap-2 text-slate-700">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Direct from source with competitive pricing</span>
                      </li>
                      <li className="flex items-start gap-2 text-slate-700">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Worldwide shipping with secure packaging</span>
                      </li>
                      <li className="flex items-start gap-2 text-slate-700">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Responsive customer support and after-sales service</span>
                      </li>
                      <li className="flex items-start gap-2 text-slate-700">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Verified seller with excellent track record</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="max-w-3xl space-y-6">
            {/* Review Summary */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="text-center md:text-left">
                    <div className="text-5xl font-bold text-slate-900 mb-2">
                      {vendor.averageRating.toFixed(1)}
                    </div>
                    <Rating rating={vendor.averageRating} size="lg" />
                    <div className="text-sm text-slate-600 mt-2">
                      Based on {vendor.totalReviews} reviews
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    {[5, 4, 3, 2, 1].map((stars) => (
                      <div key={stars} className="flex items-center gap-3">
                        <span className="text-sm text-slate-600 w-12">
                          {stars} star
                        </span>
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-400"
                            style={{ width: `${stars === 5 ? 85 : stars === 4 ? 10 : 3}%` }}
                          />
                        </div>
                        <span className="text-sm text-slate-600 w-12 text-right">
                          {stars === 5 ? Math.floor(vendor.totalReviews * 0.85) : stars === 4 ? Math.floor(vendor.totalReviews * 0.1) : Math.floor(vendor.totalReviews * 0.03)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Individual Reviews */}
            {mockReviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-semibold text-slate-600">
                        {review.authorName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">
                            {review.authorName}
                          </span>
                          {review.isVerified && (
                            <Badge variant="success" className="text-xs">
                              Verified Purchase
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Rating rating={review.rating} size="sm" />
                          <span className="text-xs text-slate-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {review.title && (
                    <h4 className="font-semibold text-slate-900 mb-2">
                      {review.title}
                    </h4>
                  )}
                  {review.content && (
                    <p className="text-slate-700 mb-3">{review.content}</p>
                  )}
                  {review.vendorReply && (
                    <div className="mt-4 pl-4 border-l-2 border-primary-200 bg-primary-50 p-3 rounded">
                      <div className="text-sm font-medium text-slate-900 mb-1">
                        Vendor Response
                      </div>
                      <p className="text-sm text-slate-700">{review.vendorReply}</p>
                    </div>
                  )}
                  <div className="mt-4 flex items-center gap-4 text-sm text-slate-600">
                    <button className="hover:text-primary-600">
                      Helpful ({review.helpfulCount})
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
