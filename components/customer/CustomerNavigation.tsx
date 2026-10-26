'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getHomepageContent } from '@/lib/cms/homepage';
import { Home, ShoppingBag, Armchair, Tent, Sparkles, ShoppingCart, Package, UserRound } from 'lucide-react';

const links = [
  { label: 'Home', href: '/', Icon: Home },
  { label: 'Shop', href: '/shop', Icon: ShoppingBag },
  { label: 'Event rentals', href: '/booking/rentals', Icon: Armchair },
  { label: 'Tents & marquees', href: '/booking/tents', Icon: Tent },
  { label: 'Book Us', href: '/booking/styling', Icon: Sparkles },
  { label: 'Cart', href: '/cart', Icon: ShoppingCart },
  { label: 'My orders', href: '/orders', Icon: Package },
  { label: 'My account', href: '/account/login', Icon: UserRound },
];

export default function CustomerNavigation() {
  const [open, setOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [brandName, setBrandName] = useState('REIS EVENT');
  const [brandSubtext, setBrandSubtext] = useState('SERVICES');
  const [announcement, setAnnouncement] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;

    getHomepageContent()
      .then((content) => {
        if (mounted) {
          setLogoUrl(content.logoUrl || '');
          setBrandName(content.brandName || 'REIS EVENT');
          setBrandSubtext(content.brandSubtext || 'SERVICES');
          setAnnouncement(content.announcement || '');
        }
      })
      .catch(() => {
        // Keep the REIS text fallback if CMS content is unavailable.
      });

    function refreshCart() {
      try {
        const stored = localStorage.getItem('reis-cart');
        const parsed: unknown = stored ? JSON.parse(stored) : [];

        if (!Array.isArray(parsed)) {
          setCartCount(0);
          return;
        }

        const count = parsed.reduce((total: number, item: unknown) => {
          if (!item || typeof item !== 'object') return total;

          const quantity = Number(
            (item as { quantity?: unknown }).quantity
          );

          return total + (
            Number.isFinite(quantity) && quantity > 0
              ? Math.floor(quantity)
              : 1
          );
        }, 0);

        setCartCount(count);
      } catch {
        setCartCount(0);
      }
    }

    refreshCart();

    window.addEventListener('reis-cart-updated', refreshCart);
    window.addEventListener('storage', refreshCart);

    return () => {
      mounted = false;
      window.removeEventListener('reis-cart-updated', refreshCart);
      window.removeEventListener('storage', refreshCart);
    };
  }, []);

  function closeMenu() {
    setOpen(false);
  }

  function LogoMark() {
    return logoUrl ? (
      <img
        src={logoUrl}
        alt=""
        className="reis-customer-menu-icon"
      />
    ) : (
      <span className="reis-customer-menu-icon reis-customer-menu-fallback">
        RIS
      </span>
    );
  }

  return (
    <>
      {announcement && (
        <div className="reis-customer-announcement">{announcement}</div>
      )}
      <header className="reis-customer-nav">
        <div className="reis-customer-nav-bar">
          <Link
            href="/shop"
            className="reis-customer-brand"
            onClick={closeMenu}
            aria-label={`${brandName} ${brandSubtext} — shop`}
          >
            <LogoMark />
            <span className="reis-customer-brand-copy">
              <span className="reis-customer-brand-name">{brandName}</span>
              <span className="reis-customer-brand-caption">
                {brandSubtext}
              </span>
            </span>
          </Link>

          <button
            type="button"
            className={`reis-customer-menu-toggle${open ? ' is-open' : ''}`}
            aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={open}
            aria-controls="reis-customer-menu"
            onClick={() => setOpen((value) => !value)}
          >
            <span />
            <span />
            <span />
            <span className="reis-customer-menu-label">
              {open ? 'CLOSE' : 'MENU'}
            </span>
          </button>
        </div>

        {open && (
          <div
            className="reis-customer-menu-backdrop"
            onClick={closeMenu}
          >
            <nav
              id="reis-customer-menu"
              className="reis-customer-menu"
              aria-label="Customer navigation"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="reis-customer-menu-eyebrow">
                REIS EVENT SERVICES
              </p>

              {links.map((link) => {
                const active =
                  pathname === link.href ||
                  (link.href !== '/shop' &&
                    pathname.startsWith(`${link.href}/`));

                const Icon = link.Icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    aria-current={active ? 'page' : undefined}
                    className={`reis-customer-menu-link${active ? ' is-active' : ''}`}
                  >
                    <Icon className="reis-customer-nav-icon" size={21} strokeWidth={1.7} aria-hidden="true" />
                    <span>{link.label}</span>
                    {link.href === '/cart' && cartCount > 0 && (
                      <span className="reis-customer-menu-count">
                        {cartCount}
                      </span>
                    )}
                    <span
                      className="reis-customer-menu-arrow"
                      aria-hidden="true"
                    >
                      ↗
                    </span>
                  </Link>
                );
              })}

              <p className="reis-customer-menu-footer">
                We style your event, you create memories.
              </p>
            </nav>
          </div>
        )}
      </header>

      {cartCount > 0 && pathname !== '/cart' && (
        <Link
          href="/cart"
          className="reis-floating-cart"
          aria-label={`Open cart with ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
        >
          <svg
            width="23"
            height="23"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.5L21 8H6" />
            <circle cx="10" cy="20" r="1" />
            <circle cx="18" cy="20" r="1" />
          </svg>

          <span>Cart</span>
          <span className="reis-floating-cart-count">{cartCount}</span>
        </Link>
      )}
    </>
  );
}
