'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockVendors } from '@/lib/mock-data';
import { Eye, Shield, Ban, CheckCircle, Search, Star } from 'lucide-react';
import { useState } from 'react';

type KYCStatus = 'APPROVED' | 'PENDING' | 'NOT_SUBMITTED' | 'REJECTED';
type VendorTier = 'GOLD' | 'SILVER' | 'BRONZE';

const extraVendors = [
  {
    id: 'v-4',
    businessName: 'Mumbai Spice Traders',
    ownerName: 'Rajesh Patel',
    country: 'IN',
    kycStatus: 'PENDING' as KYCStatus,
    tier: 'BRONZE' as VendorTier,
    productCount: 23,
    rating: 4.3,
    joinedDate: '2026-03-20',
    logoUrl: null,
  },
  {
    id: 'v-5',
    businessName: 'Colombo Handicrafts',
    ownerName: 'Nimal Fernando',
    country: 'LK',
    kycStatus: 'APPROVED' as KYCStatus,
    tier: 'SILVER' as VendorTier,
    productCount: 45,
    rating: 4.7,
    joinedDate: '2026-02-10',
    logoUrl: null,
  },
  {
    id: 'v-6',
    businessName: 'Kerala Coconut Exports',
    ownerName: 'Suresh Kumar',
    country: 'IN',
    kycStatus: 'REJECTED' as KYCStatus,
    tier: 'BRONZE' as VendorTier,
    productCount: 8,
    rating: 3.9,
    joinedDate: '2026-04-01',
    logoUrl: null,
  },
];

const kycStatusColors = {
  APPROVED: 'success' as const,
  PENDING: 'warning' as const,
  NOT_SUBMITTED: 'default' as const,
  REJECTED: 'destructive' as const,
};

const tierColors = {
  GOLD: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  SILVER: 'bg-slate-200 text-slate-800 border-slate-300',
  BRONZE: 'bg-orange-100 text-orange-800 border-orange-200',
};

export default function AdminVendorsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const allVendors = [
    ...mockVendors.map((v) => ({
      id: v.id,
      businessName: v.businessName,
      ownerName: 'Owner Name',
      country: v.country,
      kycStatus: 'APPROVED' as KYCStatus,
      tier: 'GOLD' as VendorTier,
      productCount: Math.floor(Math.random() * 50) + 10,
      rating: v.averageRating,
      joinedDate: '2025-11-15',
      logoUrl: v.logoUrl,
    })),
    ...extraVendors,
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vendor Management</h1>
          <p className="text-slate-600 mt-1">Manage vendors and verify KYC documents</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-slate-600">Total Vendors</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">42</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-slate-600">Verified</p>
              <p className="text-2xl font-bold text-green-600 mt-1">35</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-slate-600">Pending KYC</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">5</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-slate-600">Suspended</p>
              <p className="text-2xl font-bold text-red-600 mt-1">2</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search vendors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <select className="px-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="">All Countries</option>
                <option value="LK">Sri Lanka</option>
                <option value="IN">India</option>
              </select>
              <select className="px-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="">All KYC Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="not-submitted">Not Submitted</option>
              </select>
              <select className="px-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="">All Tiers</option>
                <option value="gold">Gold</option>
                <option value="silver">Silver</option>
                <option value="bronze">Bronze</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Vendors Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Business
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Country
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      KYC Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Tier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Products
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {allVendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {vendor.businessName.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {vendor.businessName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {vendor.ownerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {vendor.country === 'LK' ? 'Sri Lanka' : 'India'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={kycStatusColors[vendor.kycStatus]}>
                          {vendor.kycStatus.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${tierColors[vendor.tier]}`}
                        >
                          {vendor.tier}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {vendor.productCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm font-medium text-slate-900">
                            {vendor.rating.toFixed(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {new Date(vendor.joinedDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"
                            title="View Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 text-primary-600 hover:bg-primary-50 rounded"
                            title="Verify KYC"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Suspend"
                          >
                            <Ban className="w-4 h-4" />
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
