'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { CreditCard, Truck, MapPin, CheckCircle } from 'lucide-react';

type ShippingMethod = 'standard' | 'express' | 'air';
type PaymentMethod = 'card' | 'bank';

const shippingOptions = [
  { id: 'standard' as ShippingMethod, name: 'Standard Shipping', time: '7-14 days', price: 9.99 },
  { id: 'express' as ShippingMethod, name: 'Express Shipping', time: '3-5 days', price: 24.99 },
  { id: 'air' as ShippingMethod, name: 'Air Freight', time: '1-3 days', price: 49.99 },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCartStore();
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('standard');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = getSubtotal();
  const selectedShipping = shippingOptions.find(opt => opt.id === shippingMethod);
  const shippingCost = selectedShipping?.price || 0;
  const tax = subtotal * 0.05; // 5% tax
  const total = subtotal + shippingCost + tax;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate order processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Clear cart and redirect to confirmation
    clearCart();
    router.push('/orders/confirmation');
  };

  if (items.length === 0) {
    router.push('/cart');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-slate-50 py-8">
        <div className="container-wide">
          <h1 className="text-3xl font-bold text-slate-900 mb-8">Checkout</h1>

          <form onSubmit={handlePlaceOrder}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Checkout Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Shipping Address */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-primary-600" />
                      </div>
                      <h2 className="text-xl font-bold text-slate-900">Shipping Address</h2>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <Input
                          label="Full Name"
                          placeholder="John Doe"
                          required
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Input
                          label="Address Line 1"
                          placeholder="Street address, P.O. box"
                          required
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Input
                          label="Address Line 2"
                          placeholder="Apartment, suite, unit, building, floor, etc. (optional)"
                        />
                      </div>
                      <Input
                        label="City"
                        placeholder="City"
                        required
                      />
                      <Input
                        label="State/Province"
                        placeholder="State or Province"
                        required
                      />
                      <Input
                        label="Postal Code"
                        placeholder="Postal/ZIP Code"
                        required
                      />
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          Country
                        </label>
                        <select
                          className="w-full px-4 py-2 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          required
                        >
                          <option value="">Select Country</option>
                          <option value="LK">Sri Lanka</option>
                          <option value="IN">India</option>
                          <option value="US">United States</option>
                          <option value="UK">United Kingdom</option>
                          <option value="AU">Australia</option>
                          <option value="CA">Canada</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <Input
                          label="Phone"
                          type="tel"
                          placeholder="+1 234 567 8900"
                          required
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Shipping Method */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <Truck className="w-4 h-4 text-primary-600" />
                      </div>
                      <h2 className="text-xl font-bold text-slate-900">Shipping Method</h2>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {shippingOptions.map((option) => (
                        <label
                          key={option.id}
                          className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            shippingMethod === option.id
                              ? 'border-primary-600 bg-primary-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="shipping"
                              value={option.id}
                              checked={shippingMethod === option.id}
                              onChange={(e) => setShippingMethod(e.target.value as ShippingMethod)}
                              className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                            />
                            <div>
                              <p className="font-semibold text-slate-900">{option.name}</p>
                              <p className="text-sm text-slate-600">{option.time}</p>
                            </div>
                          </div>
                          <span className="font-bold text-slate-900">{formatPrice(option.price)}</span>
                        </label>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Method */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-primary-600" />
                      </div>
                      <h2 className="text-xl font-bold text-slate-900">Payment Method</h2>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Credit/Debit Card */}
                      <label
                        className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          paymentMethod === 'card'
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <input
                            type="radio"
                            name="payment"
                            value="card"
                            checked={paymentMethod === 'card'}
                            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                            className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                          />
                          <div>
                            <p className="font-semibold text-slate-900">Credit/Debit Card</p>
                            <p className="text-sm text-slate-600">Powered by Stripe</p>
                          </div>
                        </div>
                        {paymentMethod === 'card' && (
                          <div className="ml-7 space-y-3 mt-3 pt-3 border-t border-slate-200">
                            <Input
                              placeholder="1234 5678 9012 3456"
                              label="Card Number"
                              required
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <Input
                                placeholder="MM/YY"
                                label="Expiry Date"
                                required
                              />
                              <Input
                                placeholder="CVC"
                                label="CVC"
                                required
                              />
                            </div>
                          </div>
                        )}
                      </label>

                      {/* Bank Transfer */}
                      <label
                        className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          paymentMethod === 'bank'
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="payment"
                            value="bank"
                            checked={paymentMethod === 'bank'}
                            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                            className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                          />
                          <div>
                            <p className="font-semibold text-slate-900">Bank Transfer</p>
                            <p className="text-sm text-slate-600">Direct bank transfer with payment confirmation</p>
                          </div>
                        </div>
                        {paymentMethod === 'bank' && (
                          <div className="ml-7 mt-3 pt-3 border-t border-slate-200">
                            <div className="bg-slate-50 p-3 rounded-md text-sm">
                              <p className="font-medium text-slate-900 mb-2">Bank Details:</p>
                              <p className="text-slate-600">Bank: Commercial Bank of Ceylon</p>
                              <p className="text-slate-600">Account: 1234567890</p>
                              <p className="text-slate-600">SWIFT: CCEYLKLX</p>
                              <p className="text-slate-500 text-xs mt-2">
                                Please include your order number in the transfer reference.
                              </p>
                            </div>
                          </div>
                        )}
                      </label>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Review */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-primary-600" />
                      </div>
                      <h2 className="text-xl font-bold text-slate-900">Order Review</h2>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {items.map((item) => (
                        <div key={item.variantId} className="flex gap-4">
                          <div className="relative w-16 h-16 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden">
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 line-clamp-1">{item.name}</p>
                            <p className="text-sm text-slate-600">{item.variantName}</p>
                            <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-slate-900">
                              {formatPrice(item.price * item.quantity, item.currency)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-xl font-bold text-slate-900 mb-4">Order Summary</h2>

                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-slate-700">
                          <span>Subtotal</span>
                          <span className="font-semibold">{formatPrice(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-slate-700">
                          <span>Shipping</span>
                          <span className="font-semibold">{formatPrice(shippingCost)}</span>
                        </div>
                        <div className="flex justify-between text-slate-700">
                          <span>Tax (5%)</span>
                          <span className="font-semibold">{formatPrice(tax)}</span>
                        </div>
                        <div className="border-t border-slate-200 pt-3 mt-3">
                          <div className="flex justify-between text-lg font-bold text-slate-900">
                            <span>Total</span>
                            <span>{formatPrice(total)}</span>
                          </div>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        disabled={isProcessing}
                      >
                        {isProcessing ? 'Processing...' : 'Place Order'}
                      </Button>

                      <p className="text-xs text-slate-500 text-center mt-3">
                        By placing your order, you agree to our Terms of Service and Privacy Policy.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
