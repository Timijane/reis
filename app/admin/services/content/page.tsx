"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { watchAdminAuth, type AdminUser } from "@/lib/admin/auth";
import {
  getHomepageContent,
  saveHomepageContent,
  type HomepageContent,
} from "@/lib/cms/homepage";
import "./services.css";

const SERVICE_FIELDS = [
  ["servicesEyebrow", "Section eyebrow", false],
  ["servicesTitle", "Section title", true],
  ["servicesDescription", "Section description", true],
  ["servicesCta", "Call-to-action button", false],
  ["service1Title", "Service 1 title", false],
  ["service1Text", "Service 1 description", true],
  ["service2Title", "Service 2 title", false],
  ["service2Text", "Service 2 description", true],
  ["service3Title", "Service 3 title", false],
  ["service3Text", "Service 3 description", true],
] as const;

type ServiceField = (typeof SERVICE_FIELDS)[number][0];

export default function ServicesAdminPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [content, setContent] = useState<HomepageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    const unsubscribe = watchAdminAuth(async (_, currentAdmin, authLoading) => {
      if (!active || authLoading) return;

      if (!currentAdmin) {
        router.replace("/admin/login");
        return;
      }

      setAdmin(currentAdmin);

      try {
        const existing = await getHomepageContent();
        if (active) setContent(existing);
      } catch (error) {
        console.error(error);
        if (active) setMessage("Could not load service content. Please retry.");
      } finally {
        if (active) setLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [router]);

  function update<K extends ServiceField>(key: K, value: HomepageContent[K]) {
    setContent((current) => current ? { ...current, [key]: value } : current);
    setMessage("");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!admin || !content || saving) return;

    setSaving(true);
    setMessage("");

    try {
      const latest = await getHomepageContent();
      const patch = Object.fromEntries(
        SERVICE_FIELDS.map(([key]) => [key, content[key]])
      ) as Partial<HomepageContent>;

      await saveHomepageContent({ ...latest, ...patch });
      setContent({ ...latest, ...patch });
      setMessage("Services saved successfully.");
    } catch (error) {
      console.error(error);
      setMessage("Could not save services. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="services-admin-loading">
        <Loader2 size={22} /> Loading services…
      </main>
    );
  }

  if (!content || !admin) {
    return (
      <main className="services-admin-loading">
        {message || "Unable to load services."}
      </main>
    );
  }

  return (
    <main className="services-admin">
      <header className="services-admin-header">
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="services-back"
        >
          <ArrowLeft size={16} /> Dashboard
        </button>
        <p className="services-eyebrow">REIS EVENT SERVICES · CMS</p>
        <h1>Services</h1>
        <p>Edit the service content displayed in the Services section of your website.</p>
      </header>

      <form className="services-admin-form" onSubmit={save}>
        {SERVICE_FIELDS.map(([key, label, multiline]) => (
          <label className="services-field" key={key}>
            <span>{label}</span>
            {multiline ? (
              <textarea
                rows={4}
                value={content[key]}
                onChange={(event) => update(key, event.target.value)}
              />
            ) : (
              <input
                value={content[key]}
                onChange={(event) => update(key, event.target.value)}
              />
            )}
          </label>
        ))}

        <div className="services-form-footer">
          <p role="status">{message}</p>
          <button type="submit" disabled={saving}>
            {saving
              ? <Loader2 size={17} className="services-spin" />
              : <Save size={17} />}
            {saving ? "Saving…" : "Save services"}
          </button>
        </div>
      </form>
    </main>
  );
}
