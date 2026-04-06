'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { User, Mail, Lock, Building } from 'lucide-react';

export default function RegisterPage() {
  const [accountType, setAccountType] = useState<'buyer' | 'vendor'>('buyer');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        {/* Logo */}
        <CardHeader className="text-center pb-8">
          <Link href="/" className="inline-block">
            <div className="text-3xl font-bold mb-2">
              <span className="text-primary-600">Lanka</span>
              <span className="text-accent-500">Mart</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Create Account
          </h1>
          <p className="text-slate-600">Join LankaMart today</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Account Type Toggle */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              I want to
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAccountType('buyer')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  accountType === 'buyer'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <User
                  className={`w-6 h-6 mx-auto mb-2 ${
                    accountType === 'buyer' ? 'text-primary-600' : 'text-slate-400'
                  }`}
                />
                <div
                  className={`font-medium ${
                    accountType === 'buyer' ? 'text-primary-700' : 'text-slate-700'
                  }`}
                >
                  Buy Products
                </div>
              </button>
              <button
                type="button"
                onClick={() => setAccountType('vendor')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  accountType === 'vendor'
                    ? 'border-accent-500 bg-accent-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Building
                  className={`w-6 h-6 mx-auto mb-2 ${
                    accountType === 'vendor' ? 'text-accent-600' : 'text-slate-400'
                  }`}
                />
                <div
                  className={`font-medium ${
                    accountType === 'vendor' ? 'text-accent-700' : 'text-slate-700'
                  }`}
                >
                  Sell Products
                </div>
              </button>
            </div>
          </div>

          {/* Registration Form */}
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="text"
                label="First Name"
                placeholder="John"
                required
              />
              <Input
                type="text"
                label="Last Name"
                placeholder="Doe"
                required
              />
            </div>

            {accountType === 'vendor' && (
              <Input
                type="text"
                label="Business Name"
                placeholder="Your Business Name"
                icon={<Building className="w-5 h-5" />}
                required
              />
            )}

            <Input
              type="email"
              label="Email Address"
              placeholder="you@example.com"
              icon={<Mail className="w-5 h-5" />}
              required
            />

            <Input
              type="password"
              label="Password"
              placeholder="Create a strong password"
              icon={<Lock className="w-5 h-5" />}
              required
            />

            <Input
              type="password"
              label="Confirm Password"
              placeholder="Re-enter your password"
              icon={<Lock className="w-5 h-5" />}
              required
            />

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 mt-1 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                required
              />
              <span className="text-sm text-slate-700">
                I agree to the{' '}
                <Link
                  href="/terms"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link
                  href="/privacy"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Privacy Policy
                </Link>
              </span>
            </label>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              variant={accountType === 'vendor' ? 'secondary' : 'primary'}
            >
              Create Account
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-500">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social Registration */}
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-sm font-medium text-slate-700">Google</span>
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors">
              <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span className="text-sm font-medium text-slate-700">Facebook</span>
            </button>
          </div>

          {/* Sign In Link */}
          <div className="text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
