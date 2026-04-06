'use client';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import { Package, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface MockOrder {
  id: string;
  orderNumber: string;
  status: 'Delivered' | 'Shipped' | 'Processing' | 'Cancelled';
  itemCount: number;
  total: number;
  placedDate: string;
  placedAgo: string;
}

const mockOrders: MockOrder[] = [
  {
    id: 'LM-20260401-0001',
    orderNumber: 'LM-20260401-0001',
    status: 'Delivered',
    itemCount: 2,
    total: 323.99,
    placedDate: '2026-04-01',
    placedAgo: '5 days ago',
  },
  {
    id: 'LM-20260404-0042',
    orderNumber: 'LM-20260404-0042',
    status: 'Shipped',
    itemCount: 1,
    total: 45.00,
    placedDate: '2026-04-04',
    placedAgo: '2 days ago',
  },
  {
    id: 'LM-20260406-0089',
    orderNumber: 'LM-20260406-0089',
    status: 'Processing',
    itemCount: 3,
    total: 156.47,
    placedDate: '2026-04-06',
    placedAgo: 'today',
  },
];

const statusColors = {
  Delivered: 'bg-green-100 text-green-800 border-green-200',
  Shipped: 'bg-blue-100 text-blue-800 border-blue-200',
  Processing: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Cancelled: 'bg-red-100 text-red-800 border-red-200',
};

export default function OrdersPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-slate-50 py-8">
        <div className="container-wide">
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900">My Orders</h1>
            <p className="text-slate-600 mt-1">View and track your order history</p>
          </div>

          {/* Orders List */}
          {mockOrders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="mb-6 flex justify-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                    <Package className="w-10 h-10 text-slate-400" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">No orders yet</h2>
                <p className="text-slate-600 mb-6">
                  You haven&apos;t placed any orders yet. Start shopping to see your orders here.
                </p>
                <Button asChild size="lg">
                  <Link href="/products">Start Shopping</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {mockOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      {/* Order Info */}
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg text-slate-900">
                            {order.orderNumber}
                          </h3>
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full border ${statusColors[order.status]}`}
                          >
                            {order.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                          <span>Placed {order.placedAgo}</span>
                          <span>{order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}</span>
                          <span className="font-semibold text-slate-900">
                            {formatPrice(order.total)}
                          </span>
                        </div>
                      </div>

                      {/* View Details Button */}
                      <Button asChild variant="outline">
                        <Link href={`/orders/${order.id}`}>
                          View Details
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
