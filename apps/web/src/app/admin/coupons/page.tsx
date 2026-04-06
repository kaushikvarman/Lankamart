'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { Plus, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

type CouponType = 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING';
type CouponStatus = 'ACTIVE' | 'EXPIRED' | 'DISABLED';

interface Coupon {
  id: string;
  code: string;
  description: string;
  type: CouponType;
  value: number;
  minOrder?: number;
  maxDiscount?: number;
  used: number;
  limit: number;
  status: CouponStatus;
  validUntil: string;
  details?: string;
}

const typeColors = {
  PERCENTAGE: 'bg-blue-100 text-blue-800 border-blue-200',
  FIXED: 'bg-green-100 text-green-800 border-green-200',
  FREE_SHIPPING: 'bg-purple-100 text-purple-800 border-purple-200',
};

const statusColors = {
  ACTIVE: 'success' as const,
  EXPIRED: 'destructive' as const,
  DISABLED: 'default' as const,
};

const mockCoupons: Coupon[] = [
  {
    id: 'c-1',
    code: 'SUMMER20',
    description: '20% off summer sale',
    type: 'PERCENTAGE',
    value: 20,
    minOrder: 50,
    used: 145,
    limit: 500,
    status: 'ACTIVE',
    validUntil: '2026-07-31',
    details: 'Valid for all categories except electronics. Cannot be combined with other offers.',
  },
  {
    id: 'c-2',
    code: 'WELCOME10',
    description: '$10 off first order',
    type: 'FIXED',
    value: 10,
    used: 892,
    limit: 1000,
    status: 'ACTIVE',
    validUntil: '2026-12-31',
    details: 'One-time use per customer. Valid for new customers only.',
  },
  {
    id: 'c-3',
    code: 'FREESHIP',
    description: 'Free shipping on orders over $100',
    type: 'FREE_SHIPPING',
    value: 0,
    minOrder: 100,
    used: 56,
    limit: 200,
    status: 'ACTIVE',
    validUntil: '2026-06-30',
    details: 'Applies to standard shipping only. International orders excluded.',
  },
  {
    id: 'c-4',
    code: 'FLASH50',
    description: '50% off flash sale',
    type: 'PERCENTAGE',
    value: 50,
    minOrder: 200,
    maxDiscount: 100,
    used: 200,
    limit: 200,
    status: 'EXPIRED',
    validUntil: '2026-03-31',
    details: 'Limited time flash sale. Maximum discount capped at $100.',
  },
  {
    id: 'c-5',
    code: 'NEWVENDOR',
    description: '15% off for new vendor products',
    type: 'PERCENTAGE',
    value: 15,
    used: 12,
    limit: 50,
    status: 'ACTIVE',
    validUntil: '2026-08-31',
    details: 'Applies only to products from vendors who joined in the last 30 days.',
  },
];

export default function AdminCouponsPage() {
  const [expandedCoupon, setExpandedCoupon] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedCoupon(expandedCoupon === id ? null : id);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Coupon Management</h1>
            <p className="text-slate-600 mt-1">Create and manage discount coupons</p>
          </div>
          <Button>
            <Plus className="w-4 h-4" />
            Create Coupon
          </Button>
        </div>

        {/* Coupons Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Min Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Valid Until
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {mockCoupons.map((coupon) => (
                    <>
                      <tr key={coupon.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleExpand(coupon.id)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              {expandedCoupon === coupon.id ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                            <span className="text-sm font-mono font-semibold text-slate-900">
                              {coupon.code}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{coupon.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${typeColors[coupon.type]}`}
                          >
                            {coupon.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {coupon.type === 'PERCENTAGE'
                            ? `${coupon.value}%`
                            : coupon.type === 'FIXED'
                              ? formatPrice(coupon.value)
                              : 'Free'}
                          {coupon.maxDiscount && (
                            <span className="text-xs text-slate-500 ml-1">
                              (max {formatPrice(coupon.maxDiscount)})
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {coupon.minOrder ? formatPrice(coupon.minOrder) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-900 font-medium">{coupon.used}</span>
                            <span className="text-sm text-slate-500">/ {coupon.limit}</span>
                            <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary-600 rounded-full"
                                style={{ width: `${(coupon.used / coupon.limit) * 100}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={statusColors[coupon.status]}>{coupon.status}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {new Date(coupon.validUntil).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              className="p-1.5 text-primary-600 hover:bg-primary-50 rounded"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"
                              title={coupon.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                            >
                              {coupon.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedCoupon === coupon.id && (
                        <tr key={`${coupon.id}-details`}>
                          <td colSpan={9} className="px-6 py-4 bg-slate-50">
                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold text-slate-900">
                                Coupon Details
                              </h4>
                              <p className="text-sm text-slate-600">{coupon.details}</p>
                              <div className="grid grid-cols-3 gap-4 mt-3">
                                <div>
                                  <p className="text-xs font-medium text-slate-500">Usage Rate</p>
                                  <p className="text-sm font-semibold text-slate-900 mt-1">
                                    {((coupon.used / coupon.limit) * 100).toFixed(1)}%
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-slate-500">
                                    Remaining Uses
                                  </p>
                                  <p className="text-sm font-semibold text-slate-900 mt-1">
                                    {coupon.limit - coupon.used}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-slate-500">
                                    Days Until Expiry
                                  </p>
                                  <p className="text-sm font-semibold text-slate-900 mt-1">
                                    {Math.max(
                                      0,
                                      Math.ceil(
                                        (new Date(coupon.validUntil).getTime() -
                                          new Date().getTime()) /
                                          (1000 * 60 * 60 * 24)
                                      )
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
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
