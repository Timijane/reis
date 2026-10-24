import type { ReactNode } from 'react';
import CustomerGate from '@/components/customer/CustomerGate';
import CustomerNavigation from '@/components/customer/CustomerNavigation';

export default function CustomerLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <CustomerNavigation />
      <CustomerGate>{children}</CustomerGate>
    </>
  );
}
