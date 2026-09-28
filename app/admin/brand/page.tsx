"use client";

import { useEffect, useState } from "react";
import {
  Image as ImageIcon,
  RotateCcw,
  Save,
  Type,
  Globe,
} from "lucide-react";
import {
  defaultBrandSettings,
  getBrandSettings,
  saveBrandSettings,
  type BrandSettings,
} from "@/lib/cms/brand";
import { watchAdminAuth } from "@/lib/admin/auth";
import "./brand.css";

export default function BrandSettingsPage() {
  const [brand, setBrand] =
    useState<BrandSettings>(defaultBrandSettings);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = watchAdminAuth(
      async (user, admin, authLoading) => {
        if (authLoading) return;

        if (!user || !admin) {
          window.location.href = "/admin/login";
          return;
        }

        try {
          const data = await getBrandSettings();
          setBrand(data);
        } catch (error) {
          console.error(
            "Failed to load brand settings:",
            error
          );
          setMessage("Unable to load brand settings.");
        } finally {
          setLoading(false);
        }
      }
    );

    return unsubscribe;
  }, []);

  function update<K extends keyof BrandSettings>(
    key: K,
    value: BrandSettings[K]
  ) {
    setBrand((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");

    try {
      await saveBrandSettings(brand);
      setMessage("Brand settings saved successfully.");
    } catch (error) {
      console.error(
        "Failed to save brand settings:",
        error
      );
      setMessage("Unable to save brand settings.");
    } finally {
      setSaving(false);
    }
  }

  function handleRestore() {
    setBrand(
      JSON.parse(
        JSON.stringify(defaultBrandSettings)
      ) as BrandSettings
    );

    setMessage(
      "Default brand settings restored. Save to apply them."
    );
  }

  if (loading) {
    return (
      <main className="brand-page">
        <div className="brand-loading">
          Loading brand settings...
        </div>
      </main>
    );
  }

  return (
    <main className="brand-page">
      <header className="brand-header">
        <div>
          <p className="brand-kicker">
            ADMIN · BRAND
          </p>

          <h1>Brand Settings</h1>

          <p className="brand-intro">
            Manage the identity visitors see across the
            REIS EVENT website.
          </p>
        </div>

        <div className="brand-header-actions">
          <button
            type="button"
            className="brand-secondary-button"
            onClick={handleRestore}
          >
            <RotateCcw size={16} />
            Restore defaults
          </button>

          <button
            type="button"
            className="brand-primary-button"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save brand"}
          </button>
        </div>
      </header>

      {message && (
        <div className="brand-message">
          {message}
        </div>
      )}

      <section className="brand-section">
        <div className="brand-section-heading">
          <div className="brand-section-icon">
            <ImageIcon size={18} />
          </div>

          <div>
            <h2>Logo & identity</h2>
            <p>
              Control the main visual identity used across
              the website.
            </p>
          </div>
        </div>

        <div className="brand-logo-area">
          <div className="brand-logo-preview">
            {brand.logoUrl ? (
              <img
                src={brand.logoUrl}
                alt={brand.brandName}
              />
            ) : (
              <div className="brand-logo-placeholder">
                <strong>REIS</strong>
                <span>EVENT</span>
              </div>
            )}
          </div>

          <div className="brand-logo-info">
            <strong>Current brand logo</strong>
            <p>
              The logo is managed through the Media Manager.
              Paste or assign the approved logo URL here
              when required.
            </p>

            <input
              type="url"
              value={brand.logoUrl}
              onChange={(event) =>
                update("logoUrl", event.target.value)
              }
              placeholder="Logo image URL"
            />
          </div>
        </div>
      </section>

      <section className="brand-section">
        <div className="brand-section-heading">
          <div className="brand-section-icon">
            <Type size={18} />
          </div>

          <div>
            <h2>Public brand wording</h2>
            <p>
              These fields control the words used to identify
              the business.
            </p>
          </div>
        </div>

        <div className="brand-form-grid">
          <label className="brand-field">
            <span>Brand name</span>
            <input
              value={brand.brandName}
              onChange={(event) =>
                update("brandName", event.target.value)
              }
              placeholder="REIS EVENT"
            />
          </label>

          <label className="brand-field">
            <span>Brand subtext</span>
            <input
              value={brand.brandSubtext}
              onChange={(event) =>
                update(
                  "brandSubtext",
                  event.target.value
                )
              }
              placeholder="SERVICES"
            />
          </label>

          <label className="brand-field brand-field-wide">
            <span>Tagline</span>
            <input
              value={brand.tagline}
              onChange={(event) =>
                update("tagline", event.target.value)
              }
              placeholder="We style your event, You create memories!"
            />
          </label>

          <label className="brand-field brand-field-wide">
            <span>Short description</span>
            <textarea
              value={brand.shortDescription}
              onChange={(event) =>
                update(
                  "shortDescription",
                  event.target.value
                )
              }
              rows={4}
              placeholder="Short description of the business"
            />
          </label>
        </div>
      </section>

      <section className="brand-section">
        <div className="brand-section-heading">
          <div className="brand-section-icon">
            <Globe size={18} />
          </div>

          <div>
            <h2>Browser & SEO identity</h2>
            <p>
              Information used when the website appears in
              browser tabs and search results.
            </p>
          </div>
        </div>

        <div className="brand-form-grid">
          <label className="brand-field brand-field-wide">
            <span>Browser title</span>
            <input
              value={brand.browserTitle}
              onChange={(event) =>
                update(
                  "browserTitle",
                  event.target.value
                )
              }
              placeholder="REIS EVENT | Event Rentals & Styling"
            />
          </label>

          <label className="brand-field brand-field-wide">
            <span>Browser description</span>
            <textarea
              value={brand.browserDescription}
              onChange={(event) =>
                update(
                  "browserDescription",
                  event.target.value
                )
              }
              rows={4}
              placeholder="Search engine description"
            />
          </label>
        </div>
      </section>

      <section className="brand-section">
        <div className="brand-section-heading">
          <div className="brand-section-icon">
            <Type size={18} />
          </div>

          <div>
            <h2>Footer identity</h2>
            <p>
              Separate wording for the footer where needed.
            </p>
          </div>
        </div>

        <div className="brand-form-grid">
          <label className="brand-field">
            <span>Footer brand name</span>
            <input
              value={brand.footerBrandName}
              onChange={(event) =>
                update(
                  "footerBrandName",
                  event.target.value
                )
              }
            />
          </label>

          <label className="brand-field">
            <span>Footer tagline</span>
            <input
              value={brand.footerTagline}
              onChange={(event) =>
                update(
                  "footerTagline",
                  event.target.value
                )
              }
            />
          </label>
        </div>
      </section>
    </main>
  );
}
