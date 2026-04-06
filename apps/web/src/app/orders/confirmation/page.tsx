'use client';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Package, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function OrderConfirmationPage() {
  const orderNumber = `LM-20260406-${Math.floor(1000 + Math.random() * 9000)}`;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-slate-50 py-12">
        <div className="container-wide">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-8 sm:p-12 text-center">
                {/* Success Icon */}
                <div className="mb-6 flex justify-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                </div>

                {/* Success Message */}
                <h1 className="text-3xl font-bold text-slate-900 mb-3">
                  Order Placed Successfully!
                </h1>
                <p className="text-lg text-slate-600 mb-2">
                  Thank you for your order. You&apos;ll receive a confirmation email shortly.
                </p>

                {/* Order Number */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 my-6 inline-block">
                  <p className="text-sm text-slate-600 mb-1">Order Number</p>
                  <p className="text-2xl font-bold text-primary-600">{orderNumber}</p>
                </div>

                {/* Additional Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                  <div className="flex items-start gap-3 text-left">
                    <Package className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900 mb-1">What happens next?</p>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• You&apos;ll receive an email confirmation with order details</li>
                        <li>• We&apos;ll notify you when your order is shipped</li>
                        <li>• Track your order status anytime in &quot;My Orders&quot;</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild size="lg" variant="primary">
                    <Link href="/orders">
                      View My Orders
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="/products">
                      <ArrowLeft className="w-5 h-5" />
                      Continue Shopping
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
