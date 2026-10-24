'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/firebase';

export default function CustomerGate({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthenticated(true);
        setChecking(false);
        return;
      }

      setAuthenticated(false);
      setChecking(false);

      const next = `${pathname}${window.location.search}`;
      router.replace(
        `/account/login?next=${encodeURIComponent(next)}`
      );
    });

    return unsubscribe;
  }, [pathname, router]);

  if (checking || !authenticated) {
    return (
      <main className="customer-gate-loading">
        <div className="loading-content">
          <p className="brand">REIS</p>
          <p className="message">
            {checking
              ? 'Preparing your experience…'
              : 'Redirecting to your account…'}
          </p>
          <div className="loading-line" />
          <Link href="/account/login">Continue to sign in</Link>
        </div>

        <style jsx>{`
          .customer-gate-loading {
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 24px;
            background: #faf9f6;
            color: #161614;
            font-family: Arial, sans-serif;
          }
          .loading-content {
            width: 100%;
            max-width: 300px;
            text-align: center;
          }
          .brand {
            font-family: Georgia, serif;
            font-size: 30px;
            letter-spacing: .2em;
          }
          .message {
            margin: 18px 0;
            color: #77756e;
            font-size: 12px;
          }
          .loading-line {
            height: 2px;
            margin: 22px 0;
            overflow: hidden;
            background: #e4e1d9;
          }
          .loading-line::after {
            display: block;
            width: 40%;
            height: 100%;
            background: #68765b;
            content: '';
            animation: loading 1.2s ease-in-out infinite alternate;
          }
          a {
            color: #68765b;
            font-size: 11px;
          }
          @keyframes loading {
            from { transform: translateX(0); }
            to { transform: translateX(150%); }
          }
          @media (prefers-reduced-motion: reduce) {
            .loading-line::after { animation: none; }
          }
        `}</style>
      </main>
    );
  }

  return <>{children}</>;
}
