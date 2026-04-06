'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockCategories } from '@/lib/mock-data';
import { useState } from 'react';

export function ProductFilters() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [minRating, setMinRating] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const toggleCategory = (slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [...prev, slug]
    );
  };

  return (
    <div className="space-y-6">
      {/* Categories */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-slate-900">Categories</h3>
        </CardHeader>
        <CardContent className="space-y-2">
          {mockCategories.map((category) => (
            <label
              key={category.id}
              className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded-md transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedCategories.includes(category.slug)}
                onChange={() => toggleCategory(category.slug)}
                className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-slate-700">{category.name}</span>
            </label>
          ))}
        </CardContent>
      </Card>

      {/* Price Range */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-slate-900">Price Range</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={priceRange[0]}
              onChange={(e) => setPriceRange([+e.target.value, priceRange[1] || 1000])}
              placeholder="Min"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <span className="text-slate-500">-</span>
            <input
              type="number"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0] || 0, +e.target.value])}
              placeholder="Max"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <input
            type="range"
            min="0"
            max="1000"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0] || 0, +e.target.value])}
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Rating */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-slate-900">Minimum Rating</h3>
        </CardHeader>
        <CardContent className="space-y-2">
          {[4, 3, 2, 1].map((rating) => (
            <label
              key={rating}
              className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded-md transition-colors"
            >
              <input
                type="radio"
                name="rating"
                checked={minRating === rating}
                onChange={() => setMinRating(rating)}
                className="w-4 h-4 text-primary-600 border-slate-300 focus:ring-primary-500"
              />
              <div className="flex items-center gap-1">
                {Array.from({ length: rating }, (_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
                <span className="text-sm text-slate-700 ml-1">& Up</span>
              </div>
            </label>
          ))}
        </CardContent>
      </Card>

      {/* Verified Vendors */}
      <Card>
        <CardContent className="p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
            />
            <div>
              <div className="font-medium text-slate-900 text-sm">
                Verified Vendors Only
              </div>
              <div className="text-xs text-slate-600">
                Show only verified sellers
              </div>
            </div>
          </label>
        </CardContent>
      </Card>

      {/* Clear Filters */}
      <button
        onClick={() => {
          setSelectedCategories([]);
          setPriceRange([0, 1000]);
          setMinRating(0);
          setVerifiedOnly(false);
        }}
        className="w-full py-2 px-4 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-md transition-colors"
      >
        Clear All Filters
      </button>
    </div>
  );
}
