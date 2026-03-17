import { Payment } from '@/lib/stores/payroll-store';

export function processPayment(payment: Payment): Payment {
  // Simulate payment processing
  const statuses: Array<'pending' | 'processing' | 'completed' | 'failed'> = [
    'pending',
    'processing',
    'completed',
    'completed', // 50% success rate
    'completed',
  ];

  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

  return {
    ...payment,
    status: randomStatus,
    stellarTxHash: randomStatus === 'completed' ? `GBUL${Math.random().toString(36).substring(2, 15)}` : undefined,
    completedAt: randomStatus === 'completed' ? new Date().toISOString() : undefined,
  };
}

export function generateStellarTransaction(): string {
  return `GBUL${Math.random().toString(36).substring(2, 15).toUpperCase()}${Math.random().toString(36).substring(2, 15).toUpperCase()}`;
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function calculatePayrollTotals(payments: Payment[]) {
  return {
    pending: payments.filter((p) => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
    processing: payments.filter((p) => p.status === 'processing').reduce((sum, p) => sum + p.amount, 0),
    completed: payments.filter((p) => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0),
    failed: payments.filter((p) => p.status === 'failed').reduce((sum, p) => sum + p.amount, 0),
  };
}
