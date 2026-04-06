'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { ProductImage } from '@/types';

interface ProductImageGalleryProps {
  images: ProductImage[];
}

export function ProductImageGallery({ images }: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeImage = images[activeIndex] || images[0];

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square bg-white rounded-lg overflow-hidden border border-slate-200">
        <Image
          src={activeImage?.url || ''}
          alt={activeImage?.altText || 'Product image'}
          fill
          unoptimized
          className="object-cover"
          priority
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-4">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setActiveIndex(index)}
              className={`relative aspect-square bg-white rounded-lg overflow-hidden border-2 transition-all ${
                index === activeIndex
                  ? 'border-primary-600 shadow-md'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Image
                src={image.url}
                alt={image.altText || `Product image ${index + 1}`}
                fill
                unoptimized
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
