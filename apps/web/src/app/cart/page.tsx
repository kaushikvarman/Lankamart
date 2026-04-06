'use client';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice } from '@/lib/utils';
import { Minus, Plus, Trash2, ShoppingCart, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function CartPage() {
  const { items, updateQuantity, removeItem, getSubtotal, getItemCount } = useCartStore();

  const subtotal = getSubtotal();
  const itemCount = getItemCount();

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-slate-50 py-12">
          <div className="container-wide">
            <div className="max-w-md mx-auto text-center">
              <div className="mb-6 flex justify-center">
                <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-16 h-16 text-slate-400" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Your cart is empty</h1>
              <p className="text-slate-600 mb-6">
                Looks like you haven&apos;t added anything to your cart yet.
              </p>
              <Button asChild size="lg">
                <Link href="/products">
                  <ArrowLeft className="w-5 h-5" />
                  Continue Shopping
                </Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-slate-50 py-8">
        <div className="container-wide">
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900">
              Shopping Cart
              <span className="text-slate-500 text-xl ml-3">({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.variantId}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden">
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/products/${item.slug}`}
                              className="font-semibold text-slate-900 hover:text-primary-600 line-clamp-2"
                            >
                              {item.name}
                            </Link>
                            <p className="text-sm text-slate-600 mt-1">
                              Variant: {item.variantName}
                            </p>
                            <p className="text-sm text-slate-500 mt-0.5">
                              Sold by: <Link href={`/vendors/${item.vendorSlug}`} className="hover:text-primary-600">{item.vendorName}</Link>
                            </p>
                          </div>

                          {/* Remove Button - Desktop */}
                          <button
                            onClick={() => removeItem(item.variantId)}
                            className="hidden sm:block text-slate-400 hover:text-red-600 transition-colors"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Price and Quantity */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 gap-3">
                          {/* Price */}
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold text-slate-900">
                              {formatPrice(item.price, item.currency)}
                            </span>
                            {item.compareAtPrice && (
                              <span className="text-sm text-slate-500 line-through">
                                {formatPrice(item.compareAtPrice, item.currency)}
                              </span>
                            )}
                          </div>

                          {/* Quantity Adjuster */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center border border-slate-300 rounded-md">
                              <button
                                onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="px-4 py-1.5 text-sm font-medium min-w-[3rem] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                                disabled={item.quantity >= item.stock}
                                className="px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Line Total */}
                            <div className="text-right min-w-[5rem]">
                              <p className="font-bold text-slate-900">
                                {formatPrice(item.price * item.quantity, item.currency)}
                              </p>
                            </div>

                            {/* Remove Button - Mobile */}
                            <button
                              onClick={() => removeItem(item.variantId)}
                              className="sm:hidden text-slate-400 hover:text-red-600 transition-colors"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Order Summary</h2>

                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-slate-700">
                        <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                        <span className="font-semibold">{formatPrice(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>Estimated Shipping</span>
                        <span className="text-slate-500 text-sm">Calculated at checkout</span>
                      </div>
                      <div className="border-t border-slate-200 pt-3 mt-3">
                        <div className="flex justify-between text-lg font-bold text-slate-900">
                          <span>Total</span>
                          <span>{formatPrice(subtotal)}</span>
                        </div>
                      </div>
                    </div>

                    <Button asChild size="lg" className="w-full mb-3">
                      <Link href="/checkout">Proceed to Checkout</Link>
                    </Button>

                    <Link
                      href="/products"
                      className="block text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Continue Shopping
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
