'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { label: 'Shop', href: '/shop' },
  { label: 'Event rentals', href: '/booking/rentals' },
  { label: 'Tents & marquees', href: '/booking/tents' },
  { label: 'Event styling', href: '/booking/styling' },
  { label: 'Booking options', href: '/booking' },
  { label: 'Shopping bag', href: '/cart' },
  { label: 'My orders', href: '/orders' },
  { label: 'My account', href: '/account/login' },
];

export default function CustomerNavigation() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  function closeMenu() {
    setOpen(false);
  }

  return (
    <header className="reis-customer-nav">
      <div className="reis-customer-nav-bar">
        <Link
          href="/shop"
          className="reis-customer-brand"
          onClick={closeMenu}
          aria-label="REIS Event Services — shop"
        >
          <span className="reis-customer-brand-name">
            REIS
          </span>
          <span className="reis-customer-brand-caption">
            EVENT SERVICES
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

            {links.map((link, index) => {
              const active =
                pathname === link.href ||
                (link.href !== '/shop' &&
                  link.href !== '/booking' &&
                  pathname.startsWith(`${link.href}/`));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  aria-current={active ? 'page' : undefined}
                  className={`reis-customer-menu-link${active ? ' is-active' : ''}`}
                >
                  <span className="reis-customer-menu-number">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span>{link.label}</span>
                  <span className="reis-customer-menu-arrow" aria-hidden="true">
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
  );
}
