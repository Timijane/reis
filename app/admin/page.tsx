"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ChevronRight,
  FileImage,
  Globe2,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShieldCheck,
  Sparkles,
  Tag,
  UserRound,
  X,
} from "lucide-react";
import {
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  type AdminUser,
  watchAdminAuth,
} from "@/lib/admin/auth";
import "./dashboard.css";

const navigation = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    active: true,
  },
  {
    label: "Homepage",
    href: "/admin/homepage",
    icon: Home,
  },
  {
    label: "Brand",
    icon: Sparkles,
  },
  {
    label: "Categories",
    href: "/admin/categories",
    icon: Tag,
  },
  {
    label: "Products",
    href: "/admin/products",
    icon: Package,
  },
  {
    label: "Media",
    href: "/admin/media",
    icon: FileImage,
  },
  {
    label: "Authentication",
    href: "/admin/authentication",
    icon: ShieldCheck,
  },
  {
    label: "Settings",
    icon: Settings,
  },
];

export default function AdminDashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = watchAdminAuth((nextUser, nextAdmin, isLoading) => {
      setUser(nextUser);
      setAdmin(nextAdmin);
      setLoading(isLoading);

      if (!isLoading && (!nextUser || !nextAdmin)) {
        router.replace("/admin/login");
      }
    });

    return unsubscribe;
  }, [router]);

  async function handleSignOut() {
    try {
      setSigningOut(true);
      await signOut(auth);
      router.replace("/admin/login");
    } catch (error) {
      console.error("Admin sign-out failed:", error);
      setSigningOut(false);
    }
  }

  if (loading) {
    return (
      <main className="admin-loading">
        <div className="admin-loading-mark">REIS</div>
        <div className="admin-loading-line" />
        <p>Loading administration...</p>
      </main>
    );
  }

  if (!user || !admin) {
    return (
      <main className="admin-loading">
        <div className="admin-loading-mark">REIS</div>
        <p>Redirecting to secure login...</p>
      </main>
    );
  }

  const firstName =
    admin.displayName.trim().split(/\s+/)[0] || "Administrator";

  return (
    <div className="admin-shell">
      {mobileOpen && (
        <button
          className="admin-mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`admin-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="admin-sidebar-top">
          <div className="admin-brand">
            <div className="admin-brand-mark">REIS</div>
            <div>
              <strong>Event Services</strong>
              <span>Administration</span>
            </div>
          </div>

          <button
            className="admin-mobile-close"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="admin-sidebar-label">Management</div>

        <nav className="admin-nav">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <a
                key={item.href}
                href={item.href}
                className={`admin-nav-item ${item.active ? "active" : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{item.label}</span>
                {item.active && <ChevronRight size={15} />}
              </a>
            );
          })}
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-profile">
            <div className="admin-avatar">
              {firstName.charAt(0).toUpperCase()}
            </div>
            <div className="admin-profile-copy">
              <strong>{admin.displayName}</strong>
              <span>{admin.role.replace("_", " ")}</span>
            </div>
          </div>

          <button
            className="admin-signout"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            <LogOut size={17} />
            <span>{signingOut ? "Signing out..." : "Sign out"}</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <button
            className="admin-mobile-menu"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={21} />
          </button>

          <div className="admin-header-title">
            <span>REIS Event Services</span>
            <h1>Dashboard</h1>
          </div>

          <a
            className="admin-view-site"
            href="/"
            target="_blank"
            rel="noreferrer"
          >
            <Globe2 size={17} />
            <span>View website</span>
          </a>
        </header>

        <section className="admin-content">
          <div className="admin-welcome">
            <div>
              <p className="admin-eyebrow">Administration</p>
              <h2>
                Welcome back, {firstName}.
              </h2>
              <p>
                Manage the REIS Event Services website, rental catalogue and
                digital content from one place.
              </p>
            </div>

            <div className="admin-welcome-status">
              <span className="status-dot" />
              System connected
            </div>
          </div>

          <div className="admin-stat-grid">
            <article className="admin-stat-card">
              <div className="admin-stat-icon">
                <Package size={19} />
              </div>
              <span>Rental products</span>
              <strong>—</strong>
              <small>Managed through Products</small>
            </article>

            <article className="admin-stat-card">
              <div className="admin-stat-icon">
                <Tag size={19} />
              </div>
              <span>Categories</span>
              <strong>—</strong>
              <small>Managed through Categories</small>
            </article>

            <article className="admin-stat-card">
              <div className="admin-stat-icon">
                <FileImage size={19} />
              </div>
              <span>Media assets</span>
              <strong>—</strong>
              <small>Managed through Media</small>
            </article>

            <article className="admin-stat-card">
              <div className="admin-stat-icon">
                <ShieldCheck size={19} />
              </div>
              <span>Your access</span>
              <strong>{admin.role === "super_admin" ? "Full" : "Admin"}</strong>
              <small>Authenticated securely</small>
            </article>
          </div>

          <div className="admin-dashboard-grid">
            <section className="admin-panel admin-quick-panel">
              <div className="admin-panel-heading">
                <div>
                  <p className="admin-eyebrow">Quick access</p>
                  <h3>Website management</h3>
                </div>
              </div>

              <div className="admin-action-list">
                <a href="/admin/homepage">
                  <div className="admin-action-icon">
                    <Home size={18} />
                  </div>
                  <div>
                    <strong>Homepage</strong>
                    <span>
                      Control hero content, sections, images and visibility.
                    </span>
                  </div>
                  <ChevronRight size={17} />
                </a>

                <a href="/admin/categories">
                  <div className="admin-action-icon">
                    <Boxes size={18} />
                  </div>
                  <div>
                    <strong>Rental categories</strong>
                    <span>
                      Organise chairs, tables, décor and other rental groups.
                    </span>
                  </div>
                  <ChevronRight size={17} />
                </a>

                <a href="/admin/media">
                  <div className="admin-action-icon">
                    <FileImage size={18} />
                  </div>
                  <div>
                    <strong>Media library</strong>
                    <span>
                      Manage the images used throughout the website.
                    </span>
                  </div>
                  <ChevronRight size={17} />
                </a>
              </div>
            </section>

            <section className="admin-panel admin-security-panel">
              <div className="admin-panel-heading">
                <div>
                  <p className="admin-eyebrow">Security</p>
                  <h3>Administrator account</h3>
                </div>
                <ShieldCheck size={22} />
              </div>

              <div className="admin-security-status">
                <div className="security-check">
                  <span className="status-dot" />
                  Active administrator
                </div>

                <dl>
                  <div>
                    <dt>Name</dt>
                    <dd>{admin.displayName}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{admin.email}</dd>
                  </div>
                  <div>
                    <dt>Role</dt>
                    <dd>{admin.role.replace("_", " ")}</dd>
                  </div>
                </dl>
              </div>
            </section>
          </div>

          <footer className="admin-footer">
            <span>REIS Event Services</span>
            <span>Secure administration</span>
          </footer>
        </section>
      </main>
    </div>
  );
}
