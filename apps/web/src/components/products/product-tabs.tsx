'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Rating } from '@/components/ui/rating';
import { Badge } from '@/components/ui/badge';
import type { Product, Review } from '@/types';

interface ProductTabsProps {
  product: Product;
}

const mockReviews: Review[] = [
  {
    id: 'r-1',
    authorName: 'Sarah Mitchell',
    authorAvatar: null,
    rating: 5,
    title: 'Excellent quality!',
    content: 'The quality exceeded my expectations. Authentic Ceylon cinnamon with amazing aroma. Highly recommend!',
    isVerified: true,
    helpfulCount: 12,
    vendorReply: 'Thank you for your kind words! We\'re glad you enjoyed our product.',
    createdAt: '2024-03-15',
  },
  {
    id: 'r-2',
    authorName: 'James Chen',
    authorAvatar: null,
    rating: 4,
    title: 'Great product',
    content: 'Very good cinnamon. Packaging was secure and delivery was fast. Will order again.',
    isVerified: true,
    helpfulCount: 8,
    vendorReply: null,
    createdAt: '2024-03-10',
  },
  {
    id: 'r-3',
    authorName: 'Emma Rodriguez',
    authorAvatar: null,
    rating: 5,
    title: 'Best cinnamon I\'ve tried',
    content: 'Absolutely love this! The flavor is so much better than regular cinnamon. Worth every penny.',
    isVerified: false,
    helpfulCount: 5,
    vendorReply: null,
    createdAt: '2024-03-05',
  },
];

export function ProductTabs({ product }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<'description' | 'reviews' | 'shipping'>('description');

  const tabs = [
    { id: 'description' as const, label: 'Description' },
    { id: 'reviews' as const, label: `Reviews (${mockReviews.length})` },
    { id: 'shipping' as const, label: 'Shipping Info' },
  ];

  return (
    <div className="mb-12">
      {/* Tab Headers */}
      <div className="border-b border-slate-200 mb-6">
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
        {activeTab === 'description' && (
          <Card>
            <CardContent className="p-6">
              <div className="prose max-w-none">
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {/* Review Summary */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="text-center md:text-left">
                    <div className="text-5xl font-bold text-slate-900 mb-2">
                      {product.averageRating.toFixed(1)}
                    </div>
                    <Rating rating={product.averageRating} size="lg" />
                    <div className="text-sm text-slate-600 mt-2">
                      Based on {product.totalReviews} reviews
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
                            style={{ width: `${Math.random() * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-slate-600 w-12 text-right">
                          {Math.floor(Math.random() * 50)}
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

        {activeTab === 'shipping' && (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">
                    Shipping Options
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-3 border-b border-slate-200">
                      <div>
                        <div className="font-medium text-slate-900">
                          Standard Shipping
                        </div>
                        <div className="text-sm text-slate-600">
                          10-15 business days
                        </div>
                      </div>
                      <div className="font-semibold text-slate-900">$12.00</div>
                    </div>
                    <div className="flex justify-between py-3 border-b border-slate-200">
                      <div>
                        <div className="font-medium text-slate-900">
                          Express Shipping
                        </div>
                        <div className="text-sm text-slate-600">
                          5-7 business days
                        </div>
                      </div>
                      <div className="font-semibold text-slate-900">$28.00</div>
                    </div>
                    <div className="flex justify-between py-3">
                      <div>
                        <div className="font-medium text-slate-900">
                          Priority Air Freight
                        </div>
                        <div className="text-sm text-slate-600">
                          2-3 business days
                        </div>
                      </div>
                      <div className="font-semibold text-slate-900">$65.00</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">
                    Return Policy
                  </h3>
                  <p className="text-slate-700 leading-relaxed">
                    We accept returns within 30 days of delivery. Items must be in original condition with all packaging. Return shipping costs are the responsibility of the buyer unless the item is defective or not as described.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">
                    International Shipping
                  </h3>
                  <p className="text-slate-700 leading-relaxed">
                    We ship to over 50 countries worldwide. Import duties and taxes are the responsibility of the buyer. Estimated customs fees will be calculated at checkout based on your location.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
