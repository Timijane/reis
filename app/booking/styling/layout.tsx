import type { ReactNode } from 'react';
import CustomerGate from '@/components/customer/CustomerGate';

export default function CustomerProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <CustomerGate>{children}</CustomerGate>;
}
