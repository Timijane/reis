"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Loader2 } from "lucide-react";
import {
  defaultHomepageContent,
  getHomepageContent,
  saveHomepageContent,
  type HomepageContent,
} from "@/lib/cms/homepage";
import {
  watchAdminAuth,
  type AdminUser,
} from "@/lib/admin/auth";
import "./homepage.css";

export default function HomepageCMS() {
  const router = useRouter();

  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [content, setContent] =
    useState<HomepageContent>(defaultHomepageContent);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = watchAdminAuth(async (_user, authorizedAdmin, authLoading) => {
      if (authLoading) return;

      if (!authorizedAdmin) {
        router.replace("/admin/login");
        return;
      }

      setAdmin(authorizedAdmin);

      try {
        const homepage = await getHomepageContent();
        setContent(homepage);
      } catch (error) {
        console.error("Failed to load homepage content:", error);
        setMessage("Unable to load homepage content.");
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [router]);

  function updateField(
    field: keyof HomepageContent,
    value: string
  ) {
    setContent((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSave() {
    if (!admin || saving) return;

    setSaving(true);
    setMessage("");

    try {
      await saveHomepageContent(content);
      setMessage("Homepage content saved successfully.");
    } catch (error) {
      console.error("Failed to save homepage content:", error);
      setMessage("Unable to save homepage content.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="homepage-cms-loading">
        <Loader2 className="homepage-spinner" size={28} />
        <p>Loading homepage editor...</p>
      </main>
    );
  }

  return (
    <main className="homepage-cms">
      <header className="homepage-cms-header">
        <div>
          <button
            className="back-button"
            onClick={() => router.push("/admin")}
          >
            <ArrowLeft size={17} />
            Back to Dashboard
          </button>

          <p className="cms-eyebrow">WEBSITE CONTENT</p>
          <h1>Homepage</h1>
          <p className="cms-intro">
            Manage the main content displayed across the REIS homepage.
          </p>
        </div>

        <button
          className="save-button"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="homepage-spinner" size={17} />
          ) : (
            <Save size={17} />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </header>

      {message && (
        <div className="cms-message" role="status">
          {message}
        </div>
      )}

      <section className="cms-section">
        <div className="section-heading">
          <span>00</span>
          <div>
            <h2>Brand & Login</h2>
            <p>Control the public logo and administration login branding.</p>
          </div>
        </div>

        <div className="cms-grid">
          <Field
            label="Logo Image URL"
            value={content.logoUrl}
            full
            onChange={(value) => updateField("logoUrl", value)}
          />

          <Field
            label="Brand Name"
            value={content.brandName}
            onChange={(value) => updateField("brandName", value)}
          />

          <Field
            label="Brand Subtext"
            value={content.brandSubtext}
            onChange={(value) => updateField("brandSubtext", value)}
          />

          <Field
            label="Login Eyebrow"
            value={content.loginEyebrow}
            onChange={(value) => updateField("loginEyebrow", value)}
          />

          <Field
            label="Login Title"
            value={content.loginTitle}
            onChange={(value) => updateField("loginTitle", value)}
          />

          <Field
            label="Login Description"
            value={content.loginDescription}
            full
            textarea
            onChange={(value) => updateField("loginDescription", value)}
          />
        </div>
      </section>

      <section className="cms-section">
        <div className="section-heading">
          <span>01</span>
          <div>
            <h2>Hero Section</h2>
            <p>The first message visitors see on the homepage.</p>
          </div>
        </div>

        <div className="cms-grid">
          <Field
            label="Eyebrow"
            value={content.heroEyebrow}
            onChange={(value) => updateField("heroEyebrow", value)}
          />

          <Field
            label="Primary Button"
            value={content.heroPrimaryCta}
            onChange={(value) => updateField("heroPrimaryCta", value)}
          />

          <Field
            label="Hero Title"
            value={content.heroTitle}
            full
            textarea
            onChange={(value) => updateField("heroTitle", value)}
          />

          <Field
            label="Hero Description"
            value={content.heroDescription}
            full
            textarea
            onChange={(value) => updateField("heroDescription", value)}
          />

          <Field
            label="Secondary Button"
            value={content.heroSecondaryCta}
            onChange={(value) => updateField("heroSecondaryCta", value)}
          />
        </div>
      </section>

      <section className="cms-section">
        <div className="section-heading">
          <span>02</span>
          <div>
            <h2>About Section</h2>
            <p>Introduce REIS and its event services.</p>
          </div>
        </div>

        <div className="cms-grid">
          <Field
            label="Eyebrow"
            value={content.aboutEyebrow}
            onChange={(value) => updateField("aboutEyebrow", value)}
          />

          <Field
            label="Title"
            value={content.aboutTitle}
            onChange={(value) => updateField("aboutTitle", value)}
          />

          <Field
            label="Description"
            value={content.aboutText}
            full
            textarea
            onChange={(value) => updateField("aboutText", value)}
          />
        </div>
      </section>

      <section className="cms-section">
        <div className="section-heading">
          <span>03</span>
          <div>
            <h2>Featured Rentals</h2>
            <p>Introduction to the rental collection.</p>
          </div>
        </div>

        <div className="cms-grid">
          <Field
            label="Eyebrow"
            value={content.featuredEyebrow}
            onChange={(value) => updateField("featuredEyebrow", value)}
          />

          <Field
            label="Title"
            value={content.featuredTitle}
            onChange={(value) => updateField("featuredTitle", value)}
          />

          <Field
            label="Description"
            value={content.featuredDescription}
            full
            textarea
            onChange={(value) =>
              updateField("featuredDescription", value)
            }
          />
        </div>
      </section>

      <section className="cms-section">
        <div className="section-heading">
          <span>04</span>
          <div>
            <h2>Services</h2>
            <p>Control the introduction to REIS services.</p>
          </div>
        </div>

        <div className="cms-grid">
          <Field
            label="Eyebrow"
            value={content.servicesEyebrow}
            onChange={(value) => updateField("servicesEyebrow", value)}
          />

          <Field
            label="Title"
            value={content.servicesTitle}
            onChange={(value) => updateField("servicesTitle", value)}
          />

          <Field
            label="Description"
            value={content.servicesDescription}
            full
            textarea
            onChange={(value) =>
              updateField("servicesDescription", value)
            }
          />
        </div>
      </section>

      <section className="cms-section">
        <div className="section-heading">
          <span>05</span>
          <div>
            <h2>Process</h2>
            <p>Introduction to the booking process.</p>
          </div>
        </div>

        <div className="cms-grid">
          <Field
            label="Eyebrow"
            value={content.processEyebrow}
            onChange={(value) => updateField("processEyebrow", value)}
          />

          <Field
            label="Title"
            value={content.processTitle}
            onChange={(value) => updateField("processTitle", value)}
          />
        </div>
      </section>

      <section className="cms-section">
        <div className="section-heading">
          <span>06</span>
          <div>
            <h2>Gallery</h2>
            <p>Introduction to the REIS event gallery.</p>
          </div>
        </div>

        <div className="cms-grid">
          <Field
            label="Eyebrow"
            value={content.galleryEyebrow}
            onChange={(value) => updateField("galleryEyebrow", value)}
          />

          <Field
            label="Title"
            value={content.galleryTitle}
            onChange={(value) => updateField("galleryTitle", value)}
          />
        </div>
      </section>

      <section className="cms-section">
        <div className="section-heading">
          <span>07</span>
          <div>
            <h2>Testimonials</h2>
            <p>Introduction to client testimonials.</p>
          </div>
        </div>

        <div className="cms-grid">
          <Field
            label="Eyebrow"
            value={content.testimonialEyebrow}
            onChange={(value) =>
              updateField("testimonialEyebrow", value)
            }
          />

          <Field
            label="Title"
            value={content.testimonialTitle}
            onChange={(value) =>
              updateField("testimonialTitle", value)
            }
          />
        </div>
      </section>

      <section className="cms-section">
        <div className="section-heading">
          <span>08</span>
          <div>
            <h2>Final Call to Action</h2>
            <p>The closing conversion section of the homepage.</p>
          </div>
        </div>

        <div className="cms-grid">
          <Field
            label="Eyebrow"
            value={content.finalCtaEyebrow}
            onChange={(value) =>
              updateField("finalCtaEyebrow", value)
            }
          />

          <Field
            label="Button"
            value={content.finalCtaButton}
            onChange={(value) =>
              updateField("finalCtaButton", value)
            }
          />

          <Field
            label="Title"
            value={content.finalCtaTitle}
            full
            textarea
            onChange={(value) =>
              updateField("finalCtaTitle", value)
            }
          />

          <Field
            label="Description"
            value={content.finalCtaDescription}
            full
            textarea
            onChange={(value) =>
              updateField("finalCtaDescription", value)
            }
          />
        </div>
      </section>

      <footer className="cms-footer">
        <button
          className="save-button"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Homepage"}
        </button>
      </footer>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea = false,
  full = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
  full?: boolean;
}) {
  return (
    <label className={`cms-field ${full ? "cms-field-full" : ""}`}>
      <span>{label}</span>

      {textarea ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}
