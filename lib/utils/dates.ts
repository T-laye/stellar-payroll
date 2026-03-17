export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getNextPaymentDate(frequency: 'weekly' | 'biweekly' | 'monthly', from?: Date): Date {
  const date = from ? new Date(from) : new Date();
  
  switch (frequency) {
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'biweekly':
      date.setDate(date.getDate() + 14);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
  }
  
  return date;
}

export function getPaymentStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'text-green-600';
    case 'processing':
      return 'text-blue-600';
    case 'pending':
      return 'text-yellow-600';
    case 'failed':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

export function getPaymentStatusBg(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-50';
    case 'processing':
      return 'bg-blue-50';
    case 'pending':
      return 'bg-yellow-50';
    case 'failed':
      return 'bg-red-50';
    default:
      return 'bg-gray-50';
  }
}
