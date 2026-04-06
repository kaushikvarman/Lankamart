import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Rating } from '@/components/ui/rating';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/types';

interface RelatedProductsProps {
  products: Product[];
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-6">
        Related Products
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
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
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-slate-900">
                    {formatPrice(product.basePrice)}
                  </span>
                  {product.compareAtPrice && (
                    <span className="text-sm text-slate-500 line-through">
                      {formatPrice(product.compareAtPrice)}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
