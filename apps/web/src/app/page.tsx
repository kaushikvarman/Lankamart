import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Rating } from '@/components/ui/rating';
import { Badge } from '@/components/ui/badge';
import { mockCategories, mockProducts, mockVendors } from '@/lib/mock-data';
import { formatPrice } from '@/lib/utils';
import {
  Shield,
  CreditCard,
  Truck,
  HeadphonesIcon,
  TrendingUp,
  Users,
  Package,
  Clock,
  ChevronRight,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

export default function HomePage() {
  const featuredProducts = mockProducts.slice(0, 4);
  const featuredVendors = mockVendors;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
          <div className="container-wide py-20 md:py-28">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-balance">
                Discover Authentic Products from Sri Lanka & India
              </h1>
              <p className="text-lg md:text-xl text-primary-100 mb-8 text-balance">
                Connect with verified vendors offering premium spices, textiles, gems, handicrafts, and more. Shipped worldwide with buyer protection.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/products">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                    Browse Products
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white/10 border-white text-white hover:bg-white/20">
                    Start Selling
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="bg-white border-b border-slate-200">
          <div className="container-wide py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Package className="w-8 h-8 text-primary-600" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-slate-900">10,000+</div>
                <div className="text-sm text-slate-600">Products</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Users className="w-8 h-8 text-primary-600" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-slate-900">500+</div>
                <div className="text-sm text-slate-600">Vendors</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <MapPin className="w-8 h-8 text-primary-600" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-slate-900">50+</div>
                <div className="text-sm text-slate-600">Countries</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="w-8 h-8 text-primary-600" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-slate-900">24/7</div>
                <div className="text-sm text-slate-600">Support</div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="bg-slate-50 py-16">
          <div className="container-wide">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                Shop by Category
              </h2>
              <p className="text-slate-600 text-lg">
                Explore our curated collection of authentic products
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {mockCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.slug}`}
                  className="group relative aspect-square rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow"
                >
                  <Image
                    src={category.imageUrl || ''}
                    alt={category.name}
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-semibold text-lg mb-1">
                      {category.name}
                    </h3>
                    <p className="text-white/80 text-sm line-clamp-2">
                      {category.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16">
          <div className="container-wide">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                  Featured Products
                </h2>
                <p className="text-slate-600">
                  Hand-picked products from our verified vendors
                </p>
              </div>
              <Link href="/products">
                <Button variant="outline">
                  View All
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <Link key={product.id} href={`/products/${product.slug}`}>
                  <Card className="group h-full hover:shadow-lg transition-shadow">
                    <div className="relative aspect-square overflow-hidden rounded-t-lg">
                      <Image
                        src={product.images[0]?.url || ''}
                        alt={product.name}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {product.compareAtPrice && (
                        <Badge variant="destructive" className="absolute top-3 left-3">
                          Save {Math.round(((product.compareAtPrice - product.basePrice) / product.compareAtPrice) * 100)}%
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-3">
                        <Rating rating={product.averageRating} size="sm" />
                        <span className="text-sm text-slate-600">
                          ({product.totalReviews})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl font-bold text-slate-900">
                          {formatPrice(product.basePrice)}
                        </span>
                        {product.compareAtPrice && (
                          <span className="text-sm text-slate-500 line-through">
                            {formatPrice(product.compareAtPrice)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 flex items-center gap-1">
                        {product.vendor?.isVerified && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary-600" />
                        )}
                        {product.vendor?.businessName}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Why LankaMart */}
        <section className="bg-primary-50 py-16">
          <div className="container-wide">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                Why Choose LankaMart?
              </h2>
              <p className="text-slate-600 text-lg">
                Your trusted partner for global trade
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                  <Shield className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Verified Vendors
                </h3>
                <p className="text-slate-600">
                  All vendors undergo strict verification and quality checks
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                  <CreditCard className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Secure Payments
                </h3>
                <p className="text-slate-600">
                  Multiple payment options with escrow protection
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                  <Truck className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Global Shipping
                </h3>
                <p className="text-slate-600">
                  Worldwide delivery with real-time tracking
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                  <HeadphonesIcon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  24/7 Support
                </h3>
                <p className="text-slate-600">
                  Dedicated support team ready to help anytime
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Vendor Spotlight */}
        <section className="py-16">
          <div className="container-wide">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                Featured Vendors
              </h2>
              <p className="text-slate-600 text-lg">
                Meet our top-rated verified vendors
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredVendors.map((vendor) => (
                <Link key={vendor.id} href={`/vendors/${vendor.businessSlug}`}>
                  <Card className="group hover:shadow-lg transition-shadow">
                    <div className="h-32 bg-gradient-to-br from-primary-500 to-primary-700 rounded-t-lg" />
                    <CardContent className="p-6 -mt-12">
                      <div className="w-20 h-20 rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center mb-4">
                        <span className="text-2xl font-bold text-primary-600">
                          {vendor.businessName.charAt(0)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg text-slate-900 group-hover:text-primary-600 transition-colors">
                          {vendor.businessName}
                        </h3>
                        {vendor.isVerified && (
                          <CheckCircle2 className="w-5 h-5 text-primary-600" />
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                        {vendor.description}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <Rating rating={vendor.averageRating} size="sm" />
                          <span className="text-slate-600">
                            ({vendor.totalReviews})
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-600">
                          <MapPin className="w-3.5 h-3.5" />
                          {vendor.city}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="bg-gradient-to-r from-accent-500 to-accent-600 text-white py-16">
          <div className="container-wide text-center">
            <TrendingUp className="w-12 h-12 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Grow Your Business?
            </h2>
            <p className="text-xl text-accent-50 mb-8 max-w-2xl mx-auto">
              Join thousands of vendors selling authentic products to buyers worldwide. Start your journey today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-white text-accent-600 hover:bg-accent-50 w-full sm:w-auto">
                  Register as Vendor
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/vendor-guide">
                <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10 w-full sm:w-auto">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
