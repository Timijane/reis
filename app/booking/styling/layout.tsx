import type { ReactNode } from 'react';

export default function CustomerProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
