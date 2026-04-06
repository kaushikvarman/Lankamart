'use client';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import { ChevronRight, Package, Truck, CheckCircle, Clock, MapPin, CreditCard, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { use } from 'react';

interface OrderItem {
  id: string;
  productName: string;
  variantName: string;
  imageUrl: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface OrderDetails {
  orderNumber: string;
  status: 'Delivered' | 'Shipped' | 'Processing' | 'Placed' | 'Confirmed';
  placedDate: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  paymentMethod: string;
  trackingNumber?: string;
}

// Mock order data
const mockOrderDetails: OrderDetails = {
  orderNumber: 'LM-20260401-0001',
  status: 'Delivered',
  placedDate: 'April 1, 2026',
  items: [
    {
      id: '1',
      productName: 'Premium Ceylon Cinnamon Sticks - Grade Alba',
      variantName: '250g Pack',
      imageUrl: 'https://images.unsplash.com/photo-1599909533706-bfa4f0b1cd4f?w=800&h=800&fit=crop',
      quantity: 2,
      unitPrice: 49.99,
      total: 99.98,
    },
    {
      id: '2',
      productName: 'Handloom Silk Saree - Kanchipuram Collection',
      variantName: 'Royal Red',
      imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&h=800&fit=crop',
      quantity: 1,
      unitPrice: 299.00,
      total: 299.00,
    },
  ],
  subtotal: 398.98,
  shipping: 24.99,
  tax: 19.95,
  total: 443.92,
  shippingAddress: {
    name: 'John Doe',
    line1: '123 Main Street',
    line2: 'Apt 4B',
    city: 'Colombo',
    state: 'Western Province',
    postalCode: '00100',
    country: 'Sri Lanka',
    phone: '+94 77 123 4567',
  },
  paymentMethod: 'Credit Card ending in 4242',
  trackingNumber: 'TRK1234567890',
};

const orderSteps = [
  { id: 'placed', label: 'Placed', icon: Package },
  { id: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { id: 'processing', label: 'Processing', icon: Clock },
  { id: 'shipped', label: 'Shipped', icon: Truck },
  { id: 'delivered', label: 'Delivered', icon: CheckCircle },
];

const statusToStepIndex: Record<string, number> = {
  Placed: 0,
  Confirmed: 1,
  Processing: 2,
  Shipped: 3,
  Delivered: 4,
};

const statusColors = {
  Delivered: 'bg-green-100 text-green-800 border-green-200',
  Shipped: 'bg-blue-100 text-blue-800 border-blue-200',
  Processing: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Placed: 'bg-slate-100 text-slate-800 border-slate-200',
  Confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
};

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const order = mockOrderDetails;
  const currentStepIndex = statusToStepIndex[order.status] ?? 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-slate-50 py-8">
        <div className="container-wide">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-6">
            <Link href="/orders" className="hover:text-primary-600">
              Orders
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900 font-medium">{id}</span>
          </div>

          {/* Back Button */}
          <Button asChild variant="ghost" className="mb-6">
            <Link href="/orders">
              <ArrowLeft className="w-4 h-4" />
              Back to Orders
            </Link>
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Header */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                      <h1 className="text-2xl font-bold text-slate-900 mb-1">
                        Order {order.orderNumber}
                      </h1>
                      <p className="text-slate-600">Placed on {order.placedDate}</p>
                    </div>
                    <span
                      className={`px-4 py-2 text-sm font-semibold rounded-full border w-fit ${statusColors[order.status]}`}
                    >
                      {order.status}
                    </span>
                  </div>

                  {/* Order Status Timeline */}
                  <div className="relative">
                    <div className="flex justify-between">
                      {orderSteps.map((step, index) => {
                        const Icon = step.icon;
                        const isCompleted = index <= currentStepIndex;
                        const isCurrent = index === currentStepIndex;

                        return (
                          <div key={step.id} className="flex flex-col items-center flex-1">
                            {/* Step Icon */}
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all relative z-10 ${
                                isCompleted
                                  ? 'bg-primary-600 border-primary-600 text-white'
                                  : 'bg-white border-slate-300 text-slate-400'
                              } ${isCurrent ? 'ring-4 ring-primary-100' : ''}`}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            {/* Step Label */}
                            <p
                              className={`text-xs mt-2 text-center ${
                                isCompleted ? 'text-slate-900 font-medium' : 'text-slate-500'
                              }`}
                            >
                              {step.label}
                            </p>
                            {/* Connector Line */}
                            {index < orderSteps.length - 1 && (
                              <div
                                className={`absolute top-5 left-[calc(50%+1.25rem)] w-[calc((100%/${orderSteps.length})-2.5rem)] h-0.5 -z-0 ${
                                  index < currentStepIndex ? 'bg-primary-600' : 'bg-slate-300'
                                }`}
                                style={{
                                  transform: `translateX(${index * 100}%)`,
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-bold text-slate-900">Order Items</h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex gap-4 pb-6 border-b border-slate-200 last:border-0 last:pb-0">
                        <div className="relative w-20 h-20 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden">
                          <Image
                            src={item.imageUrl}
                            alt={item.productName}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 line-clamp-2 mb-1">
                            {item.productName}
                          </h3>
                          <p className="text-sm text-slate-600 mb-2">
                            Variant: {item.variantName}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-slate-600">Qty: {item.quantity}</span>
                            <span className="text-slate-600">Unit Price: {formatPrice(item.unitPrice)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">{formatPrice(item.total)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Tracking */}
              {order.trackingNumber && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">Tracking Number</h3>
                        <p className="text-slate-600 font-mono">{order.trackingNumber}</p>
                      </div>
                      <Button variant="outline" disabled>
                        Track Shipment
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-bold text-slate-900">Order Summary</h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-slate-700">
                      <span>Subtotal</span>
                      <span className="font-semibold">{formatPrice(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Shipping</span>
                      <span className="font-semibold">{formatPrice(order.shipping)}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Tax</span>
                      <span className="font-semibold">{formatPrice(order.tax)}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-3">
                      <div className="flex justify-between text-lg font-bold text-slate-900">
                        <span>Total</span>
                        <span>{formatPrice(order.total)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary-600" />
                    <h2 className="text-lg font-bold text-slate-900">Shipping Address</h2>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-slate-700 space-y-1">
                    <p className="font-semibold text-slate-900">{order.shippingAddress.name}</p>
                    <p>{order.shippingAddress.line1}</p>
                    {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                    <p>
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                    </p>
                    <p>{order.shippingAddress.country}</p>
                    <p className="pt-2">{order.shippingAddress.phone}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary-600" />
                    <h2 className="text-lg font-bold text-slate-900">Payment Method</h2>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-700">{order.paymentMethod}</p>
                </CardContent>
              </Card>

              {/* Help Section */}
              <Card className="bg-slate-50 border-slate-200">
                <CardContent className="p-6 text-center">
                  <Package className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-slate-900 mb-2">Need Help?</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Have questions about your order? Our support team is here to help.
                  </p>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href="/help">Contact Support</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
