'use client';

import { VendorLayout } from '@/components/vendor/vendor-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { TrendingUp, DollarSign, ShoppingBag, Star, Package, AlertTriangle } from 'lucide-react';

const statsCards = [
  {
    label: 'Total Revenue',
    value: formatPrice(12450.00),
    change: '+12.5%',
    trend: 'up',
    icon: DollarSign,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    label: 'Total Orders',
    value: '48',
    change: '+8.3%',
    trend: 'up',
    icon: ShoppingBag,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    label: 'Active Products',
    value: '8',
    change: '',
    trend: '',
    icon: Package,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    label: 'Average Rating',
    value: '4.8/5',
    change: '',
    trend: '',
    icon: Star,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
];

const recentOrders = [
  {
    id: '#ORD-1234',
    customer: 'John Williams',
    items: 3,
    total: 189.97,
    status: 'pending',
    date: '2026-04-05',
  },
  {
    id: '#ORD-1233',
    customer: 'Sarah Johnson',
    items: 1,
    total: 24.99,
    status: 'processing',
    date: '2026-04-05',
  },
  {
    id: '#ORD-1232',
    customer: 'Michael Chen',
    items: 2,
    total: 74.98,
    status: 'shipped',
    date: '2026-04-04',
  },
  {
    id: '#ORD-1231',
    customer: 'Emily Davis',
    items: 5,
    total: 324.95,
    status: 'delivered',
    date: '2026-04-03',
  },
  {
    id: '#ORD-1230',
    customer: 'Robert Taylor',
    items: 1,
    total: 18.50,
    status: 'delivered',
    date: '2026-04-02',
  },
];

const lowStockItems = [
  { name: 'Natural Blue Sapphire 2.5ct', stock: 3 },
  { name: 'Wooden Elephant Large', stock: 12 },
];

const revenueData = [
  { day: 'Mon', amount: 420 },
  { day: 'Tue', amount: 380 },
  { day: 'Wed', amount: 520 },
  { day: 'Thu', amount: 450 },
  { day: 'Fri', amount: 600 },
  { day: 'Sat', amount: 750 },
  { day: 'Sun', amount: 680 },
];

const getStatusBadge = (status: string) => {
  const variants: Record<string, 'default' | 'warning' | 'success' | 'outline'> = {
    pending: 'warning',
    processing: 'outline',
    shipped: 'default',
    delivered: 'success',
  };
  return (
    <Badge variant={variants[status] || 'default'}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

export default function VendorDashboardPage() {
  const maxRevenue = Math.max(...revenueData.map(d => d.amount));

  return (
    <VendorLayout pageTitle="Dashboard">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-slate-900 mt-2">{stat.value}</p>
                      {stat.change && (
                        <div className="flex items-center gap-1 mt-2">
                          <TrendingUp size={14} className={stat.color} />
                          <span className={`text-sm font-medium ${stat.color}`}>
                            {stat.change}
                          </span>
                          <span className="text-xs text-slate-500">from last month</span>
                        </div>
                      )}
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <Icon size={24} className={stat.color} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Revenue — Last 7 Days</h2>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-2 h-48">
              {revenueData.map((item) => (
                <div key={item.day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex items-end justify-center h-40">
                    <div
                      className="bg-primary-500 hover:bg-primary-600 transition-colors rounded-t-md w-full cursor-pointer"
                      style={{ height: `${(item.amount / maxRevenue) * 100}%` }}
                      title={formatPrice(item.amount)}
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-slate-600">{item.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-t border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Order
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Items
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {order.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                          {order.customer}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                          {order.items}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {formatPrice(order.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {order.date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Alerts */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <AlertTriangle size={20} className="text-amber-600" />
                Low Stock Alerts
              </h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lowStockItems.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-start justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{item.name}</p>
                      <p className="text-xs text-amber-700 mt-1">
                        Only {item.stock} left in stock
                      </p>
                    </div>
                    <Badge variant="warning" className="shrink-0">
                      Low
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </VendorLayout>
  );
}
