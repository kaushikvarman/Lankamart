import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent } from '@/components/ui/card';
import { Rating } from '@/components/ui/rating';
import { Badge } from '@/components/ui/badge';
import { mockProducts, mockCategories } from '@/lib/mock-data';
import { formatPrice } from '@/lib/utils';
import { CheckCircle2, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { ProductFilters } from '@/components/products/product-filters';

interface ProductsPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { category } = await searchParams;

  // Filter products by category if specified
  const filteredProducts = category
    ? mockProducts.filter((p) => p.category?.slug === category)
    : mockProducts;

  // Get active category name
  const activeCategory = category
    ? mockCategories.find((c) => c.slug === category)
    : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-slate-50">
        {/* Breadcrumbs */}
        <div className="bg-white border-b border-slate-200">
          <div className="container-wide py-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Link href="/" className="hover:text-primary-600">
                Home
              </Link>
              <ChevronRight className="w-4 h-4" />
              <Link href="/products" className="hover:text-primary-600">
                Products
              </Link>
              {activeCategory && (
                <>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-slate-900 font-medium">
                    {activeCategory.name}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="container-wide py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar - Desktop */}
            <aside className="hidden lg:block">
              <ProductFilters />
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Header */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-1">
                      {activeCategory ? activeCategory.name : 'All Products'}
                    </h1>
                    <p className="text-slate-600">
                      {filteredProducts.length} products found
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button className="lg:hidden flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-md text-sm font-medium hover:bg-slate-50">
                      <SlidersHorizontal className="w-4 h-4" />
                      Filters
                    </button>
                    <select className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option>Sort: Featured</option>
                      <option>Price: Low to High</option>
                      <option>Price: High to Low</option>
                      <option>Newest First</option>
                      <option>Best Rated</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
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
                        <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors min-h-[3rem]">
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
                        <p className="text-sm text-slate-600 flex items-center gap-1 mb-3">
                          {product.vendor?.isVerified && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary-600" />
                          )}
                          {product.vendor?.businessName}
                        </p>
                        <button className="w-full py-2 px-4 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 transition-colors">
                          Add to Cart
                        </button>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Empty State */}
              {filteredProducts.length === 0 && (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <p className="text-slate-600 text-lg mb-4">
                    No products found in this category.
                  </p>
                  <Link href="/products">
                    <button className="px-6 py-2 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 transition-colors">
                      View All Products
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
