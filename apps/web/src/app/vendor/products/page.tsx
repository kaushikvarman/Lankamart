'use client';

import { VendorLayout } from '@/components/vendor/vendor-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/utils';
import { mockProducts } from '@/lib/mock-data';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Plus, Edit, Eye, Trash2, Star } from 'lucide-react';
import { useState } from 'react';

type ProductStatus = 'all' | 'active' | 'draft' | 'pending';

const vendor1Products = mockProducts.filter((p) => p.vendorId === 'v-1');

const additionalProducts = [
  {
    id: 'p-draft-1',
    name: 'Premium Turmeric Powder',
    sku: 'TUR-PRE-100',
    categoryName: 'Tea & Spices',
    basePrice: 15.99,
    stock: 0,
    status: 'DRAFT' as const,
    averageRating: 0,
    totalReviews: 0,
    imageUrl: 'https://images.unsplash.com/photo-1615485500834-bc10199bc768?w=400&h=400&fit=crop',
  },
  {
    id: 'p-pending-1',
    name: 'Organic Ceylon Green Tea',
    sku: 'TEA-GRN-100',
    categoryName: 'Tea & Spices',
    basePrice: 22.50,
    stock: 500,
    status: 'PENDING_REVIEW' as const,
    averageRating: 0,
    totalReviews: 0,
    imageUrl: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&h=400&fit=crop',
  },
];

export default function VendorProductsPage() {
  const [activeTab, setActiveTab] = useState<ProductStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const allProducts = [
    ...vendor1Products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.variants[0]?.sku || 'N/A',
      categoryName: p.category?.name || 'Uncategorized',
      basePrice: p.basePrice,
      stock: p.variants.reduce((sum, v) => sum + v.stock, 0),
      status: p.status,
      averageRating: p.averageRating,
      totalReviews: p.totalReviews,
      imageUrl: p.images[0]?.url || '',
    })),
    ...additionalProducts,
  ];

  const filteredProducts = allProducts.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'active') return matchesSearch && p.status === 'ACTIVE';
    if (activeTab === 'draft') return matchesSearch && p.status === 'DRAFT';
    if (activeTab === 'pending') return matchesSearch && p.status === 'PENDING_REVIEW';
    return matchesSearch;
  });

  const counts = {
    all: allProducts.length,
    active: allProducts.filter((p) => p.status === 'ACTIVE').length,
    draft: allProducts.filter((p) => p.status === 'DRAFT').length,
    pending: allProducts.filter((p) => p.status === 'PENDING_REVIEW').length,
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'outline'> = {
      ACTIVE: 'success',
      DRAFT: 'default',
      PENDING_REVIEW: 'warning',
    };
    const labels: Record<string, string> = {
      ACTIVE: 'Active',
      DRAFT: 'Draft',
      PENDING_REVIEW: 'Pending Review',
    };
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>;
  };

  return (
    <VendorLayout pageTitle="Products">
      <div className="space-y-6">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <Input
            placeholder="Search products..."
            icon={<Search size={18} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-80"
          />
          <Link href="/vendor/products/new">
            <Button>
              <Plus size={18} />
              Add Product
            </Button>
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="border-b border-slate-200">
          <nav className="flex gap-8">
            {[
              { key: 'all', label: 'All' },
              { key: 'active', label: 'Active' },
              { key: 'draft', label: 'Draft' },
              { key: 'pending', label: 'Pending Review' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as ProductStatus)}
                className={`pb-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label} ({counts[tab.key as keyof typeof counts]})
              </button>
            ))}
          </nav>
        </div>

        {/* Products Table - Desktop */}
        <Card className="hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-md overflow-hidden bg-slate-100 shrink-0">
                          {product.imageUrl && (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          )}
                        </div>
                        <span className="font-medium text-slate-900 line-clamp-2">
                          {product.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{product.sku}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{product.categoryName}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {formatPrice(product.basePrice)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <span
                        className={
                          product.stock < 20 ? 'text-amber-600 font-medium' : ''
                        }
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(product.status)}</td>
                    <td className="px-6 py-4">
                      {product.totalReviews > 0 ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Star size={14} className="fill-yellow-400 text-yellow-400" />
                          <span className="font-medium text-slate-900">
                            {product.averageRating.toFixed(1)}
                          </span>
                          <span className="text-slate-500">({product.totalReviews})</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">No reviews</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-slate-100 rounded-md text-slate-600 hover:text-primary-600">
                          <Edit size={16} />
                        </button>
                        <button className="p-2 hover:bg-slate-100 rounded-md text-slate-600 hover:text-primary-600">
                          <Eye size={16} />
                        </button>
                        <button className="p-2 hover:bg-slate-100 rounded-md text-slate-600 hover:text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Products Cards - Mobile */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="p-4">
              <div className="flex gap-4">
                <div className="relative w-20 h-20 rounded-md overflow-hidden bg-slate-100 shrink-0">
                  {product.imageUrl && (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-900 line-clamp-2">{product.name}</h3>
                  <p className="text-sm text-slate-600 mt-1">SKU: {product.sku}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {getStatusBadge(product.status)}
                    {product.totalReviews > 0 && (
                      <div className="flex items-center gap-1 text-sm">
                        <Star size={12} className="fill-yellow-400 text-yellow-400" />
                        <span className="font-medium text-slate-900">
                          {product.averageRating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                <div>
                  <p className="text-sm text-slate-600">Price</p>
                  <p className="font-semibold text-slate-900">{formatPrice(product.basePrice)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Stock</p>
                  <p
                    className={`font-semibold ${
                      product.stock < 20 ? 'text-amber-600' : 'text-slate-900'
                    }`}
                  >
                    {product.stock}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-slate-100 rounded-md text-slate-600">
                    <Edit size={18} />
                  </button>
                  <button className="p-2 hover:bg-slate-100 rounded-md text-slate-600">
                    <Eye size={18} />
                  </button>
                  <button className="p-2 hover:bg-slate-100 rounded-md text-slate-600">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-600">No products found</p>
          </div>
        )}
      </div>
    </VendorLayout>
  );
}
