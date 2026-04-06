'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import {
  DollarSign,
  ShoppingBag,
  Store,
  Package,
  Users,
  Star,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import Link from 'next/link';

interface StatCardProps {
  label: string;
  value: string;
  change: number;
  icon: React.ComponentType<{ className?: string }>;
}

function StatCard({ label, value, change, icon: Icon }: StatCardProps) {
  const isPositive = change >= 0;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600">{label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{value}</p>
            <div className="flex items-center gap-1 mt-2">
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span
                className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}
              >
                {isPositive ? '+' : ''}
                {change}%
              </span>
              <span className="text-sm text-slate-500">vs last month</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const recentOrders = [
  {
    id: '#ORD-2451',
    buyer: 'Sarah Johnson',
    vendor: 'Ceylon Spice Gardens',
    total: 249.99,
    status: 'delivered' as const,
    date: '2026-04-03',
  },
  {
    id: '#ORD-2450',
    buyer: 'Michael Chen',
    vendor: 'Raj Textiles India',
    total: 1299.0,
    status: 'shipped' as const,
    date: '2026-04-03',
  },
  {
    id: '#ORD-2449',
    buyer: 'Emily Watson',
    vendor: 'Lanka Gems Co.',
    total: 4500.0,
    status: 'processing' as const,
    date: '2026-04-02',
  },
  {
    id: '#ORD-2448',
    buyer: 'David Kumar',
    vendor: 'Ceylon Spice Gardens',
    total: 89.5,
    status: 'pending' as const,
    date: '2026-04-02',
  },
  {
    id: '#ORD-2447',
    buyer: 'Lisa Anderson',
    vendor: 'Raj Textiles India',
    total: 675.0,
    status: 'cancelled' as const,
    date: '2026-04-01',
  },
];

const statusColors = {
  delivered: 'success' as const,
  shipped: 'default' as const,
  processing: 'warning' as const,
  pending: 'warning' as const,
  cancelled: 'destructive' as const,
};

const pendingActions = [
  { label: '5 products awaiting review', href: '/admin/products?status=pending' },
  { label: '3 KYC documents to verify', href: '/admin/vendors?kyc=pending' },
  { label: '2 open disputes', href: '/admin/disputes?status=open' },
];

export default function AdminDashboardPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">Overview of your marketplace performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            label="Total Revenue"
            value={formatPrice(124500.0)}
            change={12.5}
            icon={DollarSign}
          />
          <StatCard label="Total Orders" value="1,248" change={8.3} icon={ShoppingBag} />
          <StatCard label="Active Vendors" value="42" change={5.0} icon={Store} />
          <StatCard label="Active Products" value="356" change={-2.1} icon={Package} />
          <StatCard label="Active Buyers" value="2,180" change={15.7} icon={Users} />
          <StatCard label="Pending Reviews" value="12" change={-20.0} icon={Star} />
        </div>

        {/* Recent Orders & Pending Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
                <Link
                  href="/admin/orders"
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-y border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Order
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Buyer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Vendor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="text-sm font-medium text-primary-600 hover:text-primary-700"
                          >
                            {order.id}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {order.buyer}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {order.vendor}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {formatPrice(order.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={statusColors[order.status]}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {new Date(order.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pending Actions */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-900">Pending Actions</h2>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {pendingActions.map((action, index) => (
                  <li key={index}>
                    <Link
                      href={action.href}
                      className="flex items-start justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                    >
                      <span className="text-sm text-slate-900">{action.label}</span>
                      <span className="text-sm font-medium text-primary-600 group-hover:text-primary-700">
                        Review
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
