'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { Eye, X, Search } from 'lucide-react';
import { useState } from 'react';

type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
type PaymentStatus = 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED';

const orderStatusColors = {
  PENDING: 'warning' as const,
  PROCESSING: 'bg-blue-100 text-blue-800 border-blue-200',
  SHIPPED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  DELIVERED: 'success' as const,
  CANCELLED: 'destructive' as const,
};

const paymentStatusColors = {
  COMPLETED: 'success' as const,
  PENDING: 'warning' as const,
  FAILED: 'destructive' as const,
  REFUNDED: 'bg-blue-100 text-blue-800 border-blue-200',
};

const mockOrders = [
  {
    id: '#ORD-2451',
    buyer: 'Sarah Johnson',
    vendors: 'Ceylon Spice Gardens',
    total: 249.99,
    paymentStatus: 'COMPLETED' as PaymentStatus,
    orderStatus: 'DELIVERED' as OrderStatus,
    date: '2026-04-03',
  },
  {
    id: '#ORD-2450',
    buyer: 'Michael Chen',
    vendors: 'Raj Textiles India',
    total: 1299.0,
    paymentStatus: 'COMPLETED' as PaymentStatus,
    orderStatus: 'SHIPPED' as OrderStatus,
    date: '2026-04-03',
  },
  {
    id: '#ORD-2449',
    buyer: 'Emily Watson',
    vendors: 'Lanka Gems Co.',
    total: 4500.0,
    paymentStatus: 'COMPLETED' as PaymentStatus,
    orderStatus: 'PROCESSING' as OrderStatus,
    date: '2026-04-02',
  },
  {
    id: '#ORD-2448',
    buyer: 'David Kumar',
    vendors: 'Ceylon Spice Gardens',
    total: 89.5,
    paymentStatus: 'PENDING' as PaymentStatus,
    orderStatus: 'PENDING' as OrderStatus,
    date: '2026-04-02',
  },
  {
    id: '#ORD-2447',
    buyer: 'Lisa Anderson',
    vendors: 'Raj Textiles India',
    total: 675.0,
    paymentStatus: 'REFUNDED' as PaymentStatus,
    orderStatus: 'CANCELLED' as OrderStatus,
    date: '2026-04-01',
  },
  {
    id: '#ORD-2446',
    buyer: 'James Wilson',
    vendors: 'Ceylon Spice Gardens, Lanka Gems Co.',
    total: 5234.5,
    paymentStatus: 'COMPLETED' as PaymentStatus,
    orderStatus: 'DELIVERED' as OrderStatus,
    date: '2026-03-30',
  },
  {
    id: '#ORD-2445',
    buyer: 'Maria Garcia',
    vendors: 'Raj Textiles India',
    total: 899.0,
    paymentStatus: 'FAILED' as PaymentStatus,
    orderStatus: 'CANCELLED' as OrderStatus,
    date: '2026-03-29',
  },
  {
    id: '#ORD-2444',
    buyer: 'Robert Brown',
    vendors: 'Ceylon Spice Gardens',
    total: 156.8,
    paymentStatus: 'COMPLETED' as PaymentStatus,
    orderStatus: 'SHIPPED' as OrderStatus,
    date: '2026-03-28',
  },
];

export default function AdminOrdersPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Order Management</h1>
          <p className="text-slate-600 mt-1">Monitor and manage all marketplace orders</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-slate-600">Total Orders</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">1,248</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-slate-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">45</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-slate-600">Processing</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">120</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-slate-600">Shipped</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">89</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-slate-600">Delivered</p>
              <p className="text-2xl font-bold text-green-600 mt-1">980</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-slate-600">Cancelled</p>
              <p className="text-2xl font-bold text-red-600 mt-1">14</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <input
                type="date"
                placeholder="From Date"
                className="px-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <input
                type="date"
                placeholder="To Date"
                className="px-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <select className="px-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="">All Order Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select className="px-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="">All Payment Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Order #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Buyer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Vendor(s)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Payment Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Order Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {mockOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-primary-600">{order.id}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {order.buyer}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                        {order.vendors}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.paymentStatus === 'COMPLETED' || order.paymentStatus === 'PENDING' || order.paymentStatus === 'FAILED' ? (
                          <Badge variant={paymentStatusColors[order.paymentStatus]}>
                            {order.paymentStatus}
                          </Badge>
                        ) : (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${paymentStatusColors[order.paymentStatus]}`}
                          >
                            {order.paymentStatus}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.orderStatus === 'DELIVERED' || order.orderStatus === 'PENDING' || order.orderStatus === 'CANCELLED' ? (
                          <Badge variant={orderStatusColors[order.orderStatus]}>
                            {order.orderStatus}
                          </Badge>
                        ) : (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${orderStatusColors[order.orderStatus]}`}
                          >
                            {order.orderStatus}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {new Date(order.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Cancel Order"
                            disabled={order.orderStatus === 'DELIVERED' || order.orderStatus === 'CANCELLED'}
                          >
                            <X className="w-4 h-4" />
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
