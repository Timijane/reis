/**
 * Returns the canonical base URL used for REIS links in server-side code.
 *
 * Configure NEXT_PUBLIC_SITE_URL in Vercel for the production custom domain.
 * Local development defaults to localhost; production defaults to the stable
 * REIS Vercel URL until the custom domain is configured.
 */
export function getSiteUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, '');
  }

  if (process.env.NODE_ENV !== 'production') {
    return 'http://localhost:3000';
  }

  return 'https://reis-zeta.vercel.app';
}
