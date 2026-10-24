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
        <Link href="/" className="brand">
          REIS <span>EVENT SERVICES</span>
        </Link>

        <p className="eyebrow">ACCOUNT RECOVERY</p>
        <h1>Reset your <em>password.</em></h1>
        <p className="intro">
          Enter the email address associated with your REIS customer account.
          We will send instructions to reset your password.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          {message && <p className="success" role="status">{message}</p>}
          {error && <p className="error" role="alert">{error}</p>}

          <button type="submit" disabled={busy}>
            {busy ? 'PLEASE WAIT…' : 'SEND RESET INSTRUCTIONS'}
          </button>
        </form>

        <Link href="/account/login" className="back">
          ← Return to sign in
        </Link>
      </section>

      <style jsx>{`
        .reset-page {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 24px;
          background: #faf9f6;
          color: #161614;
          font-family: Arial, sans-serif;
        }
        .reset-panel {
          width: 100%;
          max-width: 470px;
          padding: 35px 0;
        }
        .brand {
          display: inline-flex;
          flex-direction: column;
          gap: 5px;
          font-family: Georgia, serif;
          font-size: 25px;
          letter-spacing: .15em;
        }
        .brand span {
          font-family: Arial, sans-serif;
          font-size: 8px;
          letter-spacing: .25em;
          color: #77756e;
        }
        .eyebrow {
          margin-top: 65px;
          color: #68765b;
          font-size: 9px;
          letter-spacing: .2em;
        }
        h1 {
          margin: 18px 0;
          font-family: Georgia, serif;
          font-size: clamp(38px, 8vw, 58px);
          font-weight: 500;
          line-height: 1.05;
        }
        h1 em { font-weight: 400; }
        .intro {
          margin-bottom: 30px;
          color: #77756e;
          font-size: 13px;
          line-height: 1.9;
        }
        form { display: grid; gap: 13px; }
        label {
          font-size: 10px;
          letter-spacing: .1em;
          text-transform: uppercase;
        }
        input {
          width: 100%;
          min-height: 49px;
          padding: 12px 14px;
          border: 1px solid #d8d5ce;
          border-radius: 0;
          background: #fff;
          color: #161614;
          font-size: 14px;
        }
        input:focus {
          outline: 1px solid #68765b;
          border-color: #68765b;
        }
        button {
          min-height: 52px;
          margin-top: 8px;
          border: 1px solid #161614;
          background: #161614;
          color: #fff;
          font-size: 10px;
          letter-spacing: .12em;
          cursor: pointer;
        }
        button:disabled { opacity: .65; cursor: wait; }
        .success, .error {
          padding: 12px;
          font-size: 12px;
          line-height: 1.7;
        }
        .success { background: #edf2e9; color: #405438; }
        .error { background: #f7eae7; color: #8c3026; }
        .back {
          display: inline-block;
          margin-top: 24px;
          color: #68765b;
          font-size: 12px;
        }
      `}</style>
    </main>
  );
}
