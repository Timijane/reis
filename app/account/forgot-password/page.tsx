'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    setError('');

    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      setMessage(
        'If an account exists for this email, a password-reset email will be sent. Check your inbox and spam folder.'
      );
    } catch (err: unknown) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String(err.code)
          : '';

      if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait a while and try again.');
      } else if (code === 'auth/network-request-failed') {
        setError('Network connection failed. Please try again.');
      } else {
        setError('We could not process your request. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="reset-page">
      <section className="reset-panel">
        <Link href="/" className="reset-brand">
          REIS <span>EVENT SERVICES</span>
        </Link>

        <div className="reset-content">
          <p className="reset-eyebrow">ACCOUNT RECOVERY</p>
          <h1>Find your way <em>back.</em></h1>
          <p className="reset-intro">
            Enter the email address associated with your REIS customer
            account. We will send instructions to reset your password.
          </p>

          <form onSubmit={handleSubmit} className="reset-form">
            <label htmlFor="reset-email">Email address</label>
            <input
              id="reset-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            {message && (
              <p className="reset-success" role="status">{message}</p>
            )}
            {error && (
              <p className="reset-error" role="alert">{error}</p>
            )}

            <button type="submit" disabled={busy}>
              {busy ? 'PLEASE WAIT…' : 'SEND RESET INSTRUCTIONS'}
            </button>
          </form>

          <Link href="/account/login" className="reset-back">
            ← Return to sign in
          </Link>
        </div>

        <Link href="/" className="reset-home">
          ← Return to the REIS homepage
        </Link>
      </section>

      <aside className="reset-visual" aria-label="REIS event styling">
        <div className="reset-visual-overlay" />
        <div className="reset-visual-copy">
          <p>THOUGHTFULLY CURATED</p>
          <h2>Every detail.<br />Every occasion.<br /><em>Every memory.</em></h2>
          <span>WE STYLE YOUR EVENT, YOU CREATE MEMORIES.</span>
        </div>
      </aside>

      <style jsx>{`
        .reset-page {
          min-height: 100vh;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 0.85fr);
          background: #faf9f6;
          color: #161614;
          font-family: var(--sans, Arial, sans-serif);
        }

        .reset-panel {
          width: 100%;
          max-width: 640px;
          padding: 42px clamp(24px, 6vw, 84px);
          margin: auto;
          display: flex;
          flex-direction: column;
        }

        .reset-brand {
          display: inline-flex;
          align-self: flex-start;
          flex-direction: column;
          gap: 5px;
          font-family: var(--serif, Georgia, serif);
          font-size: 27px;
          letter-spacing: 0.15em;
          text-decoration: none;
          color: #161614;
        }

        .reset-brand span {
          font-family: var(--sans, Arial, sans-serif);
          font-size: 8px;
          letter-spacing: 0.25em;
          color: #77756e;
        }

        .reset-content {
          width: 100%;
          max-width: 440px;
          margin: auto 0;
          padding: 60px 0;
        }

        .reset-eyebrow {
          margin: 0 0 20px;
          color: #68765b;
          font-size: 9px;
          letter-spacing: 0.2em;
        }

        .reset-content h1 {
          margin: 0 0 20px;
          font-family: var(--serif, Georgia, serif);
          font-size: clamp(42px, 5vw, 66px);
          font-weight: 500;
          line-height: 0.98;
          letter-spacing: -0.035em;
        }

        .reset-content h1 em,
        .reset-visual-copy h2 em {
          font-weight: 400;
        }

        .reset-intro {
          max-width: 410px;
          margin: 0 0 32px;
          color: #77756e;
          font-size: 13px;
          line-height: 1.9;
        }

        .reset-form {
          display: grid;
          gap: 13px;
        }

        .reset-form label {
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .reset-form input {
          width: 100%;
          min-height: 49px;
          padding: 12px 14px;
          border: 1px solid #d8d5ce;
          border-radius: 0;
          background: #fff;
          color: #161614;
          font: 14px var(--sans, Arial, sans-serif);
        }

        .reset-form input:focus-visible {
          outline: 2px solid #68765b;
          outline-offset: 2px;
        }

        .reset-form button {
          min-height: 52px;
          margin-top: 8px;
          padding: 12px;
          border: 1px solid #161614;
          background: #161614;
          color: #fff;
          font-size: 10px;
          letter-spacing: 0.12em;
          cursor: pointer;
          transition: background 160ms ease, color 160ms ease;
        }

        .reset-form button:hover:not(:disabled) {
          background: #68765b;
          border-color: #68765b;
        }

        .reset-form button:focus-visible,
        .reset-back:focus-visible,
        .reset-home:focus-visible,
        .reset-brand:focus-visible {
          outline: 2px solid #68765b;
          outline-offset: 4px;
        }

        .reset-form button:disabled {
          opacity: 0.65;
          cursor: wait;
        }

        .reset-success,
        .reset-error {
          padding: 12px;
          font-size: 12px;
          line-height: 1.7;
          overflow-wrap: anywhere;
        }

        .reset-success {
          background: #edf2e9;
          color: #405438;
        }

        .reset-error {
          background: #f7eae7;
          color: #8c3026;
        }

        .reset-back {
          display: inline-block;
          margin-top: 24px;
          color: #59664e;
          font-size: 12px;
          text-underline-offset: 3px;
        }

        .reset-home {
          align-self: flex-start;
          color: #77756e;
          font-size: 10px;
          text-decoration: none;
        }

        .reset-visual {
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

        .reset-visual-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(15, 15, 13, 0.05),
            rgba(15, 15, 13, 0.78)
          );
        }

        .reset-visual-copy {
          position: relative;
          z-index: 1;
        }

        .reset-visual-copy > p {
          font-size: 9px;
          letter-spacing: 0.22em;
        }

        .reset-visual-copy h2 {
          margin: 20px 0;
          font-family: var(--serif, Georgia, serif);
          font-size: clamp(38px, 4vw, 64px);
          font-weight: 500;
          line-height: 1;
        }

        .reset-visual-copy > span {
          font-size: 8px;
          letter-spacing: 0.16em;
          line-height: 1.8;
        }

        @media (max-width: 760px) {
          .reset-page {
            display: block;
          }

          .reset-panel {
            min-height: 100vh;
            max-width: 540px;
            padding: 30px 24px;
          }

          .reset-content {
            padding: 55px 0;
          }

          .reset-eyebrow {
            margin-bottom: 18px;
          }

          .reset-visual {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .reset-form button {
            transition: none;
          }
        }
      `}</style>
    </main>
  );
}
