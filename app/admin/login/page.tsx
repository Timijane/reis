"use client";

import { FormEvent, useEffect, useState } from "react";
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { auth } from "@/lib/firebase";
import {
  defaultHomepageContent,
  getHomepageContent,
  type HomepageContent,
} from "@/lib/cms/homepage";
import { getAuthorizedAdmin } from "@/lib/admin/auth";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [content, setContent] =
    useState<HomepageContent>(defaultHomepageContent);

  useEffect(() => {
    let mounted = true;

    const checkExistingSession = async () => {
      try {
        const user = auth.currentUser;

        if (!user) {
          if (mounted) setCheckingSession(false);
          return;
        }

        const admin = await getAuthorizedAdmin(user);

        if (admin) {
          router.replace("/admin");
          return;
        }

        if (mounted) setCheckingSession(false);
      } catch {
        if (mounted) setCheckingSession(false);
      }
    };

    checkExistingSession();

    getHomepageContent()
      .then(setContent)
      .catch((error) =>
        console.error("Failed to load login CMS content:", error)
      );

    return () => {
      mounted = false;
    };
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setResetMessage("");

    if (!email.trim() || !password) {
      setError("Please enter your email address and password.");
      return;
    }

    setLoading(true);

    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const admin = await getAuthorizedAdmin(credential.user);

      if (!admin) {
        await auth.signOut();
        setError(
          "This account is not authorized to access the REIS administration system."
        );
        return;
      }

      router.replace("/admin");
    } catch (err: unknown) {
      console.error("Admin login failed:", err);

      const code =
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        typeof err.code === "string"
          ? err.code
          : "";

      if (
        code === "auth/invalid-credential" ||
        code === "auth/wrong-password" ||
        code === "auth/user-not-found"
      ) {
        setError("Invalid email address or password.");
      } else if (code === "auth/too-many-requests") {
        setError(
          "Too many unsuccessful attempts. Please wait and try again."
        );
      } else if (code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        const message =
          err instanceof Error ? err.message : "Unknown authentication error.";

        setError(`Authentication error: ${message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setResetMessage("");

    if (!email.trim()) {
      setError("Enter your email address first, then select Forgot password.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());

      setResetMessage(
        "If an account exists for this email, a password reset message has been sent."
      );
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
        setResetMessage(
          "If an account exists for this email, a password reset message has been sent."
        );
      }
    }
  };

  if (checkingSession) {
    return (
      <main className="admin-auth-loading">
        <div className="admin-auth-spinner" />
        <p>Checking secure session…</p>
      </main>
    );
  }

  return (
    <main className="admin-auth-page">
      <section className="admin-auth-visual">
        <div className="admin-auth-overlay" />

        <div className="admin-auth-visual-content">
          <div className="admin-auth-mark">
                    {content.logoUrl ? (
                      <img
                        src={content.logoUrl}
                        alt={content.brandName}
                        className="admin-auth-logo"
                      />
                    ) : (
                      "REIS"
                    )}
                  </div>

          <div className="admin-auth-visual-copy">
            <p className="admin-auth-eyebrow">{content.brandName} {content.brandSubtext}</p>
            <h1>
              We style your event,
              <br />
              You create memories.
            </h1>
            <p>
              A private workspace for managing the REIS Event Services
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
              <strong>{content.brandName}</strong>
              <small>{content.brandSubtext}</small>
            </div>
          </div>

          <div className="admin-auth-heading">
            <span className="admin-auth-kicker">ADMINISTRATION</span>
            <h2>Welcome back.</h2>
            <p>
              Sign in to manage your website and REIS Event Services
              operations.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="admin-auth-form">
            <label htmlFor="admin-email">Email address</label>

            <div className="admin-auth-input">
              <Mail size={18} strokeWidth={1.7} />
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={loading}
              />
            </div>

            <div className="admin-auth-password-label">
              <label htmlFor="admin-password">Password</label>

              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
              >
                Forgot password?
              </button>
            </div>

            <div className="admin-auth-input">
              <LockKeyhole size={18} strokeWidth={1.7} />

              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={loading}
              />

              <button
                type="button"
                className="admin-auth-eye"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((value) => !value)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff size={18} strokeWidth={1.7} />
                ) : (
                  <Eye size={18} strokeWidth={1.7} />
                )}
              </button>
            </div>

            {error && <div className="admin-auth-error">{error}</div>}

            {resetMessage && (
              <div className="admin-auth-success">{resetMessage}</div>
            )}

            <button
              type="submit"
              className="admin-auth-submit"
              disabled={loading}
            >
              <span>{loading ? "Signing in…" : "Sign in securely"}</span>
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="admin-auth-note">
            This area is restricted to authorized REIS administrators.
          </p>
        </div>
      </section>
    </main>
  );
}
