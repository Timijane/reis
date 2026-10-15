"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

type Enquiry = {
  id: string;
  reference?: string;
  name?: string;
  email?: string;
  phone?: string;
  eventDate?: string;
  eventType?: string;
  venue?: string;
  description?: string;
  length?: string;
  width?: string;
  height?: string;
  venuePhotos?: string[];
  inspirationImages?: string[];
  status?: string;
  adminNotes?: string;
  createdAt?: string | null;
};

const STATUSES = [
  "new",
  "reviewing",
  "quoted",
  "booked",
  "completed",
  "declined",
];

export default function StylingEnquiriesPage() {
  const [items, setItems] = useState<Enquiry[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("new");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selected = items.find((item) => item.id === selectedId) ?? null;

  const loadEnquiries = useCallback(async () => {
    const user = auth.currentUser;

    if (!user) {
      setError("Please sign in with an authorized admin account.");
      setLoading(false);
      return;
    }

    const token = await user.getIdToken();
    const response = await fetch("/api/admin/styling-enquiries", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to load enquiries.");
    }

    const enquiries: Enquiry[] = data.enquiries || [];
    setItems(enquiries);

    setSelectedId((current) => {
      if (current && enquiries.some((item) => item.id === current)) {
        return current;
      }
      return enquiries[0]?.id || "";
    });
  }, []);

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!active) return;

      if (!user) {
        setError("Please sign in with an authorized admin account.");
        setLoading(false);
        return;
      }

      try {
        await loadEnquiries();
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Unable to load enquiries."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [loadEnquiries]);

  useEffect(() => {
    if (!selected) return;
    setNotes(selected.adminNotes || "");
    setStatus(selected.status || "new");
    setMessage("");
  }, [selectedId, selected?.adminNotes, selected?.status]);

  async function saveChanges() {
    const user = auth.currentUser;

    if (!user || !selected) {
      setError("Sign in as an authorized admin and select an enquiry.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const token = await user.getIdToken();

      const response = await fetch("/api/admin/styling-enquiries", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selected.id,
          status,
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save changes.");
      }

      setItems((current) =>
        current.map((item) =>
          item.id === selected.id
            ? { ...item, status, adminNotes: notes }
            : item
        )
      );

      setMessage("Enquiry updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="admin">
      <nav className="adminnav">
        <Link href="/admin">Dashboard</Link>
        <Link href="/admin/bookings">Bookings</Link>
        <Link href="/admin/products">Products</Link>
        <Link href="/admin/categories">Categories</Link>
        <Link href="/admin/media">Media</Link>
        <Link href="/admin/styling-enquiries">Styling enquiries</Link>
      </nav>

      <section className="section">
        <div className="wrap">
          <h1>Styling enquiries</h1>
          <p className="muted">
            Review event requirements, customer photographs, and follow-up notes.
          </p>

          {loading && <div className="notice">Loading enquiries…</div>}

          {!loading && error && <div className="notice">{error}</div>}
          {!loading && message && <div className="notice">{message}</div>}

          {!loading && !error && items.length === 0 && (
            <div className="notice">
              No styling enquiries have been submitted yet.
            </div>
          )}

          {!loading && items.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(230px, 0.8fr) minmax(0, 1.7fr)",
                gap: "24px",
                alignItems: "start",
              }}
            >
              <div>
                <h2>Received enquiries ({items.length})</h2>

                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "14px",
                      marginBottom: "10px",
                      border: "1px solid #dedbd4",
                      background: item.id === selectedId ? "#f0eee7" : "#fff",
                      color: "#242424",
                      cursor: "pointer",
                    }}
                  >
                    <strong>{item.name || "Unnamed customer"}</strong>
                    <br />
                    <span>{item.eventType || "Event type not specified"}</span>
                    <br />
                    <small>{item.eventDate || "Date not specified"}</small>
                    <br />
                    <small>Status: {item.status || "new"}</small>
                  </button>
                ))}
              </div>

              {selected && (
                <article>
                  <h2>{selected.name || "Styling enquiry"}</h2>
                  <p>
                    <strong>Reference:</strong>{" "}
                    {selected.reference || selected.id}
                  </p>
                  <p>
                    <strong>Email:</strong>{" "}
                    {selected.email ? (
                      <a href={`mailto:${selected.email}`}>{selected.email}</a>
                    ) : "Not supplied"}
                  </p>
                  <p>
                    <strong>Phone:</strong>{" "}
                    {selected.phone ? (
                      <a href={`tel:${selected.phone}`}>{selected.phone}</a>
                    ) : "Not supplied"}
                  </p>
                  <p><strong>Event:</strong> {selected.eventType || "Not specified"}</p>
                  <p><strong>Date:</strong> {selected.eventDate || "Not specified"}</p>
                  <p><strong>Venue:</strong> {selected.venue || "Not specified"}</p>
                  <p>
                    <strong>Dimensions:</strong>{" "}
                    Length {selected.length || "—"} × Width{" "}
                    {selected.width || "—"} × Height {selected.height || "—"}
                  </p>

                  <h3>Event description</h3>
                  <p style={{ whiteSpace: "pre-wrap" }}>
                    {selected.description || "No description provided."}
                  </p>

                  <h3>Venue photographs</h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {(selected.venuePhotos || []).map((url, index) => (
                      <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer">
                        <img
                          src={url}
                          alt={`Venue photograph ${index + 1}`}
                          style={{ width: 120, height: 100, objectFit: "cover" }}
                        />
                      </a>
                    ))}
                    {!selected.venuePhotos?.length && <p>No venue photos.</p>}
                  </div>

                  <h3>Inspiration images</h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {(selected.inspirationImages || []).map((url, index) => (
                      <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer">
                        <img
                          src={url}
                          alt={`Inspiration image ${index + 1}`}
                          style={{ width: 120, height: 100, objectFit: "cover" }}
                        />
                      </a>
                    ))}
                    {!selected.inspirationImages?.length && (
                      <p>No inspiration images.</p>
                    )}
                  </div>

                  <hr />

                  <label htmlFor="enquiry-status"><strong>Enquiry status</strong></label>
                  <select
                    id="enquiry-status"
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    style={{ display: "block", width: "100%", padding: 12, margin: "8px 0 18px" }}
                  >
                    {STATUSES.map((item) => (
                      <option key={item} value={item}>
                        {item.charAt(0).toUpperCase() + item.slice(1)}
                      </option>
                    ))}
                  </select>

                  <label htmlFor="admin-notes"><strong>Private admin notes</strong></label>
                  <textarea
                    id="admin-notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={6}
                    maxLength={5000}
                    placeholder="Record follow-up actions, quote details, or internal notes…"
                    style={{ display: "block", width: "100%", padding: 12, margin: "8px 0 12px" }}
                  />

                  <button type="button" onClick={saveChanges} disabled={saving}>
                    {saving ? "Saving…" : "Save enquiry changes"}
                  </button>
                </article>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
