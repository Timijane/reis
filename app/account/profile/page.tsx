'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  onAuthStateChanged,
  signOut,
  type User,
} from 'firebase/auth';
import {
  ShoppingBag,
  Armchair,
  Tent,
  Sparkles,
  ShoppingCart,
  Package,
  UserRound,
  LogOut,
  ArrowUpRight,
  Mail,
  Phone,
  CircleUserRound,
} from 'lucide-react';
import { auth } from '@/lib/firebase';

type CustomerProfile = {
  uid: string;
  name: string;
  email: string;
  phone: string;
};

const destinations = [
  {
    title: 'Explore our collection',
    description: 'Discover furniture and event rental items.',
    href: '/booking/rentals',
    icon: Armchair,
  },
  {
    title: 'Tents & marquees',
    description: 'Find shelter options for your occasion.',
    href: '/booking/tents',
    icon: Tent,
  },
  {
    title: 'Book Us',
    description: 'Explore our styling portfolio and enquire.',
    href: '/booking/styling',
    icon: Sparkles,
  },
  {
    title: 'Shop',
    description: 'Explore the REIS collection.',
    href: '/shop',
    icon: ShoppingBag,
  },
  {
    title: 'Your cart',
    description: 'Review items before proceeding to checkout.',
    href: '/cart',
    icon: ShoppingCart,
  },
  {
    title: 'My orders',
    description: 'Review bookings and styling enquiries.',
    href: '/orders',
    icon: Package,
  },
];

export default function CustomerProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) {
        if (active) {
          router.replace(
            '/account/login?next=%2Faccount%2Fprofile',
          );
        }
        return;
      }

      try {
        const token = await user.getIdToken();

        const response = await fetch('/api/customer/profile', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || 'We could not load your profile.',
          );
        }

        if (active) {
          setProfile({
            uid: data.profile.uid,
            name: data.profile.name || user.displayName || 'REIS Customer',
            email: data.profile.email || user.email || '',
            phone: data.profile.phone || '',
          });
          setError('');
        }
      } catch {
        if (active) {
          setError(
            'We could not load your profile. Please check your connection and try again.',
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [router]);

  async function handleSignOut() {
    setSigningOut(true);

    try {
      await signOut(auth);
      router.replace('/account/login');
      router.refresh();
    } catch {
      setError('Unable to sign out. Please try again.');
      setSigningOut(false);
    }
  }

  return (
    <main className="reis-profile-page">
      <div className="reis-profile-container">
        <header className="reis-profile-heading">
          <div>
            <span className="reis-profile-eyebrow">
              YOUR REIS EXPERIENCE
            </span>
            <h1>
              Your space,
              <br />
              <em>your celebrations.</em>
            </h1>
            <p>
              Manage your details, discover our services and keep track
              of your event plans in one place.
            </p>
          </div>
        </header>

        {loading ? (
          <section className="reis-profile-state" aria-live="polite">
            <span className="reis-profile-spinner" />
            <p>Loading your account…</p>
          </section>
        ) : error && !profile ? (
          <section className="reis-profile-state" role="alert">
            <p>{error}</p>
            <button
              type="button"
              className="reis-profile-button"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </section>
        ) : profile ? (
          <>
            {error && (
              <p className="reis-profile-notice" role="alert">
                {error}
              </p>
            )}

            <section className="reis-profile-card">
              <div className="reis-profile-avatar" aria-hidden="true">
                <CircleUserRound size={34} strokeWidth={1.4} />
              </div>

              <div className="reis-profile-identity">
                <span className="reis-profile-eyebrow">
                  CUSTOMER ACCOUNT
                </span>
                <h2>{profile.name}</h2>
                <p>Your REIS customer profile</p>
              </div>

              <button
                type="button"
                className="reis-profile-signout"
                onClick={handleSignOut}
                disabled={signingOut}
              >
                <LogOut size={16} />
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>

              <div className="reis-profile-details">
                <div>
                  <Mail size={17} aria-hidden="true" />
                  <span>
                    <small>Email address</small>
                    <strong>{profile.email || 'Not provided'}</strong>
                  </span>
                </div>

                <div>
                  <Phone size={17} aria-hidden="true" />
                  <span>
                    <small>Phone number</small>
                    <strong>{profile.phone || 'Not provided'}</strong>
                  </span>
                </div>

                <div>
                  <UserRound size={17} aria-hidden="true" />
                  <span>
                    <small>Account</small>
                    <strong>Registered customer</strong>
                  </span>
                </div>
              </div>
            </section>

            <section className="reis-profile-services">
              <div className="reis-profile-section-heading">
                <div>
                  <span className="reis-profile-eyebrow">
                    YOUR REIS JOURNEY
                  </span>
                  <h2>Where would you like to go?</h2>
                </div>
              </div>

              <div className="reis-profile-grid">
                {destinations.map((destination) => {
                  const Icon = destination.icon;

                  return (
                    <Link
                      href={destination.href}
                      className="reis-profile-link-card"
                      key={destination.href}
                    >
                      <span className="reis-profile-link-icon">
                        <Icon size={23} strokeWidth={1.6} />
                      </span>

                      <span className="reis-profile-link-copy">
                        <strong>{destination.title}</strong>
                        <small>{destination.description}</small>
                      </span>

                      <ArrowUpRight
                        className="reis-profile-arrow"
                        size={19}
                        aria-hidden="true"
                      />
                    </Link>
                  );
                })}
              </div>
            </section>

            <footer className="reis-profile-footer">
              <span>REIS EVENT SERVICES</span>
              <Link href="/shop">Continue exploring <ArrowUpRight size={15} /></Link>
            </footer>
          </>
        ) : null}
      </div>
    </main>
  );
}
