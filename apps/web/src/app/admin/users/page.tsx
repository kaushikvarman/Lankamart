'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Ban, CheckCircle, Search } from 'lucide-react';
import { useState } from 'react';

type UserRole = 'BUYER' | 'VENDOR' | 'ADMIN' | 'SUPER_ADMIN';
type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';

const roleColors = {
  BUYER: 'default' as const,
  VENDOR: 'bg-blue-100 text-blue-800 border-blue-200',
  ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
  SUPER_ADMIN: 'bg-red-100 text-red-800 border-red-200',
};

const statusColors = {
  ACTIVE: 'success' as const,
  SUSPENDED: 'destructive' as const,
  PENDING: 'warning' as const,
};

const mockUsers = [
  {
    id: 'u-1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    role: 'BUYER' as UserRole,
    status: 'ACTIVE' as UserStatus,
    joinedDate: '2025-12-10',
    lastLogin: '2026-04-05',
  },
  {
    id: 'u-2',
    name: 'Rajesh Patel',
    email: 'rajesh@mumbaiSpice.com',
    role: 'VENDOR' as UserRole,
    status: 'ACTIVE' as UserStatus,
    joinedDate: '2026-01-15',
    lastLogin: '2026-04-04',
  },
  {
    id: 'u-3',
    name: 'Emily Watson',
    email: 'emily.w@example.com',
    role: 'BUYER' as UserRole,
    status: 'ACTIVE' as UserStatus,
    joinedDate: '2026-02-20',
    lastLogin: '2026-04-03',
  },
  {
    id: 'u-4',
    name: 'Admin User',
    email: 'admin@lankamart.com',
    role: 'SUPER_ADMIN' as UserRole,
    status: 'ACTIVE' as UserStatus,
    joinedDate: '2025-10-01',
    lastLogin: '2026-04-05',
  },
  {
    id: 'u-5',
    name: 'Michael Chen',
    email: 'michael.chen@example.com',
    role: 'BUYER' as UserRole,
    status: 'SUSPENDED' as UserStatus,
    joinedDate: '2026-03-05',
    lastLogin: '2026-03-28',
  },
  {
    id: 'u-6',
    name: 'Nimal Fernando',
    email: 'nimal@colombocraft.lk',
    role: 'VENDOR' as UserRole,
    status: 'ACTIVE' as UserStatus,
    joinedDate: '2026-02-10',
    lastLogin: '2026-04-05',
  },
  {
    id: 'u-7',
    name: 'Support Staff',
    email: 'support@lankamart.com',
    role: 'ADMIN' as UserRole,
    status: 'ACTIVE' as UserStatus,
    joinedDate: '2025-11-15',
    lastLogin: '2026-04-04',
  },
  {
    id: 'u-8',
    name: 'John Doe',
    email: 'john.new@example.com',
    role: 'BUYER' as UserRole,
    status: 'PENDING' as UserStatus,
    joinedDate: '2026-04-05',
    lastLogin: '2026-04-05',
  },
];

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-600 mt-1">Manage users, roles, and permissions</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-slate-600">Total Users</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">2,280</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-slate-600">Buyers</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">2,180</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-slate-600">Vendors</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">45</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-slate-600">Admins</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">3</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-slate-600">Suspended</p>
              <p className="text-2xl font-bold text-red-600 mt-1">12</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <select className="px-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="">All Roles</option>
                <option value="buyer">Buyer</option>
                <option value="vendor">Vendor</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
              <select className="px-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {mockUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {user.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900">{user.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.role === 'BUYER' ? (
                          <Badge variant={roleColors[user.role]}>
                            {user.role.replace('_', ' ')}
                          </Badge>
                        ) : (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleColors[user.role]}`}
                          >
                            {user.role.replace('_', ' ')}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={statusColors[user.status]}>{user.status}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {new Date(user.joinedDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {new Date(user.lastLogin).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 text-primary-600 hover:bg-primary-50 rounded"
                            title="Edit Role"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            className={`p-1.5 rounded ${
                              user.status === 'SUSPENDED'
                                ? 'text-green-600 hover:bg-green-50'
                                : 'text-red-600 hover:bg-red-50'
                            }`}
                            title={user.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
                          >
                            {user.status === 'SUSPENDED' ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Ban className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
