'use client';

import { VendorLayout } from '@/components/vendor/vendor-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

type Tab = 'profile' | 'payout' | 'notifications';

interface PayoutAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  currency: string;
  isDefault: boolean;
  isVerified: boolean;
}

export default function VendorSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // Profile state
  const [businessName, setBusinessName] = useState('Ceylon Spice Gardens');
  const [description, setDescription] = useState(
    'Premium organic spices from the hills of Sri Lanka'
  );
  const [country, setCountry] = useState('LK');
  const [city, setCity] = useState('Kandy');
  const [website, setWebsite] = useState('https://ceylonspicegardens.com');
  const [yearEstablished, setYearEstablished] = useState('2015');
  const [employeeCount, setEmployeeCount] = useState('11-50');

  // Payout state
  const [payoutAccounts, setPayoutAccounts] = useState<PayoutAccount[]>([
    {
      id: '1',
      bankName: 'Bank of Ceylon',
      accountNumber: '****4567',
      currency: 'LKR',
      isDefault: true,
      isVerified: true,
    },
  ]);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [newRoutingCode, setNewRoutingCode] = useState('');
  const [newSwift, setNewSwift] = useState('');
  const [newCurrency, setNewCurrency] = useState('LKR');

  // Notifications state
  const [notifications, setNotifications] = useState({
    newOrders: true,
    orderUpdates: true,
    messages: true,
    reviews: true,
    promotions: true,
  });

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <VendorLayout pageTitle="Settings">
      <div className="space-y-6">
        {/* Tabs */}
        <div className="border-b border-slate-200">
          <nav className="flex gap-8">
            {[
              { key: 'profile', label: 'Profile' },
              { key: 'payout', label: 'Payout Accounts' },
              { key: 'notifications', label: 'Notifications' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as Tab)}
                className={`pb-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="max-w-3xl space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-slate-900">Business Information</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    label="Business Name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                  />

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Business Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Country
                      </label>
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      >
                        <option value="LK">Sri Lanka</option>
                        <option value="IN">India</option>
                      </select>
                    </div>

                    <Input
                      label="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>

                  <Input
                    label="Website"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Year Established
                      </label>
                      <select
                        value={yearEstablished}
                        onChange={(e) => setYearEstablished(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      >
                        {Array.from({ length: 50 }, (_, i) => 2026 - i).map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Employee Count
                      </label>
                      <select
                        value={employeeCount}
                        onChange={(e) => setEmployeeCount(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      >
                        <option value="1-10">1-10</option>
                        <option value="11-50">11-50</option>
                        <option value="51-200">51-200</option>
                        <option value="201-500">201-500</option>
                        <option value="500+">500+</option>
                      </select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-slate-900">Branding</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Business Logo
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center">
                        <Upload size={32} className="text-slate-400" />
                      </div>
                      <div>
                        <Button size="sm" variant="outline">
                          <Upload size={16} />
                          Upload Logo
                        </Button>
                        <p className="text-xs text-slate-500 mt-2">PNG or JPG, max 2MB</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Store Banner
                    </label>
                    <div className="w-full h-32 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center">
                      <div className="text-center">
                        <Upload size={32} className="text-slate-400 mx-auto mb-2" />
                        <Button size="sm" variant="outline">
                          Upload Banner
                        </Button>
                        <p className="text-xs text-slate-500 mt-2">PNG or JPG, 1920x400px recommended</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button>Save Changes</Button>
            </div>
          </div>
        )}

        {/* Payout Tab */}
        {activeTab === 'payout' && (
          <div className="max-w-3xl space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Payout Accounts</h2>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddAccount(!showAddAccount)}
                  >
                    <Plus size={16} />
                    Add Account
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payoutAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="p-4 border border-slate-200 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold text-slate-900">{account.bankName}</p>
                          {account.isDefault && <Badge variant="success">Default</Badge>}
                          {account.isVerified && <Badge variant="outline">Verified</Badge>}
                        </div>
                        <p className="text-sm text-slate-600">
                          Account: {account.accountNumber}
                        </p>
                        <p className="text-sm text-slate-600">Currency: {account.currency}</p>
                      </div>
                      <button className="p-2 hover:bg-slate-100 rounded-md text-red-600">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>

                {showAddAccount && (
                  <div className="mt-6 pt-6 border-t border-slate-200 space-y-4">
                    <h3 className="font-semibold text-slate-900">Add New Payout Account</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Bank Name"
                        value={newBankName}
                        onChange={(e) => setNewBankName(e.target.value)}
                        placeholder="e.g., Bank of Ceylon"
                      />
                      <Input
                        label="Account Name"
                        value={newAccountName}
                        onChange={(e) => setNewAccountName(e.target.value)}
                        placeholder="Account holder name"
                      />
                      <Input
                        label="Account Number"
                        value={newAccountNumber}
                        onChange={(e) => setNewAccountNumber(e.target.value)}
                        placeholder="Enter account number"
                      />
                      <Input
                        label="Routing Code"
                        value={newRoutingCode}
                        onChange={(e) => setNewRoutingCode(e.target.value)}
                        placeholder="Branch code"
                      />
                      <Input
                        label="SWIFT Code"
                        value={newSwift}
                        onChange={(e) => setNewSwift(e.target.value)}
                        placeholder="For international transfers"
                      />
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          Currency
                        </label>
                        <select
                          value={newCurrency}
                          onChange={(e) => setNewCurrency(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        >
                          <option value="LKR">LKR - Sri Lankan Rupee</option>
                          <option value="INR">INR - Indian Rupee</option>
                          <option value="USD">USD - US Dollar</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                      <Button variant="outline" onClick={() => setShowAddAccount(false)}>
                        Cancel
                      </Button>
                      <Button>Add Account</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="max-w-3xl">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-slate-900">Email Notifications</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Manage how you receive notifications about your vendor account
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      key: 'newOrders',
                      label: 'New Orders',
                      description: 'Get notified when you receive a new order',
                    },
                    {
                      key: 'orderUpdates',
                      label: 'Order Updates',
                      description: 'Notifications about order status changes and customer messages',
                    },
                    {
                      key: 'messages',
                      label: 'Messages',
                      description: 'Get notified when customers send you messages',
                    },
                    {
                      key: 'reviews',
                      label: 'Reviews',
                      description: 'Notifications when customers leave product reviews',
                    },
                    {
                      key: 'promotions',
                      label: 'Promotions & Tips',
                      description: 'Marketing tips and promotional opportunities',
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{item.label}</p>
                        <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                      </div>
                      <button
                        onClick={() => toggleNotification(item.key as keyof typeof notifications)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          notifications[item.key as keyof typeof notifications]
                            ? 'bg-primary-600'
                            : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            notifications[item.key as keyof typeof notifications]
                              ? 'translate-x-6'
                              : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </VendorLayout>
  );
}
