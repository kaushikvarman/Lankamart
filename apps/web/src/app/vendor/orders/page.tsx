'use client';

import { VendorLayout } from '@/components/vendor/vendor-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { useState } from 'react';

type OrderStatus = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered';

interface OrderItem {
  productName: string;
  variant: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  date: string;
}

const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: '#ORD-1234',
    customerName: 'John Williams',
    items: [
      { productName: 'Premium Ceylon Cinnamon', variant: '100g Pack', quantity: 2, price: 24.99 },
      { productName: 'Organic Ceylon Black Tea', variant: '250g Tin', quantity: 1, price: 39.99 },
    ],
    total: 89.97,
    status: 'pending',
    date: '2026-04-05',
  },
  {
    id: '2',
    orderNumber: '#ORD-1233',
    customerName: 'Sarah Johnson',
    items: [
      { productName: 'Virgin Coconut Oil', variant: '500ml Bottle', quantity: 3, price: 12.99 },
    ],
    total: 38.97,
    status: 'pending',
    date: '2026-04-05',
  },
  {
    id: '3',
    orderNumber: '#ORD-1232',
    customerName: 'Michael Chen',
    items: [
      { productName: 'Ayurvedic Hair Oil', variant: '200ml Bottle', quantity: 2, price: 16.99 },
    ],
    total: 33.98,
    status: 'pending',
    date: '2026-04-05',
  },
  {
    id: '4',
    orderNumber: '#ORD-1231',
    customerName: 'Emily Davis',
    items: [
      { productName: 'Premium Ceylon Cinnamon', variant: '250g Pack', quantity: 1, price: 49.99 },
      { productName: 'Wooden Elephant', variant: 'Small (15cm)', quantity: 2, price: 89.00 },
    ],
    total: 227.99,
    status: 'processing',
    date: '2026-04-04',
  },
  {
    id: '5',
    orderNumber: '#ORD-1230',
    customerName: 'Robert Taylor',
    items: [
      { productName: 'Organic Ceylon Black Tea', variant: '100g Tin', quantity: 4, price: 18.50 },
    ],
    total: 74.00,
    status: 'processing',
    date: '2026-04-04',
  },
  {
    id: '6',
    orderNumber: '#ORD-1229',
    customerName: 'Lisa Anderson',
    items: [
      { productName: 'Virgin Coconut Oil', variant: '1 Litre Bottle', quantity: 2, price: 22.99 },
      { productName: 'Ayurvedic Hair Oil', variant: '200ml Bottle', quantity: 1, price: 16.99 },
    ],
    total: 62.97,
    status: 'processing',
    date: '2026-04-04',
  },
  {
    id: '7',
    orderNumber: '#ORD-1228',
    customerName: 'David Martinez',
    items: [
      { productName: 'Premium Ceylon Cinnamon', variant: '1kg Bulk', quantity: 1, price: 149.99 },
    ],
    total: 149.99,
    status: 'processing',
    date: '2026-04-03',
  },
  {
    id: '8',
    orderNumber: '#ORD-1227',
    customerName: 'Jennifer White',
    items: [
      { productName: 'Wooden Elephant', variant: 'Large (30cm)', quantity: 1, price: 189.00 },
    ],
    total: 189.00,
    status: 'shipped',
    date: '2026-04-03',
  },
  {
    id: '9',
    orderNumber: '#ORD-1226',
    customerName: 'Thomas Brown',
    items: [
      { productName: 'Organic Ceylon Black Tea', variant: '100g Tin', quantity: 5, price: 18.50 },
    ],
    total: 92.50,
    status: 'shipped',
    date: '2026-04-02',
  },
  {
    id: '10',
    orderNumber: '#ORD-1225',
    customerName: 'Amanda Wilson',
    items: [
      { productName: 'Virgin Coconut Oil', variant: '500ml Bottle', quantity: 6, price: 12.99 },
    ],
    total: 77.94,
    status: 'shipped',
    date: '2026-04-02',
  },
  {
    id: '11',
    orderNumber: '#ORD-1224',
    customerName: 'Christopher Lee',
    items: [
      { productName: 'Premium Ceylon Cinnamon', variant: '100g Pack', quantity: 3, price: 24.99 },
      { productName: 'Ayurvedic Hair Oil', variant: '200ml Bottle', quantity: 2, price: 16.99 },
    ],
    total: 108.95,
    status: 'delivered',
    date: '2026-04-01',
  },
  {
    id: '12',
    orderNumber: '#ORD-1223',
    customerName: 'Patricia Garcia',
    items: [
      { productName: 'Wooden Elephant', variant: 'Small (15cm)', quantity: 1, price: 89.00 },
    ],
    total: 89.00,
    status: 'delivered',
    date: '2026-03-31',
  },
];

export default function VendorOrdersPage() {
  const [activeTab, setActiveTab] = useState<OrderStatus>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const filteredOrders = mockOrders.filter((order) => {
    if (activeTab === 'all') return true;
    return order.status === activeTab;
  });

  const counts = {
    all: mockOrders.length,
    pending: mockOrders.filter((o) => o.status === 'pending').length,
    processing: mockOrders.filter((o) => o.status === 'processing').length,
    shipped: mockOrders.filter((o) => o.status === 'shipped').length,
    delivered: mockOrders.filter((o) => o.status === 'delivered').length,
  };

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

  const getActionButton = (status: string) => {
    if (status === 'pending') {
      return (
        <Button size="sm" variant="primary">
          Confirm Order
        </Button>
      );
    }
    if (status === 'processing') {
      return (
        <Button size="sm" variant="primary">
          Mark as Shipped
        </Button>
      );
    }
    return (
      <Button size="sm" variant="outline">
        <Eye size={16} />
        View
      </Button>
    );
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  return (
    <VendorLayout pageTitle="Orders">
      <div className="space-y-6">
        {/* Filter Tabs */}
        <div className="border-b border-slate-200">
          <nav className="flex gap-8">
            {[
              { key: 'all', label: 'All Orders' },
              { key: 'pending', label: 'Pending' },
              { key: 'processing', label: 'Processing' },
              { key: 'shipped', label: 'Shipped' },
              { key: 'delivered', label: 'Delivered' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as OrderStatus)}
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

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            return (
              <Card key={order.id}>
                <div className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-6 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <p className="text-sm text-slate-600">Order</p>
                        <p className="font-semibold text-slate-900">{order.orderNumber}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <p className="text-sm text-slate-600">Customer</p>
                        <p className="font-medium text-slate-900">{order.customerName}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <p className="text-sm text-slate-600">Items</p>
                        <p className="font-medium text-slate-900">{order.items.length}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <p className="text-sm text-slate-600">Total</p>
                        <p className="font-semibold text-slate-900">{formatPrice(order.total)}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <p className="text-sm text-slate-600">Status</p>
                        <div className="mt-1">{getStatusBadge(order.status)}</div>
                      </div>
                      <div className="flex-shrink-0">
                        <p className="text-sm text-slate-600">Date</p>
                        <p className="font-medium text-slate-900">{order.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {getActionButton(order.status)}
                      <button
                        onClick={() => toggleExpand(order.id)}
                        className="p-2 hover:bg-slate-100 rounded-md text-slate-600"
                      >
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Order Details */}
                  {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-slate-200">
                      <h3 className="text-sm font-semibold text-slate-900 mb-4">Order Items</h3>
                      <div className="space-y-3">
                        {order.items.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-slate-900">{item.productName}</p>
                              <p className="text-sm text-slate-600 mt-1">{item.variant}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-slate-600">Quantity: {item.quantity}</p>
                              <p className="font-semibold text-slate-900">
                                {formatPrice(item.price * item.quantity)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end mt-4 pt-4 border-t border-slate-200">
                        <div className="text-right">
                          <p className="text-sm text-slate-600">Order Total</p>
                          <p className="text-xl font-bold text-slate-900">
                            {formatPrice(order.total)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-600">No orders found</p>
          </div>
        )}
      </div>
    </VendorLayout>
  );
}
