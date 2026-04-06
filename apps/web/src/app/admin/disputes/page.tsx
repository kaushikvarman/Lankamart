'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'ESCALATED' | 'RESOLVED';
type DisputePriority = 'LOW' | 'MEDIUM' | 'HIGH';
type DisputeReason = 'NOT_RECEIVED' | 'NOT_AS_DESCRIBED' | 'DAMAGED' | 'WRONG_ITEM';

interface Dispute {
  id: string;
  orderId: string;
  buyer: string;
  reason: DisputeReason;
  status: DisputeStatus;
  priority: DisputePriority;
  createdAt: string;
  description: string;
  evidence?: string;
}

const statusColors = {
  OPEN: 'warning' as const,
  UNDER_REVIEW: 'bg-blue-100 text-blue-800 border-blue-200',
  ESCALATED: 'destructive' as const,
  RESOLVED: 'success' as const,
};

const priorityColors = {
  LOW: 'default' as const,
  MEDIUM: 'warning' as const,
  HIGH: 'destructive' as const,
};

const reasonLabels = {
  NOT_RECEIVED: 'Not Received',
  NOT_AS_DESCRIBED: 'Not as Described',
  DAMAGED: 'Damaged',
  WRONG_ITEM: 'Wrong Item',
};

const mockDisputes: Dispute[] = [
  {
    id: 'D-001',
    orderId: '#ORD-2448',
    buyer: 'David Kumar',
    reason: 'NOT_RECEIVED',
    status: 'OPEN',
    priority: 'HIGH',
    createdAt: '2026-04-05',
    description: 'Order was marked as delivered but I never received the package. Tracking shows it was left at the door but nothing was there when I checked.',
    evidence: 'Photo of empty doorstep, tracking screenshot',
  },
  {
    id: 'D-002',
    orderId: '#ORD-2445',
    buyer: 'Maria Garcia',
    reason: 'NOT_AS_DESCRIBED',
    status: 'UNDER_REVIEW',
    priority: 'MEDIUM',
    createdAt: '2026-04-03',
    description: 'Product description said "pure silk" but received item appears to be synthetic material. Color is also different from the photos.',
    evidence: 'Photos of received product, comparison with listing',
  },
  {
    id: 'D-003',
    orderId: '#ORD-2440',
    buyer: 'John Smith',
    reason: 'DAMAGED',
    status: 'ESCALATED',
    priority: 'HIGH',
    createdAt: '2026-04-02',
    description: 'Gemstone arrived with visible crack. Packaging was intact so damage likely occurred before shipping.',
    evidence: 'Photos of damaged item and packaging',
  },
  {
    id: 'D-004',
    orderId: '#ORD-2435',
    buyer: 'Lisa Wong',
    reason: 'WRONG_ITEM',
    status: 'RESOLVED',
    priority: 'LOW',
    createdAt: '2026-03-28',
    description: 'Ordered Ceylon black tea but received green tea instead.',
    evidence: 'Photos showing wrong product',
  },
  {
    id: 'D-005',
    orderId: '#ORD-2430',
    buyer: 'Ahmed Hassan',
    reason: 'NOT_AS_DESCRIBED',
    status: 'OPEN',
    priority: 'MEDIUM',
    createdAt: '2026-03-25',
    description: 'Spice quality is lower than described. Listed as "Grade A" but received product appears to be lower grade.',
    evidence: 'Product photos, lab test results',
  },
];

type TabKey = 'all' | 'open' | 'under_review' | 'escalated' | 'resolved';

const tabs: { key: TabKey; label: string; count: number }[] = [
  { key: 'all', label: 'All', count: 15 },
  { key: 'open', label: 'Open', count: 5 },
  { key: 'under_review', label: 'Under Review', count: 3 },
  { key: 'escalated', label: 'Escalated', count: 2 },
  { key: 'resolved', label: 'Resolved', count: 5 },
];

export default function AdminDisputesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [expandedDispute, setExpandedDispute] = useState<string | null>(null);
  const [resolutionType, setResolutionType] = useState<string>('');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');

  const toggleExpand = (id: string) => {
    setExpandedDispute(expandedDispute === id ? null : id);
  };

  const handleResolve = (disputeId: string) => {
    console.log('Resolving dispute:', disputeId, { resolutionType, resolutionNotes });
    setResolutionType('');
    setResolutionNotes('');
    setExpandedDispute(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dispute Management</h1>
          <p className="text-slate-600 mt-1">Review and resolve buyer-vendor disputes</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200">
          <div className="flex gap-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-1 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Disputes Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Order #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Buyer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {mockDisputes.map((dispute) => (
                    <>
                      <tr key={dispute.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleExpand(dispute.id)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              {expandedDispute === dispute.id ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                            <span className="text-sm font-medium text-slate-900">{dispute.id}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-primary-600">
                            {dispute.orderId}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {dispute.buyer}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {reasonLabels[dispute.reason]}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {dispute.status === 'OPEN' || dispute.status === 'ESCALATED' || dispute.status === 'RESOLVED' ? (
                            <Badge variant={statusColors[dispute.status]}>
                              {dispute.status.replace('_', ' ')}
                            </Badge>
                          ) : (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[dispute.status]}`}
                            >
                              {dispute.status.replace('_', ' ')}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={priorityColors[dispute.priority]}>{dispute.priority}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {new Date(dispute.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleExpand(dispute.id)}
                          >
                            {expandedDispute === dispute.id ? 'Close' : 'Review'}
                          </Button>
                        </td>
                      </tr>
                      {expandedDispute === dispute.id && (
                        <tr key={`${dispute.id}-details`}>
                          <td colSpan={8} className="px-6 py-6 bg-slate-50">
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-sm font-semibold text-slate-900 mb-2">
                                  Description
                                </h4>
                                <p className="text-sm text-slate-600">{dispute.description}</p>
                              </div>

                              {dispute.evidence && (
                                <div>
                                  <h4 className="text-sm font-semibold text-slate-900 mb-2">
                                    Evidence
                                  </h4>
                                  <p className="text-sm text-slate-600">{dispute.evidence}</p>
                                </div>
                              )}

                              {dispute.status !== 'RESOLVED' && (
                                <div className="border-t border-slate-200 pt-4">
                                  <h4 className="text-sm font-semibold text-slate-900 mb-3">
                                    Resolution
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Resolution Type
                                      </label>
                                      <select
                                        value={resolutionType}
                                        onChange={(e) => setResolutionType(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                      >
                                        <option value="">Select resolution...</option>
                                        <option value="buyer">Resolve for Buyer (Refund)</option>
                                        <option value="vendor">Resolve for Vendor (No Refund)</option>
                                        <option value="partial">Partial Refund</option>
                                        <option value="replacement">Send Replacement</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Resolution Notes
                                      </label>
                                      <textarea
                                        value={resolutionNotes}
                                        onChange={(e) => setResolutionNotes(e.target.value)}
                                        placeholder="Enter resolution details..."
                                        rows={3}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex gap-3 mt-4">
                                    <Button
                                      onClick={() => handleResolve(dispute.id)}
                                      disabled={!resolutionType || !resolutionNotes}
                                    >
                                      Submit Resolution
                                    </Button>
                                    <Button variant="outline" onClick={() => setExpandedDispute(null)}>
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
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
