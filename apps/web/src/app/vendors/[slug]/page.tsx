import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Badge } from '@/components/ui/badge';
import { Rating } from '@/components/ui/rating';
import { Card, CardContent } from '@/components/ui/card';
import { mockVendors, mockProducts } from '@/lib/mock-data';
import { formatPrice } from '@/lib/utils';
import { ChevronRight, MapPin, CheckCircle2, Calendar, Store } from 'lucide-react';
import { VendorTabs } from '@/components/vendors/vendor-tabs';

interface VendorPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return mockVendors.map((vendor) => ({
    slug: vendor.businessSlug,
  }));
}

export default async function VendorPage({ params }: VendorPageProps) {
  const { slug } = await params;
  const vendor = mockVendors.find((v) => v.businessSlug === slug);

  if (!vendor) {
    notFound();
  }

  const vendorProducts = mockProducts.filter((p) => p.vendorId === vendor.id);

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
              <Link href="/vendors" className="hover:text-primary-600">
                Vendors
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-slate-900 font-medium">
                {vendor.businessName}
              </span>
            </div>
          </div>
        </div>

        {/* Vendor Banner */}
        <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 h-48 md:h-64" />

        {/* Vendor Info */}
        <div className="container-wide -mt-20 mb-8">
          <Card className="shadow-lg">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Logo */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 rounded-lg bg-white border-4 border-white shadow-lg flex items-center justify-center">
                    {vendor.logoUrl ? (
                      <Image
                        src={vendor.logoUrl}
                        alt={vendor.businessName}
                        width={128}
                        height={128}
                        unoptimized
                        className="rounded-lg"
                      />
                    ) : (
                      <span className="text-5xl font-bold text-primary-600">
                        {vendor.businessName.charAt(0)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                          {vendor.businessName}
                        </h1>
                        {vendor.isVerified && (
                          <Badge variant="success" className="gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-600 mb-3">
                        {vendor.description}
                      </p>
                    </div>
                    <button className="px-6 py-2.5 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 transition-colors whitespace-nowrap">
                      Contact Vendor
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Rating rating={vendor.averageRating} size="md" />
                      <span className="font-semibold text-slate-900">
                        {vendor.averageRating.toFixed(1)}
                      </span>
                      <span className="text-slate-600">
                        ({vendor.totalReviews} reviews)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>
                        {vendor.city}, {vendor.country}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>Member since 2020</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Bar */}
        <div className="container-wide mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-900 mb-1">
                    {vendorProducts.length}
                  </div>
                  <div className="text-sm text-slate-600">Products</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-900 mb-1">
                    {vendor.totalReviews}
                  </div>
                  <div className="text-sm text-slate-600">Reviews</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-900 mb-1">
                    98%
                  </div>
                  <div className="text-sm text-slate-600">Positive Feedback</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-900 mb-1">
                    24h
                  </div>
                  <div className="text-sm text-slate-600">Response Time</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="container-wide pb-12">
          <VendorTabs vendor={vendor} products={vendorProducts} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
