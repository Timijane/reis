"use client";

import { FormEvent, useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/firebase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setMessage("");
    setError("");

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, normalizedEmail);

      setMessage(
        "If an account exists for this email, a password reset message has been sent."
      );
      setEmail("");
    } catch (err: unknown) {
      console.error("Password reset request failed:", err);

      const code =
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        typeof err.code === "string"
          ? err.code
          : "";

      if (code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setMessage(
          "If an account exists for this email, a password reset message has been sent."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-auth-page admin-auth-forgot-page">
      <section className="admin-auth-visual">
        <div className="admin-auth-overlay" />

        <div className="admin-auth-visual-content">
          <div className="admin-auth-mark">REIS</div>

          <div className="admin-auth-visual-copy">
            <p className="admin-auth-eyebrow">REIS EVENT SERVICES</p>

            <h1>
              We style your event,
              <br />
              You create memories.
            </h1>

            <p>
              Secure administrator access for the REIS Event Services
              website, rentals, events and customer enquiries.
            </p>
          </div>

          <div className="admin-auth-visual-footer">
            <span>EVENT RENTALS</span>
            <span>EVENT STYLING</span>
            <span>EVENT SERVICES</span>
          </div>
        </div>
      </section>

      <section className="admin-auth-panel">
        <div className="admin-auth-form-wrap">
          <div className="admin-auth-brand">
            <span className="admin-auth-brand-symbol">R</span>

            <div>
              <strong>REIS</strong>
              <small>EVENT SERVICES</small>
            </div>
          </div>

          <div className="admin-auth-heading">
            <span className="admin-auth-kicker">ACCOUNT RECOVERY</span>

            <h2>Reset your password.</h2>

            <p>
              Enter the email address associated with your REIS administrator
              account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="admin-auth-form">
            <label htmlFor="reset-email">Email address</label>

            <div className="admin-auth-input">
              <Mail size={18} strokeWidth={1.7} />

              <input
                id="reset-email"
                type="email"
                autoComplete="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={loading}
                required
              />
            </div>

            {error && (
              <div className="admin-auth-error" role="alert">
                {error}
              </div>
            )}

            {message && (
              <div className="admin-auth-success" role="status">
                {message}
              </div>
            )}

            <button
              type="submit"
              className="admin-auth-submit"
              disabled={loading}
            >
              <span>
                {loading ? "Sending reset email…" : "Send reset email"}
              </span>
            </button>
          </form>

          <Link className="admin-auth-back-link" href="/admin/login">
            <ArrowLeft size={16} strokeWidth={1.7} />
            Back to secure sign in
          </Link>

          <p className="admin-auth-note">
            This recovery service is restricted to REIS administrator
            accounts.
          </p>
        </div>
      </section>
    </main>
  );
}
