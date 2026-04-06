'use client';

import Link from 'next/link';
import { Search, User, Heart, ShoppingCart, Menu, X, Phone, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { mockCategories } from '@/lib/mock-data';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      {/* Top bar */}
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="container-wide">
          <div className="flex items-center justify-between h-10 text-sm">
            <div className="flex items-center gap-6 text-slate-600">
              <a href="tel:+94112345678" className="flex items-center gap-2 hover:text-primary-600">
                <Phone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">+94 11 234 5678</span>
              </a>
              <a href="mailto:support@lankamart.com" className="flex items-center gap-2 hover:text-primary-600">
                <Mail className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">support@lankamart.com</span>
              </a>
            </div>
            <div className="flex items-center gap-4">
              <select className="text-sm bg-transparent border-none focus:outline-none cursor-pointer">
                <option>USD $</option>
                <option>EUR €</option>
                <option>GBP £</option>
                <option>LKR ₨</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container-wide">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="text-2xl font-bold">
              <span className="text-primary-600">Lanka</span>
              <span className="text-accent-500">Mart</span>
            </div>
          </Link>

          {/* Search - Desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <div className="relative w-full">
              <Input
                type="search"
                placeholder="Search products, categories, vendors..."
                className="pr-12"
                icon={<Search className="w-5 h-5" />}
              />
              <Button
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2"
              >
                Search
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden lg:flex items-center gap-2 text-slate-700 hover:text-primary-600">
              <User className="w-5 h-5" />
              <span className="text-sm font-medium">Sign In</span>
            </Link>
            <Link href="/wishlist" className="hidden sm:block relative text-slate-700 hover:text-primary-600">
              <Heart className="w-6 h-6" />
            </Link>
            <Link href="/cart" className="relative text-slate-700 hover:text-primary-600">
              <ShoppingCart className="w-6 h-6" />
              <span className="absolute -top-2 -right-2 bg-accent-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                3
              </span>
            </Link>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-slate-700 hover:text-primary-600"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="hidden md:block bg-slate-50 border-t border-slate-200">
        <div className="container-wide">
          <nav className="flex items-center gap-6 h-12 text-sm font-medium">
            <Link href="/products" className="text-slate-700 hover:text-primary-600">
              All Products
            </Link>
            {mockCategories.slice(0, 5).map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="text-slate-700 hover:text-primary-600 whitespace-nowrap"
              >
                {category.name}
              </Link>
            ))}
            <Link href="/sell" className="text-accent-600 hover:text-accent-700 ml-auto">
              Sell on LankaMart
            </Link>
            <Link href="/help" className="text-slate-700 hover:text-primary-600">
              Help
            </Link>
          </nav>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="container-wide py-4">
            {/* Mobile search */}
            <div className="mb-4">
              <Input
                type="search"
                placeholder="Search products..."
                icon={<Search className="w-5 h-5" />}
              />
            </div>

            {/* Mobile nav links */}
            <nav className="flex flex-col gap-3">
              <Link
                href="/login"
                className="flex items-center gap-2 py-2 text-slate-700 hover:text-primary-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                <User className="w-5 h-5" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/products"
                className="py-2 text-slate-700 hover:text-primary-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                All Products
              </Link>
              {mockCategories.slice(0, 6).map((category) => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.slug}`}
                  className="py-2 text-slate-700 hover:text-primary-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {category.name}
                </Link>
              ))}
              <Link
                href="/sell"
                className="py-2 text-accent-600 hover:text-accent-700 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sell on LankaMart
              </Link>
              <Link
                href="/help"
                className="py-2 text-slate-700 hover:text-primary-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Help
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
