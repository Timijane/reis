import type { ReactNode } from 'react';
import CustomerNavigation from '@/components/customer/CustomerNavigation';

export default function CustomerLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <CustomerNavigation />
      {children}
    </>
  );
}
