import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Badge } from '@/components/ui/badge';
import { Rating } from '@/components/ui/rating';
import { Card, CardContent } from '@/components/ui/card';
import { mockProducts, mockProducts as relatedProducts } from '@/lib/mock-data';
import { formatPrice } from '@/lib/utils';
import { ChevronRight, CheckCircle2, MapPin, Truck, Shield, Package } from 'lucide-react';
import { ProductImageGallery } from '@/components/products/product-image-gallery';
import { ProductTabs } from '@/components/products/product-tabs';
import { RelatedProducts } from '@/components/products/related-products';
import { ProductActions } from '@/components/products/product-actions';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return mockProducts.map((product) => ({
    slug: product.slug,
  }));
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = mockProducts.find((p) => p.slug === slug);

  if (!product) {
    notFound();
  }

  const related = relatedProducts
    .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
    .slice(0, 4);

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
              {product.category && (
                <>
                  <ChevronRight className="w-4 h-4" />
                  <Link
                    href={`/products?category=${product.category.slug}`}
                    className="hover:text-primary-600"
                  >
                    {product.category.name}
                  </Link>
                </>
              )}
              <ChevronRight className="w-4 h-4" />
              <span className="text-slate-900 font-medium truncate">
                {product.name}
              </span>
            </div>
          </div>
        </div>

        <div className="container-wide py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Left: Image Gallery */}
            <div>
              <ProductImageGallery images={product.images} />
            </div>

            {/* Right: Product Info */}
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-4">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-6">
                <Rating rating={product.averageRating} size="lg" showValue />
                <span className="text-slate-600">
                  ({product.totalReviews} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-4xl font-bold text-slate-900">
                    {formatPrice(product.basePrice)}
                  </span>
                  {product.compareAtPrice && (
                    <>
                      <span className="text-xl text-slate-500 line-through">
                        {formatPrice(product.compareAtPrice)}
                      </span>
                      <Badge variant="destructive">
                        Save {Math.round(((product.compareAtPrice - product.basePrice) / product.compareAtPrice) * 100)}%
                      </Badge>
                    </>
                  )}
                </div>
                <p className="text-sm text-slate-600">
                  Tax included. Shipping calculated at checkout.
                </p>
              </div>

              {/* Short Description */}
              {product.shortDescription && (
                <p className="text-slate-700 mb-6 leading-relaxed">
                  {product.shortDescription}
                </p>
              )}

              {/* Product Actions */}
              <ProductActions variants={product.variants} minOrderQty={product.minOrderQty} />

              {/* Shipping Info */}
              <div className="mt-8 space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-primary-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-slate-900 text-sm">
                      Free Shipping
                    </div>
                    <div className="text-xs text-slate-600">
                      On orders over $100
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-slate-900 text-sm">
                      Buyer Protection
                    </div>
                    <div className="text-xs text-slate-600">
                      Full refund if item not as described
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-primary-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-slate-900 text-sm">
                      Secure Packaging
                    </div>
                    <div className="text-xs text-slate-600">
                      Professionally packed for safe delivery
                    </div>
                  </div>
                </div>
              </div>

              {/* Vendor Card */}
              {product.vendor && (
                <Card className="mt-6">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg">
                          {product.vendor.businessName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900">
                              {product.vendor.businessName}
                            </h3>
                            {product.vendor.isVerified && (
                              <CheckCircle2 className="w-4 h-4 text-primary-600" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                            <Rating rating={product.vendor.averageRating} size="sm" />
                            <span>({product.vendor.totalReviews} reviews)</span>
                          </div>
                          {product.vendor.city && (
                            <div className="flex items-center gap-1 text-sm text-slate-600">
                              <MapPin className="w-3.5 h-3.5" />
                              {product.vendor.city}, {product.vendor.country}
                            </div>
                          )}
                        </div>
                      </div>
                      <Link href={`/vendors/${product.vendor.businessSlug}`}>
                        <button className="px-4 py-2 text-sm font-medium text-primary-600 border border-primary-600 rounded-md hover:bg-primary-50 transition-colors">
                          Visit Store
                        </button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Tabs: Description, Reviews, Shipping */}
          <ProductTabs product={product} />

          {/* Related Products */}
          {related.length > 0 && <RelatedProducts products={related} />}
        </div>
      </main>

      <Footer />
    </div>
  );
}
