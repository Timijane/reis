"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  defaultHomepageContent,
  getHomepageContent,
  saveHomepageContent,
  type HomepageContent,
} from "@/lib/cms/homepage";
import { watchAdminAuth, type AdminUser } from "@/lib/admin/auth";
import "./homepage.css";

function Field({
  label,
  value,
  onChange,
  multiline = false,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  hint?: string;
}) {
  return (
    <label className="cms-field">
      <span>{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export default function HomepageAdmin() {
  const router = useRouter();

  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [content, setContent] =
    useState<HomepageContent>(defaultHomepageContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const unsubscribe = watchAdminAuth(async (_, currentAdmin, authLoading) => {
      if (authLoading) return;

      if (!currentAdmin) {
        router.replace("/admin/login");
        return;
      }

      setAdmin(currentAdmin);

      try {
        const data = await getHomepageContent();
        setContent(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [router]);

  function update<K extends keyof HomepageContent>(
    key: K,
    value: HomepageContent[K]
  ) {
    setContent((current) => ({
      ...current,
      [key]: value,
    }));
    setSaved(false);
  }

  async function save() {
    if (!admin) return;

    setSaving(true);
    setSaved(false);

    try {
      await saveHomepageContent(content);
      setSaved(true);
    } catch (error) {
      console.error(error);
      alert("Could not save homepage content.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="cms-loading">
        <Loader2 className="spin" size={22} />
        Loading homepage editor...
      </main>
    );
  }

  return (
    <main className="homepage-cms">
      <header className="cms-header">
        <div>
          <button
            className="cms-back"
            onClick={() => router.push("/admin")}
          >
            <ArrowLeft size={16} />
            Dashboard
          </button>

          <p className="cms-eyebrow">REIS EVENT SERVICES · CMS</p>
          <h1>Homepage</h1>
          <p>Edit the words, buttons, contact details and images displayed on the public homepage.</p>
        </div>

        <button className="cms-save" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="spin" size={17} /> : <Save size={17} />}
          {saving ? "Saving..." : saved ? "Saved" : "Save changes"}
        </button>
      </header>

      <section className="cms-section">
        <div className="cms-section-title">
          <span>00</span>
          <div>
            <h2>Brand & announcement</h2>
            <p>Everything appearing at the top of the website.</p>
          </div>
        </div>

        <div className="cms-grid">
          <Field label="Logo image URL" value={content.logoUrl} onChange={(v) => update("logoUrl", v)} />
          <Field label="Hero image URL" value={content.heroImage} onChange={(v) => update("heroImage", v)} />
          <Field label="Brand name" value={content.brandName} onChange={(v) => update("brandName", v)} />
          <Field label="Brand subtext" value={content.brandSubtext} onChange={(v) => update("brandSubtext", v)} />
          <Field label="Announcement" value={content.announcement} onChange={(v) => update("announcement", v)} multiline />
        </div>
      </section>

      <section className="cms-section">
        <div className="cms-section-title"><span>01</span><div><h2>Navigation</h2><p>Every menu label is editable.</p></div></div>
        <div className="cms-grid">
          <Field label="Home" value={content.navHome} onChange={(v) => update("navHome", v)} />
          <Field label="Rentals" value={content.navRentals} onChange={(v) => update("navRentals", v)} />
          <Field label="Services" value={content.navServices} onChange={(v) => update("navServices", v)} />
          <Field label="Our Work" value={content.navWork} onChange={(v) => update("navWork", v)} />
          <Field label="About" value={content.navAbout} onChange={(v) => update("navAbout", v)} />
          <Field label="Navigation CTA" value={content.navCta} onChange={(v) => update("navCta", v)} />
        </div>
      </section>

      <section className="cms-section">
        <div className="cms-section-title"><span>02</span><div><h2>Hero</h2><p>Main opening message.</p></div></div>
        <div className="cms-grid">
          <Field label="Eyebrow" value={content.heroEyebrow} onChange={(v) => update("heroEyebrow", v)} />
          <Field label="Hero title" value={content.heroTitle} onChange={(v) => update("heroTitle", v)} multiline />
          <Field label="Hero description" value={content.heroDescription} onChange={(v) => update("heroDescription", v)} multiline />
          <Field label="Primary button" value={content.heroPrimaryCta} onChange={(v) => update("heroPrimaryCta", v)} />
          <Field label="Secondary link" value={content.heroSecondaryCta} onChange={(v) => update("heroSecondaryCta", v)} />
          <Field label="Hero note" value={content.heroNote} onChange={(v) => update("heroNote", v)} />
        </div>
      </section>

      <section className="cms-section">
        <div className="cms-section-title"><span>03</span><div><h2>Rentals</h2><p>Section text and all six featured rental cards.</p></div></div>
        <div className="cms-grid">
          <Field label="Eyebrow" value={content.featuredEyebrow} onChange={(v) => update("featuredEyebrow", v)} />
          <Field label="Title" value={content.featuredTitle} onChange={(v) => update("featuredTitle", v)} multiline />
          <Field label="Description" value={content.featuredDescription} onChange={(v) => update("featuredDescription", v)} multiline />
          <Field label="Card link text" value={content.rentalViewText} onChange={(v) => update("rentalViewText", v)} />
        </div>

        <div className="cms-subtitle">Rental cards</div>

        <div className="cms-grid">
          <Field label="Rental 1 name" value={content.rental1Name} onChange={(v) => update("rental1Name", v)} />
          <Field label="Rental 1 image" value={content.rental1Image} onChange={(v) => update("rental1Image", v)} />
          <Field label="Rental 2 name" value={content.rental2Name} onChange={(v) => update("rental2Name", v)} />
          <Field label="Rental 2 image" value={content.rental2Image} onChange={(v) => update("rental2Image", v)} />
          <Field label="Rental 3 name" value={content.rental3Name} onChange={(v) => update("rental3Name", v)} />
          <Field label="Rental 3 image" value={content.rental3Image} onChange={(v) => update("rental3Image", v)} />
          <Field label="Rental 4 name" value={content.rental4Name} onChange={(v) => update("rental4Name", v)} />
          <Field label="Rental 4 image" value={content.rental4Image} onChange={(v) => update("rental4Image", v)} />
          <Field label="Rental 5 name" value={content.rental5Name} onChange={(v) => update("rental5Name", v)} />
          <Field label="Rental 5 image" value={content.rental5Image} onChange={(v) => update("rental5Image", v)} />
          <Field label="Rental 6 name" value={content.rental6Name} onChange={(v) => update("rental6Name", v)} />
          <Field label="Rental 6 image" value={content.rental6Image} onChange={(v) => update("rental6Image", v)} />
        </div>
      </section>

      <section className="cms-section">
        <div className="cms-section-title"><span>04</span><div><h2>Services</h2><p>Intro and three service blocks.</p></div></div>
        <div className="cms-grid">
          <Field label="Eyebrow" value={content.servicesEyebrow} onChange={(v) => update("servicesEyebrow", v)} />
          <Field label="Title" value={content.servicesTitle} onChange={(v) => update("servicesTitle", v)} multiline />
          <Field label="Description" value={content.servicesDescription} onChange={(v) => update("servicesDescription", v)} multiline />
          <Field label="Button" value={content.servicesCta} onChange={(v) => update("servicesCta", v)} />
          <Field label="Service 1 title" value={content.service1Title} onChange={(v) => update("service1Title", v)} />
          <Field label="Service 1 text" value={content.service1Text} onChange={(v) => update("service1Text", v)} multiline />
          <Field label="Service 2 title" value={content.service2Title} onChange={(v) => update("service2Title", v)} />
          <Field label="Service 2 text" value={content.service2Text} onChange={(v) => update("service2Text", v)} multiline />
          <Field label="Service 3 title" value={content.service3Title} onChange={(v) => update("service3Title", v)} />
          <Field label="Service 3 text" value={content.service3Text} onChange={(v) => update("service3Text", v)} multiline />
        </div>
      </section>

      <section className="cms-section">
        <div className="cms-section-title"><span>05</span><div><h2>Gallery</h2><p>Gallery text and five image slots.</p></div></div>
        <div className="cms-grid">
          <Field label="Eyebrow" value={content.galleryEyebrow} onChange={(v) => update("galleryEyebrow", v)} />
          <Field label="Title" value={content.galleryTitle} onChange={(v) => update("galleryTitle", v)} />
          <Field label="Description" value={content.galleryDescription} onChange={(v) => update("galleryDescription", v)} multiline />
          <Field label="Gallery image 1" value={content.gallery1Image} onChange={(v) => update("gallery1Image", v)} />
          <Field label="Gallery image 2" value={content.gallery2Image} onChange={(v) => update("gallery2Image", v)} />
          <Field label="Gallery image 3" value={content.gallery3Image} onChange={(v) => update("gallery3Image", v)} />
          <Field label="Gallery image 4" value={content.gallery4Image} onChange={(v) => update("gallery4Image", v)} />
          <Field label="Gallery image 5" value={content.gallery5Image} onChange={(v) => update("gallery5Image", v)} />
        </div>
      </section>

      <section className="cms-section">
        <div className="cms-section-title"><span>06</span><div><h2>About</h2><p>About section copy and image.</p></div></div>
        <div className="cms-grid">
          <Field label="Eyebrow" value={content.aboutEyebrow} onChange={(v) => update("aboutEyebrow", v)} />
          <Field label="Title" value={content.aboutTitle} onChange={(v) => update("aboutTitle", v)} multiline />
          <Field label="Paragraph 1" value={content.aboutText1} onChange={(v) => update("aboutText1", v)} multiline />
          <Field label="Paragraph 2" value={content.aboutText2} onChange={(v) => update("aboutText2", v)} multiline />
          <Field label="Button" value={content.aboutCta} onChange={(v) => update("aboutCta", v)} />
          <Field label="About image" value={content.aboutImage} onChange={(v) => update("aboutImage", v)} />
        </div>
      </section>

      <section className="cms-section">
        <div className="cms-section-title"><span>07</span><div><h2>Contact CTA</h2><p>The final enquiry section.</p></div></div>
        <div className="cms-grid">
          <Field label="Eyebrow" value={content.finalCtaEyebrow} onChange={(v) => update("finalCtaEyebrow", v)} />
          <Field label="Title" value={content.finalCtaTitle} onChange={(v) => update("finalCtaTitle", v)} multiline />
          <Field label="Description" value={content.finalCtaDescription} onChange={(v) => update("finalCtaDescription", v)} multiline />
          <Field label="Call button" value={content.finalCtaCall} onChange={(v) => update("finalCtaCall", v)} />
          <Field label="WhatsApp button" value={content.finalCtaWhatsapp} onChange={(v) => update("finalCtaWhatsapp", v)} />
        </div>
      </section>

      <section className="cms-section">
        <div className="cms-section-title"><span>08</span><div><h2>Footer</h2><p>Contact information and footer text.</p></div></div>
        <div className="cms-grid">
          <Field label="Footer tagline" value={content.footerTagline} onChange={(v) => update("footerTagline", v)} />
          <Field label="Phone 1" value={content.phone1} onChange={(v) => update("phone1", v)} />
          <Field label="Phone 2" value={content.phone2} onChange={(v) => update("phone2", v)} />
          <Field label="Email" value={content.email} onChange={(v) => update("email", v)} />
          <Field label="Copyright name" value={content.copyrightName} onChange={(v) => update("copyrightName", v)} />
          <Field label="Footer category" value={content.footerCategory} onChange={(v) => update("footerCategory", v)} />
          <Field label="Copyright prefix" value={content.footerYearPrefix} onChange={(v) => update("footerYearPrefix", v)} />
        </div>
      </section>

      <div className="cms-bottom-save">
        <button className="cms-save" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="spin" size={17} /> : <Save size={17} />}
          {saving ? "Saving..." : saved ? "Saved" : "Save all homepage changes"}
        </button>
      </div>
    </main>
  );
}
