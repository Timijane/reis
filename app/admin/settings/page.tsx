"use client";

import { useEffect, useState } from "react";
import { Save, RotateCcw, Palette, Globe, Check } from "lucide-react";
import {
  COLOR_PALETTE,
  defaultSiteSettings,
  getSiteSettings,
  saveSiteSettings,
  type ColorSetting,
  type GradientDirection,
  type SiteSettings,
} from "@/lib/cms/site-settings";
import { watchAdminAuth } from "@/lib/admin/auth";
import "./settings.css";

const COLOR_FIELDS: Array<{
  key: keyof SiteSettings["colors"];
  label: string;
  description: string;
}> = [
  { key: "primary", label: "Primary", description: "Main brand colour" },
  { key: "secondary", label: "Secondary", description: "Supporting brand colour" },
  { key: "accent", label: "Accent", description: "Highlights and details" },
  { key: "background", label: "Background", description: "Main page background" },
  { key: "surface", label: "Surface", description: "Cards and panels" },
  { key: "text", label: "Text", description: "General body text" },
  { key: "mutedText", label: "Muted text", description: "Secondary text" },
  { key: "headline", label: "Headlines", description: "Large headings" },
  { key: "announcement", label: "Announcement", description: "Announcement bar" },
  { key: "headerBackground", label: "Header background", description: "Navigation background" },
  { key: "headerText", label: "Header text", description: "Navigation text" },
  { key: "footerBackground", label: "Footer background", description: "Footer background" },
  { key: "footerText", label: "Footer text", description: "Footer text" },
  { key: "buttonBackground", label: "Button background", description: "Primary buttons" },
  { key: "buttonText", label: "Button text", description: "Button labels" },
  { key: "border", label: "Borders", description: "Lines and dividers" },
];

const DIRECTIONS: GradientDirection[] = [
  "to right",
  "to left",
  "to bottom",
  "to top",
  "to bottom right",
  "to bottom left",
  "to top right",
  "to top left",
  "radial",
];

function solid(color: string): ColorSetting {
  return {
    mode: "solid",
    color,
    colors: [color],
    direction: "to right",
  };
}

function gradient(colors: string[], direction: GradientDirection): ColorSetting {
  return {
    mode: "gradient",
    color: colors[0],
    colors,
    direction,
  };
}

function colorBackground(setting: ColorSetting): string {
  if (setting.mode === "gradient") {
    if (setting.direction === "radial") {
      return `radial-gradient(circle, ${setting.colors.join(", ")})`;
    }

    return `linear-gradient(${setting.direction}, ${setting.colors.join(", ")})`;
  }

  return setting.color;
}

function ColorPicker({
  value,
  onChange,
}: {
  value: ColorSetting;
  onChange: (value: ColorSetting) => void;
}) {
  function chooseColor(color: string, index: number) {
    const nextColors = [...value.colors];

    if (value.mode === "solid") {
      onChange(solid(color));
      return;
    }

    nextColors[index] = color;

    onChange(
      gradient(
        nextColors,
        value.direction
      )
    );
  }

  function setMode(mode: "solid" | "gradient") {
    if (mode === "solid") {
      onChange(solid(value.colors[0] ?? value.color));
      return;
    }

    const first = value.colors[0] ?? value.color;
    const second = value.colors[1] ?? COLOR_PALETTE[15];

    onChange(gradient([first, second], value.direction));
  }

  function setGradientCount(count: 2 | 3) {
    const colors = [...value.colors];

    while (colors.length < count) {
      colors.push(
        COLOR_PALETTE[
          Math.min(colors.length * 10 + 5, COLOR_PALETTE.length - 1)
        ]
      );
    }

    onChange(
      gradient(
        colors.slice(0, count),
        value.direction
      )
    );
  }

  return (
    <div className="settings-picker">
      <div className="settings-picker-preview">
        <div
          className="settings-picker-preview-swatch"
          style={{ background: colorBackground(value) }}
        />
        <div className="settings-picker-preview-info">
          <strong>
            {value.mode === "gradient"
              ? `${value.colors.length}-colour gradient`
              : "Solid colour"}
          </strong>
          <span>
            {value.mode === "gradient"
              ? value.direction
              : "Single colour"}
          </span>
        </div>
      </div>

      <div className="settings-mode-switch">
        <button
          type="button"
          className={value.mode === "solid" ? "active" : ""}
          onClick={() => setMode("solid")}
        >
          Solid
        </button>
        <button
          type="button"
          className={value.mode === "gradient" ? "active" : ""}
          onClick={() => setMode("gradient")}
        >
          Gradient
        </button>
      </div>

      {value.mode === "gradient" && (
        <>
          <div className="settings-gradient-count">
            <span>Gradient colours</span>
            <div>
              <button
                type="button"
                className={value.colors.length === 2 ? "active" : ""}
                onClick={() => setGradientCount(2)}
              >
                2
              </button>
              <button
                type="button"
                className={value.colors.length === 3 ? "active" : ""}
                onClick={() => setGradientCount(3)}
              >
                3
              </button>
            </div>
          </div>

          <label className="settings-direction">
            <span>Direction</span>
            <select
              value={value.direction}
              onChange={(event) =>
                onChange(
                  gradient(
                    value.colors,
                    event.target.value as GradientDirection
                  )
                )
              }
            >
              {DIRECTIONS.map((direction) => (
                <option key={direction} value={direction}>
                  {direction}
                </option>
              ))}
            </select>
          </label>
        </>
      )}

      <div className="settings-palette">
        {COLOR_PALETTE.map((color) => {
          const selected = value.colors.includes(color);

          return (
            <button
              type="button"
              key={color}
              aria-label="Choose colour"
              className={`settings-swatch ${
                selected ? "selected" : ""
              }`}
              style={{ background: color }}
              onClick={() =>
                chooseColor(
                  color,
                  value.mode === "gradient"
                    ? Math.max(
                        0,
                        value.colors.findIndex((item) => item === color)
                      )
                    : 0
                )
              }
            >
              {selected && (
                <span className="settings-swatch-check">
                  <Check size={13} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {value.mode === "gradient" && (
        <div className="settings-gradient-slots">
          {value.colors.map((color, index) => (
            <button
              type="button"
              key={`${color}-${index}`}
              className="settings-gradient-slot"
              onClick={() => {
                const next = [...value.colors];
                const currentIndex = COLOR_PALETTE.findIndex(
                  (paletteColor) => paletteColor === color
                );

                next[index] =
                  COLOR_PALETTE[
                    (Math.max(currentIndex, 0) + 1) %
                      COLOR_PALETTE.length
                  ];

                onChange(gradient(next, value.direction));
              }}
            >
              <span
                style={{ background: color }}
              />
              <small>Colour {index + 1}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] =
    useState<SiteSettings>(defaultSiteSettings);

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
          const data = await getSiteSettings();
          setSettings(data);
        } catch (error) {
          console.error(
            "Failed to load site settings:",
            error
          );
          setMessage("Unable to load settings.");
        } finally {
          setLoading(false);
        }
      }
    );

    return unsubscribe;
  }, []);

  function updateColor(
    key: keyof SiteSettings["colors"],
    value: ColorSetting
  ) {
    setSettings((current) => ({
      ...current,
      colors: {
        ...current.colors,
        [key]: value,
      },
    }));
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");

    try {
      await saveSiteSettings(settings);
      setMessage("Settings saved successfully.");
    } catch (error) {
      console.error(
        "Failed to save site settings:",
        error
      );
      setMessage("Unable to save settings.");
    } finally {
      setSaving(false);
    }
  }

  function handleRestore() {
    setSettings(
      JSON.parse(
        JSON.stringify(defaultSiteSettings)
      ) as SiteSettings
    );

    setMessage(
      "Default settings restored. Save to apply them."
    );
  }

  if (loading) {
    return (
      <main className="settings-page">
        <div className="settings-loading">
          Loading settings...
        </div>
      </main>
    );
  }

  return (
    <main className="settings-page">
      <header className="settings-header">
        <div>
          <p className="settings-kicker">
            ADMIN · SETTINGS
          </p>

          <h1>Universal Design</h1>

          <p className="settings-intro">
            Control the visual identity of the REIS EVENT
            website from one place.
          </p>
        </div>

        <div className="settings-header-actions">
          <button
            type="button"
            className="settings-secondary-button"
            onClick={handleRestore}
          >
            <RotateCcw size={16} />
            Restore defaults
          </button>

          <button
            type="button"
            className="settings-primary-button"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save settings"}
          </button>
        </div>
      </header>

      {message && (
        <div className="settings-message">
          {message}
        </div>
      )}

      <section className="settings-section">
        <div className="settings-section-heading">
          <div className="settings-section-icon">
            <Palette size={18} />
          </div>

          <div>
            <h2>Universal colours</h2>
            <p>
              Choose colours visually. No HEX codes or
              numbers are required.
            </p>
          </div>
        </div>

        <label className="settings-toggle-row">
          <div>
            <strong>Use universal colours</strong>
            <span>
              Apply these colours throughout the public
              website unless a particular section has an
              override.
            </span>
          </div>

          <input
            type="checkbox"
            checked={settings.universalColorsEnabled}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                universalColorsEnabled:
                  event.target.checked,
              }))
            }
          />
        </label>

        <div className="settings-color-grid">
          {COLOR_FIELDS.map((field) => (
            <article
              className="settings-color-card"
              key={field.key}
            >
              <div className="settings-color-card-heading">
                <div>
                  <strong>{field.label}</strong>
                  <span>{field.description}</span>
                </div>

                <div
                  className="settings-mini-preview"
                  style={{
                    background: colorBackground(
                      settings.colors[field.key]
                    ),
                  }}
                />
              </div>

              <ColorPicker
                value={settings.colors[field.key]}
                onChange={(value) =>
                  updateColor(field.key, value)
                }
              />
            </article>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section-heading">
          <div className="settings-section-icon">
            <Globe size={18} />
          </div>

          <div>
            <h2>Site identity</h2>
            <p>
              Core information used across the REIS EVENT
              experience.
            </p>
          </div>
        </div>

        <div className="settings-form-grid">
          <label className="settings-field">
            <span>Site name</span>
            <input
              value={settings.siteName}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  siteName: event.target.value,
                }))
              }
            />
          </label>

          <label className="settings-field">
            <span>Site tagline</span>
            <input
              value={settings.siteTagline}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  siteTagline: event.target.value,
                }))
              }
            />
          </label>

          <label className="settings-field">
            <span>Heading font</span>
            <input
              value={settings.fontHeading}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  fontHeading: event.target.value,
                }))
              }
            />
          </label>

          <label className="settings-field">
            <span>Body font</span>
            <input
              value={settings.fontBody}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  fontBody: event.target.value,
                }))
              }
            />
          </label>
        </div>
      </section>
    </main>
  );
}
