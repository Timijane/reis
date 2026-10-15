"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  FileImage,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Tag,
  TrendingUp,
  X,
} from "lucide-react";
import { signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { type AdminUser, watchAdminAuth } from "@/lib/admin/auth";
import {
  ResponsiveContainer, BarChart, Bar, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import "./dashboard.css";
import "./dashboard-charts.css";

type MonthStat = {
  key: string;
  label: string;
  requests: number;
  confirmed: number;
  revenue: number;
};

type ServiceStat = {
  name: string;
  requests: number;
};

type RecentBooking = {
  id: string;
  reference: string;
  customerName: string;
  eventDate: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string | null;
};

type DashboardData = {
  summary: {
    bookingRequests: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    paidRevenue: number;
    paidBookingCount: number;
    activeProducts: number;
    activeCategories: number;
  };
  monthly: MonthStat[];
  services: ServiceStat[];
  recentBookings: RecentBooking[];
  currency: string;
};

const navigation = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Bookings", href: "/admin/bookings", icon: CalendarDays },
  {
    label: "Manage Catalogue",
    icon: Package,
    children: [
      { label: "Equipment Rentals", href: "/admin/products" },
      { label: "Tents & Marquees", href: "/admin/products?type=tent" },
      { label: "Categories", href: "/admin/categories" },
    ],
  },
  {
    label: "Styling",
    icon: Package,
    children: [
      { label: "Styling Portfolio", href: "/admin/services" },
      { label: "Services Content", href: "/admin/services/content" },
      { label: "Styling Enquiries", href: "/admin/styling-enquiries" },
    ],
  },
  { label: "Homepage", href: "/admin/homepage", icon: Home },
  { label: "Media Library", href: "/admin/media", icon: FileImage },
];

const money = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value || 0);

function readableStatus(value: string) {
  const labels: Record<string, string> = {
    pending_review: "Needs review",
    pending: "Pending",
    awaiting_customer: "Awaiting customer",
    approved: "Approved",
    confirmed: "Confirmed",
    rejected: "Declined",
    cancelled: "Cancelled",
    canceled: "Cancelled",
    expired: "Expired",
    paid: "Paid",
    in_fulfilment: "In progress",
    completed: "Completed",
    fulfilled: "Completed",
    unpaid: "Not paid",
    partially_paid: "Part-paid",
    failed: "Payment failed",
    refunded: "Refunded",
    unknown: "Not available",
  };

  return labels[value.toLowerCase()] || value.replace(/_/g, " ");
}

function dateLabel(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatCard({
  icon: Icon,
  label,
  value,
  note,
  tone = "olive",
}: {
  icon: typeof Package;
  label: string;
  value: string | number;
  note: string;
  tone?: "olive" | "gold" | "blue" | "rose";
}) {
  return (
    <article className="overview-stat">
      <div className="overview-stat-top">
        <span className={`overview-stat-icon ${tone}`}>
          <Icon size={19} strokeWidth={1.8} />
        </span>
        <span className="overview-stat-note">{note}</span>
      </div>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="overview-chart-empty">
      <Activity size={24} strokeWidth={1.4} />
      <p>{text}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catalogueOpen, setCatalogueOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const loadDashboard = useCallback(async (currentUser: User) => {
    setDataLoading(true);
    setError("");

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error || "We could not load your business overview."
        );
      }

      setDashboard(result as DashboardData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We could not load your business overview."
      );
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = watchAdminAuth((nextUser, nextAdmin, isLoading) => {
      setUser(nextUser);
      setAdmin(nextAdmin);
      setLoading(isLoading);

      if (!isLoading && (!nextUser || !nextAdmin)) {
        router.replace("/admin/login");
        return;
      }

      if (!isLoading && nextUser && nextAdmin) {
        void loadDashboard(nextUser);
      }
    });

    return unsubscribe;
  }, [router, loadDashboard]);

  async function handleSignOut() {
    try {
      setSigningOut(true);
      await signOut(auth);
      router.replace("/admin/login");
    } catch (err) {
      console.error("Sign out failed:", err);
      setSigningOut(false);
    }
  }

  if (loading || !user || !admin) {
    return (
      <main className="overview-loading">
        <div className="overview-loading-logo">REIS</div>
        <div className="overview-loading-line" />
        <p>Preparing your business overview</p>
      </main>
    );
  }

  const firstName =
    admin.displayName.trim().split(/\s+/)[0] || "there";

  const summary = dashboard?.summary;
  const months = dashboard?.monthly || [];
  const services = dashboard?.services || [];
  const bookings = dashboard?.recentBookings || [];

  const maxRequests = Math.max(1, ...months.map((month) => month.requests));
  const maxRevenue = Math.max(1, ...months.map((month) => month.revenue));
  const maxServiceRequests = Math.max(
    1,
    ...services.map((service) => service.requests)
  );

  const currentMonth = months[months.length - 1];
  const previousMonth = months[months.length - 2];

  const requestChange =
    currentMonth && previousMonth && previousMonth.requests > 0
      ? Math.round(
          ((currentMonth.requests - previousMonth.requests) /
            previousMonth.requests) *
            100
        )
      : null;

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="overview-shell">
      {mobileOpen && (
        <button
          className="overview-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`overview-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="overview-brand">
          <div className="overview-brand-mark">REIS</div>
          <div>
            <strong>Event Services</strong>
            <span>Business centre</span>
          </div>
          <button
            className="overview-close-menu"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          >
            <X size={19} />
          </button>
        </div>

        <div className="overview-side-caption">YOUR WORKSPACE</div>

        <nav className="overview-navigation" aria-label="Admin navigation">
          {navigation.map((item) => {
            if ("children" in item && item.children) {
              const children = item.children;
              return (
                <div className="overview-nav-group" key={item.label}>
                  <button
                    type="button"
                    className={`overview-nav-link overview-nav-button ${catalogueOpen ? "active" : ""}`}
                    onClick={() => setCatalogueOpen((open) => !open)}
                    aria-expanded={catalogueOpen}
                  >
                    <Package size={18} strokeWidth={1.8} />
                    <span>{item.label}</span>
                    <ChevronRight size={16} className={`nav-chevron ${catalogueOpen ? "is-expanded" : ""}`} />
                  </button>
                  {catalogueOpen && (
                    <div className="overview-nav-submenu">
                      {children.map((child) => (
                        <Link
                          key={child.label}
                          href={child.href}
                          onClick={() => setMobileOpen(false)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            const Icon = item.icon;
            const active = item.href === "/admin";

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`overview-nav-link ${active ? "active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{item.label}</span>
                {active && <ChevronRight size={16} className="nav-chevron" />}
              </Link>
            );
          })}
        </nav>
        <div className="overview-sidebar-spacer" />

        <div className="overview-help-box">
          <div className="overview-help-icon">
            <ShieldCheck size={19} />
          </div>
          <strong>Your business, in one place.</strong>
          <p>Manage bookings, update rentals and keep your website current.</p>
          <a href="/" target="_blank" rel="noreferrer">
            Visit your website <ArrowRight size={14} />
          </a>
        </div>

        <div className="overview-account">
          <div className="overview-account-avatar">
            {firstName.charAt(0).toUpperCase()}
          </div>
          <div className="overview-account-info">
            <strong>{admin.displayName}</strong>
            <span>
              {admin.role === "super_admin"
                ? "Super administrator"
                : "Administrator"}
            </span>
          </div>
          <button
            className="overview-logout"
            onClick={handleSignOut}
            disabled={signingOut}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      <main className="overview-main">
        <header className="overview-header">
          <div className="overview-header-left">
            <button
              className="overview-open-menu"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={21} />
            </button>
            <div>
              <span className="overview-breadcrumb">REIS / BUSINESS</span>
              <h1>Business overview</h1>
            </div>
          </div>

          <div className="overview-header-right">
            <div className="overview-date">
              <CalendarDays size={16} />
              <span>{today}</span>
            </div>
            <button
              className="overview-refresh"
              onClick={() => void loadDashboard(user)}
              disabled={dataLoading}
              title="Refresh business figures"
              aria-label="Refresh business figures"
            >
              <RefreshCw
                size={17}
                className={dataLoading ? "overview-spinning" : ""}
              />
            </button>
          </div>
        </header>

        <div className="overview-content">
          <section className="overview-welcome">
            <div className="overview-welcome-copy">
              <span className="overview-eyebrow">YOUR BUSINESS AT A GLANCE</span>
              <h2>
                Good to see you, <em>{firstName}.</em>
              </h2>
              <p>
                Here is how REIS is doing. Check new booking requests, see what
                customers are interested in and track your business over time.
              </p>
            </div>

            <div className="overview-welcome-art" aria-hidden="true">
              <div className="overview-art-circle overview-art-circle-one" />
              <div className="overview-art-circle overview-art-circle-two" />
              <div className="overview-art-text">
                <span>REIS</span>
                <small>We style your event.</small>
                <small>You create memories.</small>
              </div>
            </div>
          </section>

          {error && (
            <div className="overview-error" role="alert">
              <div>
                <strong>Your business figures could not be loaded.</strong>
                <p>{error}</p>
              </div>
              <button onClick={() => void loadDashboard(user)}>
                Try again
              </button>
            </div>
          )}

          <section className="overview-section">
            <div className="overview-section-heading">
              <div>
                <span className="overview-eyebrow">THE IMPORTANT NUMBERS</span>
                <h3>Your business today</h3>
              </div>
              <span className="overview-period">
                <span className="overview-live-dot" />
                Last 12 months
              </span>
            </div>

            <div className="overview-stat-grid">
              <StatCard
                icon={ShoppingBag}
                label="Booking requests"
                value={dataLoading && !summary ? "—" : summary?.bookingRequests ?? 0}
                note="All requests"
                tone="olive"
              />
              <StatCard
                icon={Clock3}
                label="Need your attention"
                value={dataLoading && !summary ? "—" : summary?.pending ?? 0}
                note="Awaiting review"
                tone="gold"
              />
              <StatCard
                icon={CheckCircle2}
                label="Confirmed bookings"
                value={dataLoading && !summary ? "—" : summary?.confirmed ?? 0}
                note="Approved by you"
                tone="blue"
              />
              <StatCard
                icon={TrendingUp}
                label="Money received"
                value={
                  dataLoading && !summary
                    ? "—"
                    : money(summary?.paidRevenue || 0)
                }
                note={`${summary?.paidBookingCount || 0} paid bookings`}
                tone="rose"
              />
            </div>
          </section>

          <section className="overview-chart-grid">
            <article className="overview-card overview-primary-chart">
              <div className="overview-card-heading">
                <div>
                  <span className="overview-eyebrow">CUSTOMER INTEREST</span>
                  <h3>Booking requests over time</h3>
                  <p>See whether more customers are enquiring each month.</p>
                </div>
                <div className="overview-chart-icon">
                  <Activity size={20} />
                </div>
              </div>

              <div className="overview-chart-summary">
                <strong>{currentMonth?.requests ?? 0}</strong>
                <span>requests this month</span>
                {requestChange !== null && (
                  <span
                    className={`overview-change ${
                      requestChange >= 0 ? "positive" : "negative"
                    }`}
                  >
                    {requestChange >= 0 ? (
                      <ArrowUpRight size={15} />
                    ) : (
                      <ArrowDownRight size={15} />
                    )}
                    {Math.abs(requestChange)}% vs last month
                  </span>
                )}
              </div>

              <div className="overview-recharts booking-recharts">
                {dataLoading && !dashboard ? (
                  <EmptyChart text="Loading your monthly figures..." />
                ) : months.length === 0 ? (
                  <EmptyChart text="Monthly figures will appear here." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={months} margin={{ top: 12, right: 6, left: -18, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8e5dc" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#77776d" }} tickLine={false} axisLine={false} interval={1} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#77776d" }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e7e3d8", fontSize: 12 }} />
                      <Bar dataKey="requests" name="Booking requests" fill="#7b8060" radius={[5, 5, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="overview-chart-footnote">
                <span><i className="legend-dot" />Booking requests received</span>
                <span>Newest month on the right</span>
              </div>
            </article>

            <article className="overview-card overview-revenue-chart">
              <div className="overview-card-heading">
                <div>
                  <span className="overview-eyebrow">PAYMENT TRACKER</span>
                  <h3>Money received</h3>
                  <p>Only bookings marked as paid are counted.</p>
                </div>
                <div className="overview-chart-icon gold">
                  <TrendingUp size={20} />
                </div>
              </div>

              <div className="overview-revenue-total">
                <strong>{money(summary?.paidRevenue || 0)}</strong>
                <span>received to date in this period</span>
              </div>

              <div className="overview-recharts revenue-recharts">
                {dataLoading && !dashboard ? (
                  <EmptyChart text="Loading payment figures..." />
                ) : months.length === 0 ? (
                  <EmptyChart text="Payment figures will appear here." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={months} margin={{ top: 12, right: 8, left: -12, bottom: 0 }}>
                      <defs>
                        <linearGradient id="reisRevenueFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#b59a58" stopOpacity={0.38} />
                          <stop offset="95%" stopColor="#b59a58" stopOpacity={0.03} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8e5dc" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#77776d" }} tickLine={false} axisLine={false} interval={1} />
                      <YAxis tickFormatter={(value) => `£${value}`} tick={{ fontSize: 10, fill: "#77776d" }} tickLine={false} axisLine={false} />
                      <Tooltip formatter={(value) => money(Number(value) || 0)} contentStyle={{ borderRadius: 10, border: "1px solid #e7e3d8", fontSize: 12 }} />
                      <Area type="monotone" dataKey="revenue" name="Money received" stroke="#a68a45" strokeWidth={2.5} fill="url(#reisRevenueFill)" activeDot={{ r: 5 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="overview-revenue-note">
                <ShieldCheck size={15} />
                Unpaid requests are not counted as money received.
              </div>
            </article>
          </section>

          <section className="overview-bottom-grid">
            <article className="overview-card overview-services-card">
              <div className="overview-card-heading">
                <div>
                  <span className="overview-eyebrow">WHAT CUSTOMERS WANT</span>
                  <h3>Popular services</h3>
                  <p>Which parts of REIS customers are enquiring about.</p>
                </div>
              </div>

              <div className="overview-service-list">
                {services.map((service, index) => {
                  const percentage =
                    service.requests === 0
                      ? 0
                      : Math.round(
                          (service.requests / maxServiceRequests) * 100
                        );

                  return (
                    <div className="overview-service-row" key={service.name}>
                      <div className={`overview-service-number service-${index}`}>
                        0{index + 1}
                      </div>
                      <div className="overview-service-main">
                        <div className="overview-service-label">
                          <strong>{service.name}</strong>
                          <span>{service.requests} requests</span>
                        </div>
                        <div className="overview-service-track">
                          <div
                            className={`overview-service-fill service-fill-${index}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {!services.length && !dataLoading && (
                  <EmptyChart text="Service activity will appear here." />
                )}
              </div>

              <div className="overview-service-footer">
                <span>
                  <Package size={16} />
                  {summary?.activeProducts ?? 0} active rental items
                </span>
                <span>
                  <Tag size={16} />
                  {summary?.activeCategories ?? 0} categories
                </span>
              </div>
            </article>

            <article className="overview-card overview-bookings-card">
              <div className="overview-card-heading">
                <div>
                  <span className="overview-eyebrow">LATEST ACTIVITY</span>
                  <h3>Recent booking requests</h3>
                  <p>See the latest enquiries from your customers.</p>
                </div>
                <Link
                  className="overview-text-link"
                  href="/admin/bookings"
                  aria-label="View all bookings"
                >
                  View all <ArrowRight size={15} />
                </Link>
              </div>

              {bookings.length > 0 ? (
                <div className="overview-booking-list">
                  {bookings.map((booking) => (
                    <div className="overview-booking-row" key={booking.id}>
                      <div className="overview-booking-icon">
                        <CalendarDays size={17} />
                      </div>
                      <div className="overview-booking-main">
                        <strong>{booking.customerName}</strong>
                        <span>
                          {booking.reference} · Event {dateLabel(booking.eventDate)}
                        </span>
                        <small>
                          Request received {dateLabel(booking.createdAt)}
                        </small>
                      </div>
                      <div className="overview-booking-right">
                        <span
                          className={`overview-status status-${booking.status}`}
                        >
                          {readableStatus(booking.status)}
                        </span>
                        <strong>{money(booking.total)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyChart
                  text={
                    dataLoading
                      ? "Loading your latest requests..."
                      : "No booking requests to show yet."
                  }
                />
              )}

              <Link className="overview-all-bookings" href="/admin/bookings">
                Open booking management
                <ChevronRight size={17} />
              </Link>
            </article>
          </section>

          <section className="overview-quick-actions">
            <div>
              <span className="overview-eyebrow">READY WHEN YOU ARE</span>
              <h3>What would you like to do?</h3>
            </div>

            <div className="overview-quick-action-list">
              <Link href="/admin/bookings">
                <span className="quick-action-icon"><CalendarDays size={19} /></span>
                <span><strong>Review bookings</strong><small>Check customer requests</small></span>
                <ArrowRight size={16} />
              </Link>
              <Link href="/admin/products">
                <span className="quick-action-icon"><Package size={19} /></span>
                <span><strong>Add a rental item</strong><small>Update your catalogue</small></span>
                <ArrowRight size={16} />
              </Link>
              <Link href="/admin/media">
                <span className="quick-action-icon"><Eye size={19} /></span>
                <span><strong>Update photos</strong><small>Keep your website looking fresh</small></span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </section>

          <footer className="overview-footer">
            <span>REIS EVENT SERVICES</span>
            <span>We style your event, you create memories.</span>
            <span>Business overview</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
