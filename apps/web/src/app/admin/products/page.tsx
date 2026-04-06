'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { mockProducts } from '@/lib/mock-data';
import { formatPrice } from '@/lib/utils';
import { Check, X, Eye, Search, Filter } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

type ProductStatus = 'all' | 'pending' | 'active' | 'rejected' | 'paused';

const extraPendingProducts = [
  {
    id: 'p-pending-1',
    name: 'Organic Turmeric Powder - Premium Grade',
    vendorName: 'Ceylon Spice Gardens',
    category: 'Tea & Spices',
    price: 15.99,
    status: 'PENDING' as const,
    dateSubmitted: '2026-04-04',
    imageUrl: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=800&h=800&fit=crop',
  },
  {
    id: 'p-pending-2',
    name: 'Handwoven Pashmina Shawl',
    vendorName: 'Raj Textiles India',
    category: 'Textiles & Apparel',
    price: 189.0,
    status: 'PENDING' as const,
    dateSubmitted: '2026-04-03',
    imageUrl: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800&h=800&fit=crop',
  },
];

const tabCounts = {
  all: 356,
  pending: 5,
  active: 320,
  rejected: 8,
  paused: 23,
};

export default function AdminProductsPage() {
  const [activeTab, setActiveTab] = useState<ProductStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [approvedProducts, setApprovedProducts] = useState<Set<string>>(new Set());
  const [rejectedProducts, setRejectedProducts] = useState<Set<string>>(new Set());

  const handleApprove = (productId: string) => {
    setApprovedProducts((prev) => new Set(prev).add(productId));
    setRejectedProducts((prev) => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
  };

  const handleReject = (productId: string) => {
    setRejectedProducts((prev) => new Set(prev).add(productId));
    setApprovedProducts((prev) => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
  };

  const allProducts = [
    ...extraPendingProducts,
    ...mockProducts.map((p) => ({
      id: p.id,
      name: p.name,
      vendorName: p.vendor?.businessName || 'Unknown',
      category: p.category?.name || 'Uncategorized',
      price: p.basePrice,
      status: p.status,
      dateSubmitted: '2026-03-15',
      imageUrl: p.images[0]?.url || '',
    })),
  ];

  const tabs: { key: ProductStatus; label: string }[] = [
    { key: 'all', label: `All Products (${tabCounts.all})` },
    { key: 'pending', label: `Pending Review (${tabCounts.pending})` },
    { key: 'active', label: `Active (${tabCounts.active})` },
    { key: 'rejected', label: `Rejected (${tabCounts.rejected})` },
    { key: 'paused', label: `Paused (${tabCounts.paused})` },
  ];

  const getStatusVariant = (status: string, productId: string) => {
    if (approvedProducts.has(productId)) return 'success';
    if (rejectedProducts.has(productId)) return 'destructive';

    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
        return 'destructive';
      case 'PAUSED':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string, productId: string) => {
    if (approvedProducts.has(productId)) return 'Approved';
    if (rejectedProducts.has(productId)) return 'Rejected';
    return status.charAt(0) + status.slice(1).toLowerCase();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Product Moderation</h1>
          <p className="text-slate-600 mt-1">Review and manage product listings</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200">
          <div className="flex gap-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-1 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <select className="px-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="">All Categories</option>
                <option value="tea-spices">Tea & Spices</option>
                <option value="textiles">Textiles & Apparel</option>
                <option value="gems">Gems & Jewellery</option>
              </select>
              <select className="px-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="">All Vendors</option>
                <option value="v-1">Ceylon Spice Gardens</option>
                <option value="v-2">Raj Textiles India</option>
                <option value="v-3">Lanka Gems Co.</option>
              </select>
              <select className="px-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="rejected">Rejected</option>
                <option value="paused">Paused</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Date Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {allProducts.slice(0, 10).map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-md overflow-hidden bg-slate-100 flex-shrink-0">
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              width={48}
                              height={48}
                              unoptimized
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate max-w-xs">
                              {product.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {product.vendorName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {product.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {formatPrice(product.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getStatusVariant(product.status, product.id) as 'default' | 'success' | 'warning' | 'destructive' | 'outline'}>
                          {getStatusText(product.status, product.id)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {new Date(product.dateSubmitted).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(product.id)}
                            disabled={approvedProducts.has(product.id)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(product.id)}
                            disabled={rejectedProducts.has(product.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
