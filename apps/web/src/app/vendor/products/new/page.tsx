'use client';

import { VendorLayout } from '@/components/vendor/vendor-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockCategories } from '@/lib/mock-data';
import { Upload, Trash2, Plus } from 'lucide-react';
import { useState } from 'react';

interface Variant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
}

export default function VendorProductNewPage() {
  const [productName, setProductName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [category, setCategory] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [hsCode, setHsCode] = useState('');
  const [originCountry, setOriginCountry] = useState('LK');
  const [urlSlug, setUrlSlug] = useState('');
  const [metaTags, setMetaTags] = useState('');

  const [variants, setVariants] = useState<Variant[]>([
    {
      id: '1',
      name: '100g Pack',
      sku: 'PROD-100',
      price: 24.99,
      stock: 500,
    },
    {
      id: '2',
      name: '250g Pack',
      sku: 'PROD-250',
      price: 49.99,
      stock: 300,
    },
  ]);

  const handleProductNameChange = (value: string) => {
    setProductName(value);
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setUrlSlug(slug);
  };

  const addVariant = () => {
    setVariants([
      ...variants,
      {
        id: Date.now().toString(),
        name: '',
        sku: '',
        price: 0,
        stock: 0,
      },
    ]);
  };

  const deleteVariant = (id: string) => {
    setVariants(variants.filter((v) => v.id !== id));
  };

  return (
    <VendorLayout pageTitle="Add New Product">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Basic Information</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                label="Product Name"
                placeholder="Enter product name"
                value={productName}
                onChange={(e) => handleProductNameChange(e.target.value)}
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                >
                  <option value="">Select a category</option>
                  {mockCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Short Description
                  <span className="ml-2 text-xs text-slate-500">
                    ({shortDescription.length}/500)
                  </span>
                </label>
                <textarea
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value.slice(0, 500))}
                  maxLength={500}
                  rows={2}
                  placeholder="Brief product description"
                  className="w-full px-4 py-2 border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Full Description
                  <span className="ml-2 text-xs text-slate-500">
                    ({fullDescription.length}/5000)
                  </span>
                </label>
                <textarea
                  value={fullDescription}
                  onChange={(e) => setFullDescription(e.target.value.slice(0, 5000))}
                  maxLength={5000}
                  rows={6}
                  placeholder="Detailed product description"
                  className="w-full px-4 py-2 border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Pricing</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Base Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Compare At Price <span className="text-xs text-slate-500">(Optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={compareAtPrice}
                    onChange={(e) => setCompareAtPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Cost Price <span className="text-xs text-slate-500">(Only visible to you)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="LKR">LKR - Sri Lankan Rupee</option>
                  <option value="INR">INR - Indian Rupee</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Variants */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Product Variants</h2>
              <Button size="sm" variant="outline" onClick={addVariant}>
                <Plus size={16} />
                Add Variant
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {variants.map((variant) => (
                    <tr key={variant.id}>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={variant.name}
                          onChange={(e) => {
                            setVariants(
                              variants.map((v) =>
                                v.id === variant.id ? { ...v, name: e.target.value } : v
                              )
                            );
                          }}
                          placeholder="Variant name"
                          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={variant.sku}
                          onChange={(e) => {
                            setVariants(
                              variants.map((v) =>
                                v.id === variant.id ? { ...v, sku: e.target.value } : v
                              )
                            );
                          }}
                          placeholder="SKU"
                          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.01"
                          value={variant.price}
                          onChange={(e) => {
                            setVariants(
                              variants.map((v) =>
                                v.id === variant.id
                                  ? { ...v, price: parseFloat(e.target.value) || 0 }
                                  : v
                              )
                            );
                          }}
                          placeholder="0.00"
                          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={variant.stock}
                          onChange={(e) => {
                            setVariants(
                              variants.map((v) =>
                                v.id === variant.id
                                  ? { ...v, stock: parseInt(e.target.value) || 0 }
                                  : v
                              )
                            );
                          }}
                          placeholder="0"
                          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => deleteVariant(variant.id)}
                          className="p-2 hover:bg-slate-100 rounded-md text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Product Images</h2>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center hover:border-primary-500 hover:bg-primary-50 transition-colors cursor-pointer">
              <Upload size={48} className="mx-auto text-slate-400 mb-4" />
              <p className="text-slate-700 font-medium mb-1">
                Drag images here or click to upload
              </p>
              <p className="text-sm text-slate-500">PNG, JPG up to 10MB</p>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="aspect-square border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400"
                >
                  <Upload size={32} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Shipping */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Shipping Information</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Weight (kg)"
                  type="number"
                  step="0.01"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="0.00"
                />
                <Input
                  label="HS Code"
                  value={hsCode}
                  onChange={(e) => setHsCode(e.target.value)}
                  placeholder="Enter HS code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Dimensions (cm)
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <input
                    type="number"
                    step="0.01"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    placeholder="Length"
                    className="w-full px-4 py-2 border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    placeholder="Width"
                    className="w-full px-4 py-2 border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="Height"
                    className="w-full px-4 py-2 border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Origin Country
                </label>
                <select
                  value={originCountry}
                  onChange={(e) => setOriginCountry(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                >
                  <option value="LK">Sri Lanka</option>
                  <option value="IN">India</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEO */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">SEO</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                label="URL Slug"
                value={urlSlug}
                onChange={(e) => setUrlSlug(e.target.value)}
                placeholder="product-url-slug"
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Meta Tags <span className="text-xs text-slate-500">(Optional)</span>
                </label>
                <textarea
                  value={metaTags}
                  onChange={(e) => setMetaTags(e.target.value)}
                  rows={3}
                  placeholder="Enter meta description and keywords"
                  className="w-full px-4 py-2 border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 justify-end">
          <Button variant="outline">Save as Draft</Button>
          <Button>Submit for Review</Button>
        </div>
      </div>
    </VendorLayout>
  );
}
