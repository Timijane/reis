'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

type AccountFormProps = {
  mode: 'register' | 'login';
};

function destination(): string {
  if (typeof window === 'undefined') return '/account/profile';

  const requested = new URLSearchParams(window.location.search).get('next');

  if (
    requested &&
    requested.startsWith('/') &&
    !requested.startsWith('//') &&
    !requested.startsWith('/account/login') &&
    !requested.startsWith('/account/register') &&
    !requested.startsWith('/admin')
  ) {
    return requested;
  }

  return '/account/profile';
}

export default function AccountForm({ mode }: AccountFormProps) {
  const router = useRouter();
  const registering = mode === 'register';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const cleanEmail = email.trim().toLowerCase();

      if (registering) {
        const cleanName = name.trim();
        const cleanPhone = phone.trim();

        if (cleanName.length < 2) {
          throw new Error('Please enter your full name.');
        }

        if (cleanPhone.length < 7) {
          throw new Error('Please enter a valid phone number.');
        }

        if (password.length < 8) {
          throw new Error('Your password must contain at least 8 characters.');
        }

        const existingUser = auth.currentUser;
          const customerUser =
            existingUser?.email?.toLowerCase() === cleanEmail
              ? existingUser
              : (
                  await createUserWithEmailAndPassword(
                    auth,
                    cleanEmail,
                    password,
                  )
                ).user;

        try {
          await updateProfile(customerUser, {
            displayName: cleanName,
          });

          const token = await customerUser.getIdToken();

          const response = await fetch('/api/customer/profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: cleanName,
              phone: cleanPhone,
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(
              result.error || 'Your profile could not be saved.',
            );
          }
        } catch {
            setError(
              'Your account exists, but customer profile setup failed. Check your connection and submit again to retry.',
            );
            return;
          }
      } else {
        await signInWithEmailAndPassword(auth, cleanEmail, password);
      }

      router.replace(destination());
      router.refresh();
    } catch (err: unknown) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String(err.code)
          : '';

      const message =
        err instanceof Error ? err.message : '';

      const friendlyMessages: Record<string, string> = {
        'auth/email-already-in-use':
          'An account already exists with this email. Please sign in instead.',
        'auth/invalid-email':
          'Please enter a valid email address.',
        'auth/invalid-credential':
          'Your email or password is incorrect.',
        'auth/user-not-found':
          'No account was found with these details. Please register first.',
        'auth/wrong-password':
          'Your email or password is incorrect.',
        'auth/weak-password':
          'Choose a stronger password with at least 8 characters.',
        'auth/too-many-requests':
          'Too many attempts. Please wait a while and try again.',
        'auth/network-request-failed':
          'Network connection failed. Please check your internet and try again.',
      };

      setError(
        friendlyMessages[code] ||
          message ||
          'We could not complete your request. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="account-page">
      <section className="account-panel">
        <Link href="/" className="account-brand">
          REIS <span>EVENT SERVICES</span>
        </Link>

        <p className="account-eyebrow">
          YOUR PERSONAL CUSTOMER ACCOUNT
        </p>

        <h1>
          {registering ? (
            <>Make room for <em>memories.</em></>
          ) : (
            <>Welcome <em>back.</em></>
          )}
        </h1>

        <p className="account-intro">
          {registering
            ? 'Create your account to explore our collection, plan your event and keep your bookings together.'
            : 'Sign in to continue shopping, manage your bookings and review your enquiries.'}
        </p>

        <form onSubmit={submit} className="account-form">
          {registering && (
            <label>
              Full name
              <input
                type="text"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={120}
              />
            </label>
          )}

          <label>
            Email address
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          {registering && (
            <label>
              Phone number
              <input
                type="tel"
                name="phone"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                required
                minLength={7}
                maxLength={40}
              />
            </label>
          )}

          <label className="account-password-label">
          Password
          <div className="account-password-field">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete={registering ? 'new-password' : 'current-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={registering ? 8 : undefined}
            />
            <button
              type="button"
              className="account-password-toggle"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              {showPassword ? 'HIDE' : 'SHOW'}
            </button>
          </div>
        </label>

          {!registering && (
            <div className="account-forgot">
              <Link href="/account/forgot-password">
                Forgot your password?
              </Link>
            </div>
          )}

          {error && (
            <p className="account-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="account-submit"
            disabled={busy}
          >
            {busy
              ? 'PLEASE WAIT…'
              : registering
                ? 'CREATE ACCOUNT'
                : 'SIGN IN'}
          </button>
        </form>

        <p className="account-switch">
          {registering
            ? 'Already have an account? '
            : "Don't have an account? "}

          <Link
            href={
              registering
                ? `/account/login${typeof window !== 'undefined' ? window.location.search : ''}`
                : `/account/register${typeof window !== 'undefined' ? window.location.search : ''}`
            }
          >
            {registering ? 'Sign in' : 'Create an account'}
          </Link>
        </p>

        <Link href="/" className="account-home">
          ← Return to the REIS homepage
        </Link>
      </section>

      <aside className="account-image">
        <div className="account-image-overlay" />
        <div className="account-image-copy">
          <p>THOUGHTFULLY CURATED</p>
          <h2>Every detail.<br />Every occasion.<br /><em>Every memory.</em></h2>
        </div>
      </aside>

      <style jsx>{`
        .account-page {
          min-height: 100vh;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 0.85fr);
          background: #faf9f6;
          color: #161614;
          font-family: var(--sans, Arial, sans-serif);
        }

        .account-panel {
          width: 100%;
          max-width: 590px;
          padding: 48px clamp(24px, 6vw, 84px);
          margin: auto;
        }

        .account-brand {
          display: inline-flex;
          flex-direction: column;
          gap: 5px;
          font-family: Georgia, serif;
          font-size: 25px;
          letter-spacing: 0.15em;
        }

        .account-brand span {
          font-family: Arial, sans-serif;
          font-size: 8px;
          letter-spacing: 0.25em;
          color: #77756e;
        }

        .account-eyebrow {
          margin-top: 66px;
          font-size: 9px;
          letter-spacing: 0.2em;
          color: #68765b;
        }

        h1 {
          margin: 18px 0;
          font-family: var(--serif, Georgia, serif);
          font-size: clamp(42px, 5vw, 66px);
          font-weight: 500;
          line-height: 0.98;
          letter-spacing: -0.035em;
        }

        h1 em,
        .account-image-copy em {
          font-weight: 400;
        }

        .account-intro {
          max-width: 420px;
          color: #77756e;
          font-size: 13px;
          line-height: 1.9;
          margin-bottom: 34px;
        }

        .account-form {
          display: grid;
          gap: 19px;
        }

        .account-form label {
          display: grid;
          gap: 9px;
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .account-form input {
          width: 100%;
          min-height: 49px;
          border: 1px solid #d8d5ce;
          border-radius: 0;
          padding: 12px 14px;
          background: #fff;
          color: #161614;
          font: 14px Arial, sans-serif;
          letter-spacing: normal;
          text-transform: none;
        }

        .account-form input:focus {
          outline: 1px solid #68765b;
          border-color: #68765b;
        }

        .account-password-field {
          position: relative;
          display: flex;
          align-items: center;
        }

        .account-password-field input {
          padding-right: 76px;
        }

        .account-password-toggle {
          position: absolute;
          right: 12px;
          min-height: 36px;
          padding: 0 4px;
          border: 0;
          background: transparent;
          color: #59664e;
          font: 600 10px Arial, sans-serif;
          letter-spacing: 0.08em;
          cursor: pointer;
        }

        .account-password-toggle:focus-visible {
          outline: 2px solid #68765b;
          outline-offset: 3px;
        }

        .account-forgot {
          margin-top: -7px;
          text-align: right;
          font-size: 11px;
        }

        .account-forgot a,
        .account-switch a {
          color: #59664e;
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .account-error {
          padding: 12px;
          background: #f7eae7;
          color: #8c3026;
          font-size: 12px;
          line-height: 1.7;
        }

        .account-submit {
          min-height: 52px;
          border: 1px solid #161614;
          background: #161614;
          color: #fff;
          font-size: 10px;
          letter-spacing: 0.16em;
          cursor: pointer;
        }

        .account-submit:disabled {
          cursor: wait;
          opacity: 0.65;
        }

        .account-switch {
          margin-top: 25px;
          font-size: 12px;
          color: #77756e;
          line-height: 1.8;
        }

        .account-home {
          display: inline-block;
          margin-top: 20px;
          font-size: 10px;
          color: #77756e;
        }

        .account-image {
          min-height: 100vh;
          position: relative;
          display: flex;
          align-items: flex-end;
          padding: 8%;
          color: #fff;
          background:
            url('https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1600&q=85')
            center / cover;
        }

        .account-image-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(15, 15, 13, 0.05),
            rgba(15, 15, 13, 0.75)
          );
        }

        .account-image-copy {
          position: relative;
          z-index: 1;
        }

        .account-image-copy p {
          font-size: 9px;
          letter-spacing: 0.22em;
        }

        .account-image-copy h2 {
          font-family: var(--serif, Georgia, serif);
          font-size: clamp(38px, 4vw, 64px);
          font-weight: 500;
          line-height: 1;
        }

        @media (max-width: 760px) {
          .account-page {
            display: block;
          }

          .account-panel {
            max-width: 540px;
            padding: 35px 24px 50px;
          }

          .account-eyebrow {
            margin-top: 44px;
          }

          .account-image {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}
