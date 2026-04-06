'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import type { ProductVariant } from '@/types';
import { formatPrice } from '@/lib/utils';

interface ProductActionsProps {
  variants: ProductVariant[];
  minOrderQty: number;
}

export function ProductActions({ variants, minOrderQty }: ProductActionsProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(variants[0]!);
  const [quantity, setQuantity] = useState(minOrderQty);

  const decrementQty = () => {
    if (quantity > minOrderQty) {
      setQuantity(quantity - 1);
    }
  };

  const incrementQty = () => {
    if (selectedVariant && quantity < selectedVariant.stock) {
      setQuantity(quantity + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Variant Selector */}
      {variants.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Select {Object.keys(variants[0]?.attributes || {})[0] || 'Option'}
          </label>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => setSelectedVariant(variant)}
                className={`px-4 py-2 border-2 rounded-md font-medium transition-all ${
                  selectedVariant.id === variant.id
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                <div className="text-sm">{variant.name}</div>
                {variant.price !== variants[0]?.price && (
                  <div className="text-xs text-slate-600 mt-0.5">
                    {formatPrice(variant.price)}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stock Status */}
      <div className="text-sm">
        {selectedVariant.stock > 0 ? (
          <span className="text-green-600 font-medium">
            In Stock ({selectedVariant.stock} available)
          </span>
        ) : (
          <span className="text-red-600 font-medium">Out of Stock</span>
        )}
      </div>

      {/* Quantity Selector */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Quantity {minOrderQty > 1 && `(Min order: ${minOrderQty})`}
        </label>
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-slate-300 rounded-md">
            <button
              onClick={decrementQty}
              disabled={quantity <= minOrderQty}
              className="p-2 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val >= minOrderQty && val <= selectedVariant.stock) {
                  setQuantity(val);
                }
              }}
              className="w-16 text-center border-x border-slate-300 py-2 focus:outline-none"
            />
            <button
              onClick={incrementQty}
              disabled={quantity >= selectedVariant.stock}
              className="p-2 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <span className="text-sm text-slate-600">
            {selectedVariant.stock} pieces available
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          size="lg"
          disabled={selectedVariant.stock === 0}
          className="flex-1"
        >
          <ShoppingCart className="w-5 h-5" />
          Add to Cart
        </Button>
        <Button
          size="lg"
          variant="secondary"
          disabled={selectedVariant.stock === 0}
          className="flex-1"
        >
          Buy Now
        </Button>
      </div>
    </div>
  );
}
