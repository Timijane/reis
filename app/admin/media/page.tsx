"use client";

import { useEffect, useMemo, useState } from "react";
import { Upload, RotateCcw, Save, Image as ImageIcon } from "lucide-react";
import { getHomepageContent, saveHomepageContent } from "@/lib/cms/homepage";
import type { HomepageContent } from "@/lib/cms/homepage";
import "./media.css";

declare global {
  interface Window {
    cloudinary?: {
      createUploadWidget: (
        options: Record<string, unknown>,
        callback: (error: unknown, result: any) => void
      ) => { open: () => void };
    };
  }
}

type SlotKey =
  | "logoUrl"
  | "heroImage"
  | "rental1Image"
  | "rental2Image"
  | "rental3Image"
  | "rental4Image"
  | "rental5Image"
  | "rental6Image"
  | "gallery1Image"
  | "gallery2Image"
  | "gallery3Image"
  | "gallery4Image"
  | "gallery5Image"
  | "aboutImage";

type Slot = {
  key: SlotKey;
  title: string;
  section: string;
  label?: string;
};

const SLOTS: Slot[] = [
  { key: "logoUrl", title: "Brand Logo", section: "BRAND" },

  { key: "heroImage", title: "Hero Image", section: "HERO" },

  { key: "rental1Image", title: "Rental 01", section: "RENTALS", label: "Marquee" },
  { key: "rental2Image", title: "Rental 02", section: "RENTALS", label: "Foldable Chairs" },
  { key: "rental3Image", title: "Rental 03", section: "RENTALS", label: "Chiavari Chairs" },
  { key: "rental4Image", title: "Rental 04", section: "RENTALS", label: "Tables" },
  { key: "rental5Image", title: "Rental 05", section: "RENTALS", label: "Arches & Florals" },
  { key: "rental6Image", title: "Rental 06", section: "RENTALS", label: "Catering Hire" },

  { key: "gallery1Image", title: "Gallery 01", section: "OUR WORK" },
  { key: "gallery2Image", title: "Gallery 02", section: "OUR WORK" },
  { key: "gallery3Image", title: "Gallery 03", section: "OUR WORK" },
  { key: "gallery4Image", title: "Gallery 04", section: "OUR WORK" },
  { key: "gallery5Image", title: "Gallery 05", section: "OUR WORK" },

  { key: "aboutImage", title: "About Image", section: "ABOUT" },
];

export default function MediaPage() {
  const [content, setContent] = useState<HomepageContent | null>(null);
  const [selected, setSelected] = useState<SlotKey>("heroImage");
  const [pending, setPending] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getHomepageContent().then(setContent);
  }, []);

  const grouped = useMemo(() => {
    return SLOTS.reduce<Record<string, Slot[]>>((acc, slot) => {
      if (!acc[slot.section]) acc[slot.section] = [];
      acc[slot.section].push(slot);
      return acc;
    }, {});
  }, []);

  function openUpload(slot: SlotKey) {
    setSelected(slot);
    setMessage("");

    if (!window.cloudinary) {
      setMessage("Cloudinary uploader is not available.");
      return;
    }

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: "dmbjrohtn",
        uploadPreset: "pelumi",
        folder: "reis-event-services",
        sources: ["local", "camera"],
        multiple: false,
        maxFileSize: 10000000,
        clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
        cropping: false,
      },
      (error, result) => {
        if (error) {
          console.error(error);
          setMessage("Upload failed.");
          return;
        }

        if (result?.event === "success") {
          setPending((current) => ({
            ...current,
            [slot]: result.info.secure_url,
          }));
          setMessage(`${slot} uploaded. Click Save Assignment to apply it.`);
        }
      }
    );

    widget.open();
  }

  async function assign(slot: SlotKey) {
    if (!content || !pending[slot]) return;

    setSaving(true);
    setMessage("");

    try {
      const next = {
        ...content,
        [slot]: pending[slot],
      } as HomepageContent;

      await saveHomepageContent(next);
      setContent(next);

      setPending((current) => {
        const copy = { ...current };
        delete copy[slot];
        return copy;
      });

      setMessage("Image assigned successfully.");
    } catch (error) {
      console.error(error);
      setMessage("Could not save the assignment.");
    } finally {
      setSaving(false);
    }
  }

  async function restoreDefault(slot: SlotKey) {
    if (!content) return;

    const defaults = await getHomepageContent();

    const next = {
      ...content,
      [slot]: defaults[slot],
    } as HomepageContent;

    setSaving(true);

    try {
      await saveHomepageContent(next);
      setContent(next);
      setPending((current) => {
        const copy = { ...current };
        delete copy[slot];
        return copy;
      });
      setMessage("Default image restored.");
    } finally {
      setSaving(false);
    }
  }

  if (!content) {
    return <div className="media-loading">Loading media manager…</div>;
  }

  return (
    <main className="media-page">
      <header className="media-header">
        <div>
          <p className="media-kicker">REIS EVENT · CONTENT</p>
          <h1>Media Manager</h1>
          <p>
            Manage the exact images used across the public website.
            Upload first, then assign only when you are ready.
          </p>
        </div>
      </header>

      {message && <div className="media-message">{message}</div>}

      <div className="media-layout">
        <aside className="media-sidebar">
          {Object.entries(grouped).map(([section, slots]) => (
            <div className="media-group" key={section}>
              <div className="media-group-title">{section}</div>

              {slots.map((slot) => {
                const image =
                  pending[slot.key] || String(content[slot.key] || "");

                return (
                  <button
                    type="button"
                    key={slot.key}
                    className={`media-nav-item ${
                      selected === slot.key ? "active" : ""
                    }`}
                    onClick={() => setSelected(slot.key)}
                  >
                    <span className="media-nav-thumb">
                      {image ? (
                        <img src={image} alt="" />
                      ) : (
                        <ImageIcon size={18} />
                      )}
                    </span>

                    <span>
                      <strong>{slot.title}</strong>
                      {slot.label && <small>{slot.label}</small>}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </aside>

        <section className="media-workspace">
          <div className="media-preview-panel">
            <div className="media-preview-image">
              {pending[selected] || content[selected] ? (
                <img
                  src={pending[selected] || String(content[selected])}
                  alt={selected}
                />
              ) : (
                <div className="media-empty">
                  <ImageIcon size={36} />
                  <span>No image assigned</span>
                </div>
              )}
            </div>

            <div className="media-preview-info">
              <span className="media-section-label">
                {SLOTS.find((item) => item.key === selected)?.section}
              </span>

              <h2>{SLOTS.find((item) => item.key === selected)?.title}</h2>

              {SLOTS.find((item) => item.key === selected)?.label && (
                <p>{SLOTS.find((item) => item.key === selected)?.label}</p>
              )}

              {pending[selected] && (
                <div className="pending-note">
                  New image uploaded — <strong>not assigned yet.</strong>
                </div>
              )}

              <div className="media-actions">
                <button
                  type="button"
                  className="media-upload-button"
                  onClick={() => openUpload(selected)}
                >
                  <Upload size={17} />
                  Upload New
                </button>

                {pending[selected] && (
                  <button
                    type="button"
                    className="media-save-button"
                    onClick={() => assign(selected)}
                    disabled={saving}
                  >
                    <Save size={17} />
                    {saving ? "Saving…" : "Save Assignment"}
                  </button>
                )}

                <button
                  type="button"
                  className="media-restore-button"
                  onClick={() => restoreDefault(selected)}
                  disabled={saving}
                >
                  <RotateCcw size={16} />
                  Restore Default
                </button>
              </div>
            </div>
          </div>

          <div className="media-page-preview">
            <div className="media-page-preview-heading">
              <span>LANDING PAGE MAP</span>
              <p>Visual overview of where each image appears.</p>
            </div>

            <div className="visual-map">
              {SLOTS.filter((slot) => slot.section !== "BRAND").map((slot) => {
                const image =
                  pending[slot.key] || String(content[slot.key] || "");

                return (
                  <button
                    type="button"
                    key={slot.key}
                    className={`visual-map-card ${
                      selected === slot.key ? "selected" : ""
                    }`}
                    onClick={() => setSelected(slot.key)}
                  >
                    <div className="visual-map-image">
                      {image ? (
                        <img src={image} alt={slot.title} />
                      ) : (
                        <ImageIcon size={28} />
                      )}
                    </div>

                    <div className="visual-map-caption">
                      <span>{slot.section}</span>
                      <strong>{slot.title}</strong>
                      {slot.label && <small>{slot.label}</small>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
