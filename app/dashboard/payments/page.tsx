'use client';

import { useState, useEffect } from 'react';
import { usePayrollStore } from '@/lib/stores/payroll-store';
import { useEmployeeStore } from '@/lib/stores/employee-store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function PaymentsPage() {
  const payments = usePayrollStore((state) => state.payments);
  const updatePayment = usePayrollStore((state) => state.updatePayment);
  const groups = usePayrollStore((state) => state.getGroups());
  const employees = useEmployeeStore((state) => state.getEmployees());
  
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Simulate payment processing
  useEffect(() => {
    const interval = setInterval(() => {
      const processingPayments = payments.filter((p) => p.status === 'processing');
      processingPayments.forEach((payment) => {
        if (Math.random() > 0.3) {
          updatePayment(payment.id, { status: 'completed', completedAt: new Date().toISOString() });
        }
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [payments, updatePayment]);

  const filteredPayments =
    selectedStatus === 'all' ? payments : payments.filter((p) => p.status === selectedStatus);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'processing':
        return 'bg-blue-100 text-blue-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const stats = [
    {
      label: 'Total Payments',
      value: payments.length,
      color: 'text-blue-600',
    },
    {
      label: 'Completed',
      value: payments.filter((p) => p.status === 'completed').length,
      color: 'text-green-600',
    },
    {
      label: 'Processing',
      value: payments.filter((p) => p.status === 'processing').length,
      color: 'text-blue-600',
    },
    {
      label: 'Pending',
      value: payments.filter((p) => p.status === 'pending').length,
      color: 'text-yellow-600',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payments</h1>
          <p className="mt-2 text-foreground/60">Track and manage your cross-border payments</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-6">
            <p className="text-sm font-medium text-foreground/60">{stat.label}</p>
            <p className={`mt-2 text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payments List */}
      {filteredPayments.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-foreground/60">
            {payments.length === 0
              ? 'No payments yet. Process a payroll group to get started.'
              : 'No payments with this status.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPayments.map((payment) => {
            const employee = employees.find((e) => e.id === payment.employeeId);
            const group = groups.find((g) => g.id === payment.groupId);

            return (
              <Card key={payment.id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(payment.status)}
                      <div>
                        <h3 className="font-semibold text-foreground">{employee?.name}</h3>
                        <p className="text-sm text-foreground/60">{group?.name}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      <div>
                        <p className="text-xs text-foreground/60">Amount</p>
                        <p className="font-semibold text-foreground">
                          {payment.amount} {payment.currency}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-foreground/60">Status</p>
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-foreground/60">Created</p>
                        <p className="text-sm text-foreground">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {payment.completedAt && (
                        <div>
                          <p className="text-xs text-foreground/60">Completed</p>
                          <p className="text-sm text-foreground">
                            {new Date(payment.completedAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {payment.stellarTxHash && (
                      <div className="rounded-lg bg-muted p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-foreground/60">Stellar Transaction Hash</p>
                            <p className="font-mono text-xs text-foreground">
                              {payment.stellarTxHash.substring(0, 16)}...
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(payment.stellarTxHash!)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {payment.status === 'pending' && (
                      <div className="rounded-lg bg-yellow-50 p-3">
                        <p className="text-xs text-yellow-800">
                          Payment is pending. It will be processed soon.
                        </p>
                      </div>
                    )}

                    {payment.status === 'processing' && (
                      <div className="rounded-lg bg-blue-50 p-3">
                        <p className="text-xs text-blue-800">
                          Payment is being processed. This typically takes 5-30 minutes.
                        </p>
                      </div>
                    )}

                    {payment.status === 'failed' && (
                      <div className="rounded-lg bg-red-50 p-3">
                        <p className="text-xs text-red-800">
                          Payment failed. Please retry or contact support.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center">
                    {payment.status === 'processing' && (
                      <div className="text-right">
                        <div className="inline-block rounded-full bg-blue-100 p-2">
                          <Clock className="h-5 w-5 text-blue-600 animate-spin" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
