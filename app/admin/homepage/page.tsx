"use client";

import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  defaultHomepageContent,
  getHomepageContent,
  saveHomepageContent,
  type HomepageContent,
  type HomepageGradient,
  type HomepageImageItem,
  type HomepagePalette,
  type NavItem,
} from "@/lib/cms/homepage";
import { watchAdminAuth, type AdminUser } from "@/lib/admin/auth";
import "./homepage.css";

function Field({
  label,
  value,
  onChange,
  multiline = false,
  hint,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  hint?: string;
  type?: string;
}) {
  return (
    <label className="cms-field">
      <span>{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {hint && <small>{hint}</small>}
    </label>
  );
}

function Section({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="cms-section">
      <div className="cms-section-title">
        <span>{number}</span>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function ImageCollectionEditor({
  title,
  description,
  items,
  onChange,
  defaultTitle,
}: {
  title: string;
  description: string;
  items: HomepageImageItem[];
  onChange: (items: HomepageImageItem[]) => void;
  defaultTitle: string;
}) {
  function updateItem(index: number, changes: Partial<HomepageImageItem>) {
    onChange(
      items.map((item, itemIndex) =>
        index === itemIndex ? { ...item, ...changes } : item
      )
    );
  }

  function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function addItem() {
    onChange([
      ...items,
      {
        id: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
        title: defaultTitle,
        image: "",
        href: "",
        alt: defaultTitle,
        visible: true,
      },
    ]);
  }

  function removeItem(index: number) {
    if (!window.confirm("Remove this image from the homepage collection?")) {
      return;
    }
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="collection-editor">
      <div className="collection-heading">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <button type="button" className="cms-secondary-button" onClick={addItem}>
          <Plus size={16} /> Add image
        </button>
      </div>

      {items.length === 0 && (
        <div className="cms-empty">
          No images yet. Select “Add image” to create your first item.
        </div>
      )}

      {items.map((item, index) => (
        <article className="collection-item" key={item.id}>
          <div className="collection-item-top">
            <div className="collection-index">
              {String(index + 1).padStart(2, "0")}
            </div>
            <strong>{item.title || `Untitled image ${index + 1}`}</strong>
            <div className="collection-actions">
              <button
                type="button"
                title="Move up"
                onClick={() => moveItem(index, -1)}
                disabled={index === 0}
              >
                <ArrowUp size={16} />
              </button>
              <button
                type="button"
                title="Move down"
                onClick={() => moveItem(index, 1)}
                disabled={index === items.length - 1}
              >
                <ArrowDown size={16} />
              </button>
              <button
                type="button"
                title={item.visible ? "Hide image" : "Show image"}
                onClick={() => updateItem(index, { visible: !item.visible })}
              >
                {item.visible ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              <button
                type="button"
                className="cms-danger"
                title="Delete image"
                onClick={() => removeItem(index)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <div className="collection-body">
            <div className="collection-preview">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt={item.alt || item.title} />
              ) : (
                <div className="collection-placeholder">Image preview</div>
              )}
              {!item.visible && <span className="hidden-badge">Hidden</span>}
            </div>

            <div className="cms-grid">
              <Field
                label="Image title"
                value={item.title}
                onChange={(value) => updateItem(index, { title: value })}
              />
              <Field
                label="Image URL"
                value={item.image}
                onChange={(value) => updateItem(index, { image: value })}
                hint="Paste the uploaded image URL."
              />
              <Field
                label="Image destination"
                value={item.href}
                onChange={(value) => updateItem(index, { href: value })}
                hint="For example, #contact or /explore. Leave blank for no link."
              />
              <Field
                label="Alternative text"
                value={item.alt}
                onChange={(value) => updateItem(index, { alt: value })}
                hint="Describe the image for accessibility."
              />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function NavigationEditor({
  items,
  onChange,
}: {
  items: NavItem[];
  onChange: (items: NavItem[]) => void;
}) {
  function updateItem(index: number, changes: Partial<NavItem>) {
    onChange(
      items.map((item, itemIndex) =>
        index === itemIndex ? { ...item, ...changes } : item
      )
    );
  }

  return (
    <div className="navigation-editor">
      {items.map((item, index) => (
        <div className="navigation-item" key={item.id}>
          <div className="navigation-index">{String(index + 1).padStart(2, "0")}</div>
          <div className="navigation-fields">
            <Field
              label="Menu label"
              value={item.label}
              onChange={(value) => updateItem(index, { label: value })}
            />
            <Field
              label="Destination"
              value={item.href}
              onChange={(value) => updateItem(index, { href: value })}
              hint="#about, /explore or a full URL."
            />
          </div>
          <div className="collection-actions">
            <button
              type="button"
              title="Move up"
              disabled={index === 0}
              onClick={() => {
                const next = [...items];
                [next[index - 1], next[index]] = [next[index], next[index - 1]];
                onChange(next);
              }}
            >
              <ArrowUp size={16} />
            </button>
            <button
              type="button"
              title="Move down"
              disabled={index === items.length - 1}
              onClick={() => {
                const next = [...items];
                [next[index + 1], next[index]] = [next[index], next[index + 1]];
                onChange(next);
              }}
            >
              <ArrowDown size={16} />
            </button>
            <button
              type="button"
              title={item.visible ? "Hide menu item" : "Show menu item"}
              onClick={() => updateItem(index, { visible: !item.visible })}
            >
              {item.visible ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
            <button
              type="button"
              className="cms-danger"
              title="Delete menu item"
              onClick={() => {
                if (window.confirm("Delete this menu item?")) {
                  onChange(items.filter((_, itemIndex) => itemIndex !== index));
                }
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="cms-secondary-button"
        onClick={() =>
          onChange([
            ...items,
            {
              id: `menu-${Date.now()}`,
              label: "New menu item",
              href: "#",
              visible: true,
            },
          ])
        }
      >
        <Plus size={16} /> Add menu item
      </button>
    </div>
  );
}


const colourGroups: { name: string; colours: { name: string; hex: string }[] }[] = [
  { name: "Whites & creams", colours: [
    ["White", "#FFFFFF"], ["Ivory", "#FFFFF0"], ["Cream", "#FFFDD0"],
    ["Pearl", "#F8F6F0"], ["Snow", "#FFFAFA"], ["Floral white", "#FFFAF0"],
    ["Linen", "#FAF0E6"], ["Antique white", "#FAEBD7"], ["Vanilla", "#F3E5AB"],
    ["Alabaster", "#F2F0E6"], ["Champagne", "#F7E7CE"], ["Eggshell", "#F0EAD6"],
  ].map(([name, hex]) => ({ name, hex })) },
  { name: "Neutrals", colours: [
    ["Beige", "#F5F5DC"], ["Sand", "#C2B280"], ["Taupe", "#483C32"],
    ["Greige", "#B8B1A1"], ["Stone", "#928E85"], ["Warm grey", "#A8A29E"],
    ["Silver", "#C0C0C0"], ["Ash grey", "#B2BEB5"], ["Slate", "#708090"],
    ["Charcoal", "#36454F"], ["Graphite", "#383838"], ["Black", "#000000"],
    ["Smoke", "#738276"], ["Mushroom", "#BAA99A"],
  ].map(([name, hex]) => ({ name, hex })) },
  { name: "Reds & pinks", colours: [
    ["Red", "#FF0000"], ["Crimson", "#DC143C"], ["Burgundy", "#800020"],
    ["Wine", "#722F37"], ["Rose", "#FF007F"], ["Blush", "#DE5D83"],
    ["Dusty rose", "#C08081"], ["Baby pink", "#F4C2C2"], ["Coral pink", "#F88379"],
    ["Salmon", "#FA8072"], ["Hot pink", "#FF69B4"], ["Magenta", "#FF00FF"],
    ["Mauve pink", "#E0B0FF"], ["Raspberry", "#E30B5C"],
  ].map(([name, hex]) => ({ name, hex })) },
  { name: "Oranges & browns", colours: [
    ["Orange", "#FFA500"], ["Burnt orange", "#CC5500"], ["Terracotta", "#E2725B"],
    ["Peach", "#FFE5B4"], ["Apricot", "#FBCEB1"], ["Copper", "#B87333"],
    ["Caramel", "#C68E17"], ["Camel", "#C19A6B"], ["Chocolate", "#7B3F00"],
    ["Coffee", "#6F4E37"], ["Mocha", "#967969"], ["Chestnut", "#954535"],
    ["Cinnamon", "#D2691E"], ["Rust", "#B7410E"],
  ].map(([name, hex]) => ({ name, hex })) },
  { name: "Yellows & golds", colours: [
    ["Yellow", "#FFFF00"], ["Lemon", "#FFF44F"], ["Mustard", "#FFDB58"],
    ["Gold", "#D4AF37"], ["Champagne gold", "#C5A572"], ["Honey", "#FFC30B"],
    ["Amber", "#FFBF00"], ["Saffron", "#F4C430"], ["Pale gold", "#E6BE8A"],
    ["Wheat", "#F5DEB3"], ["Ochre", "#CC7722"], ["Butter", "#FFF1A8"],
  ].map(([name, hex]) => ({ name, hex })) },
  { name: "Greens", colours: [
    ["Green", "#008000"], ["Sage", "#A3B18A"], ["Olive", "#68765B"],
    ["Forest green", "#228B22"], ["Emerald", "#50C878"], ["Mint", "#98FF98"],
    ["Seafoam", "#9FE2BF"], ["Moss", "#8A9A5B"], ["Lime", "#BFFF00"],
    ["Pistachio", "#93C572"], ["Jade", "#00A86B"], ["Teal green", "#008080"],
    ["Eucalyptus", "#7D9D83"], ["Pine", "#01796F"],
  ].map(([name, hex]) => ({ name, hex })) },
  { name: "Blues", colours: [
    ["Blue", "#0000FF"], ["Navy", "#000080"], ["Royal blue", "#4169E1"],
    ["Sky blue", "#87CEEB"], ["Baby blue", "#89CFF0"], ["Powder blue", "#B0E0E6"],
    ["Cobalt", "#0047AB"], ["Denim", "#1560BD"], ["Teal", "#008080"],
    ["Turquoise", "#40E0D0"], ["Aqua", "#00FFFF"], ["Steel blue", "#4682B4"],
    ["Midnight blue", "#191970"], ["Periwinkle", "#CCCCFF"],
  ].map(([name, hex]) => ({ name, hex })) },
  { name: "Purples", colours: [
    ["Purple", "#800080"], ["Lavender", "#E6E6FA"], ["Lilac", "#C8A2C8"],
    ["Violet", "#8F00FF"], ["Plum", "#8E4585"], ["Amethyst", "#9966CC"],
    ["Orchid", "#DA70D6"], ["Mauve", "#E0B0FF"], ["Grape", "#6F2DA8"],
    ["Indigo", "#4B0082"], ["Wisteria", "#C9A0DC"], ["Mulberry", "#C54B8C"],
  ].map(([name, hex]) => ({ name, hex })) },
  { name: "Pastels & muted", colours: [
    ["Pastel blue", "#AEC6CF"], ["Pastel green", "#77DD77"],
    ["Pastel yellow", "#FDFD96"], ["Pastel pink", "#FFD1DC"],
    ["Pastel purple", "#B39EB5"], ["Pastel orange", "#FFB347"],
    ["Dusty blue", "#7A9EAE"], ["Muted olive", "#8B8C62"],
    ["Soft sage", "#C5D0B5"], ["Warm blush", "#E8B4B8"],
    ["Pale mint", "#DFF5E1"], ["Soft lavender", "#DCD0FF"],
  ].map(([name, hex]) => ({ name, hex })) },
];

const themePresets = [
  { name: "Elegant Neutral", values: ["#F3F0EA", "#FAF9F6", "#161614", "#77756E", "#68765B", "#161614"] },
  { name: "Luxury Gold", values: ["#F7F0E3", "#FFFCF5", "#28231D", "#786B5B", "#C5A572", "#28231D"] },
  { name: "Botanical", values: ["#EDF1E8", "#FAFCF7", "#233126", "#68776B", "#66815A", "#233126"] },
  { name: "Modern Blue", values: ["#EAF1F8", "#FFFFFF", "#17283F", "#66788A", "#32689A", "#17283F"] },
  { name: "Romantic", values: ["#F9EEEE", "#FFF9F8", "#402B31", "#8A6F75", "#C08081", "#402B31"] },
  { name: "Earthy", values: ["#EEE2D2", "#FBF5ED", "#382C23", "#817062", "#B66A45", "#382C23"] },
  { name: "Black & White", values: ["#F1F1EF", "#FFFFFF", "#111111", "#666666", "#444444", "#111111"] },
  { name: "Sage & Cream", values: ["#E7E8DD", "#FBFAF4", "#2E3329", "#72776A", "#87966A", "#252920"] },
  { name: "Ocean", values: ["#E4F0F2", "#F8FCFC", "#17343B", "#617A80", "#287D88", "#17343B"] },
  { name: "Terracotta", values: ["#F4E7DC", "#FFFAF5", "#3D2B25", "#806D63", "#C46E4D", "#3D2B25"] },
];

const gradientPresets = [
  { name: "Champagne Glow", start: "#F7E7CE", end: "#C5A572", direction: "135deg" },
  { name: "Forest Evening", start: "#68765B", end: "#161614", direction: "135deg" },
  { name: "Ocean Breeze", start: "#89CFF0", end: "#32689A", direction: "135deg" },
  { name: "Rose Romance", start: "#FFD1DC", end: "#C08081", direction: "135deg" },
  { name: "Sunset", start: "#FFB347", end: "#FF69B4", direction: "135deg" },
  { name: "Lavender Dream", start: "#E6E6FA", end: "#9966CC", direction: "135deg" },
  { name: "Minimal Mist", start: "#FFFFFF", end: "#E7E5E4", direction: "180deg" },
  { name: "Deep Emerald", start: "#50C878", end: "#004B3A", direction: "135deg" },
];

const paletteLabels: { key: keyof HomepagePalette; label: string }[] = [
  { key: "cream", label: "Cream" },
  { key: "paper", label: "Page background" },
  { key: "ink", label: "Main text" },
  { key: "muted", label: "Muted text" },
  { key: "olive", label: "Olive accent" },
  { key: "footer", label: "Footer background" },
];

export default function HomepageAdmin() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [content, setContent] = useState<HomepageContent>(defaultHomepageContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [gradientStart, setGradientStart] = useState("#F7E7CE");
  const [gradientEnd, setGradientEnd] = useState("#C5A572");
  const [gradientDirection, setGradientDirection] = useState("135deg");
  const [gradientPreview, setGradientPreview] = useState("linear-gradient(135deg, #F7E7CE, #C5A572)");


  useEffect(() => {
    const unsubscribe = watchAdminAuth(
      async (_, currentAdmin, authLoading) => {
        if (authLoading) return;
        if (!currentAdmin) {
          router.replace("/admin/login");
          return;
        }

        setAdmin(currentAdmin);
        try {
          const data = await getHomepageContent();
          setGradientStart(data.homepageGradient.start);
          setGradientEnd(data.homepageGradient.end);
          setGradientDirection(data.homepageGradient.direction);
          setGradientPreview(
            `linear-gradient(${data.homepageGradient.direction}, ${data.homepageGradient.start}, ${data.homepageGradient.end})`
          );
          setContent(data);
        } catch (error) {
          console.error("Failed to load homepage settings:", error);
          setLoadError(true);
        } finally {
          setLoading(false);
        }
      }
    );
    return unsubscribe;
  }, [router]);

  function update<K extends keyof HomepageContent>(
    key: K,
    value: HomepageContent[K]
  ) {
    setContent((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function updatePalette(key: keyof HomepagePalette, value: string) {
    update("palette", { ...content.palette, [key]: value });
  }

  async function save() {
    if (!admin || saving) return;
    setSaving(true);
    setSaved(false);

    try {
      const contentToSave: HomepageContent = {
        ...content,
        homepageGradient: {
          ...content.homepageGradient,
          start: gradientStart,
          end: gradientEnd,
          direction: gradientDirection,
        },
      };

      await saveHomepageContent(contentToSave);
      setContent(contentToSave);
      setSaved(true);
    } catch (error) {
      console.error("Failed to save homepage settings:", error);
      alert("Could not save homepage settings. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="cms-loading">
        <Loader2 className="spin" size={22} />
        Loading homepage settings...
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="cms-loading">
        <div>
          <h1>Could not load homepage settings</h1>
          <p>Check your connection and permissions, then reload this page.</p>
          <button type="button" className="cms-secondary-button" onClick={() => window.location.reload()}>
            Reload editor
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="homepage-cms">
      <header className="cms-header">
        <div>
          <button type="button" className="cms-back" onClick={() => router.push("/admin")}>
            <ArrowLeft size={16} /> Dashboard
          </button>
          <p className="cms-eyebrow">REIS EVENT SERVICES · CONTENT STUDIO</p>
          <h1>Homepage editor</h1>
          <p className="cms-intro">
            Manage the public homepage, imagery, links and visual identity.
          </p>
        </div>
        <div className="cms-save-area">
          {saved && <span className="cms-saved-label">All changes saved</span>}
          <button type="button" className="cms-save" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="spin" size={17} /> : <Save size={17} />}
            {saving ? "Saving..." : saved ? "Saved" : "Save changes"}
          </button>
        </div>
      </header>

      <div className="cms-notice">
        <strong>Editing the main homepage</strong>
        <span>
          Changes are saved to the homepage content document. Image URLs should point to
          your uploaded media. Save after editing before leaving this page.
        </span>
      </div>

      <Section number="00" title="Brand & announcement" description="The identity and announcement visitors see first.">
        <div className="cms-grid">
          <Field label="Logo image URL" value={content.logoUrl} onChange={(v) => update("logoUrl", v)} />
          <Field label="Hero image URL" value={content.heroImage} onChange={(v) => update("heroImage", v)} />
          <Field label="Brand name" value={content.brandName} onChange={(v) => update("brandName", v)} />
          <Field label="Brand subtext" value={content.brandSubtext} onChange={(v) => update("brandSubtext", v)} />
          <Field label="Announcement" value={content.announcement} onChange={(v) => update("announcement", v)} multiline />
        </div>
      </Section>

      <Section number="01" title="Navigation" description="Rename, reorder, hide or remove header links.">
        <NavigationEditor
          items={content.navItems}
          onChange={(items) => update("navItems", items)}
        />
      </Section>

      <Section number="02" title="Hero section" description="The opening headline, image and calls to action.">
        <div className="cms-grid">
          <Field label="Eyebrow" value={content.heroEyebrow} onChange={(v) => update("heroEyebrow", v)} />
          <Field label="Headline" value={content.heroTitle} onChange={(v) => update("heroTitle", v)} multiline />
          <Field label="Description" value={content.heroDescription} onChange={(v) => update("heroDescription", v)} multiline />
          <Field label="Primary button label" value={content.heroPrimaryCta} onChange={(v) => update("heroPrimaryCta", v)} />
          <Field label="Primary button destination" value={content.heroPrimaryHref} onChange={(v) => update("heroPrimaryHref", v)} hint="Example: /explore. This can point to your future menu page." />
          <Field label="Secondary button label" value={content.heroSecondaryCta} onChange={(v) => update("heroSecondaryCta", v)} />
          <Field label="Secondary button destination" value={content.heroSecondaryHref} onChange={(v) => update("heroSecondaryHref", v)} hint="Example: #contact." />
          <Field label="Hero note" value={content.heroNote} onChange={(v) => update("heroNote", v)} />
        </div>
      </Section>

      <Section number="03" title="Rental showcase" description="Manage the featured cards. Add, remove, reorder, hide and link each image.">
        <div className="cms-grid">
          <Field label="Eyebrow" value={content.featuredEyebrow} onChange={(v) => update("featuredEyebrow", v)} />
          <Field label="Section title" value={content.featuredTitle} onChange={(v) => update("featuredTitle", v)} multiline />
          <Field label="Section description" value={content.featuredDescription} onChange={(v) => update("featuredDescription", v)} multiline />
          <Field label="Card link text" value={content.rentalViewText} onChange={(v) => update("rentalViewText", v)} />
          <Field label="Rental section destination" value={content.rentalsHref} onChange={(v) => update("rentalsHref", v)} hint="Example: /explore." />
        </div>
        <ImageCollectionEditor
          title="Rental cards"
          description="Your existing six cards have been carried forward."
          items={content.rentalCards}
          onChange={(items) => update("rentalCards", items)}
          defaultTitle="New rental"
        />
      </Section>

      <Section number="04" title="Services" description="The three service descriptions and their main link.">
        <div className="cms-grid">
          <Field label="Eyebrow" value={content.servicesEyebrow} onChange={(v) => update("servicesEyebrow", v)} />
          <Field label="Section title" value={content.servicesTitle} onChange={(v) => update("servicesTitle", v)} multiline />
          <Field label="Description" value={content.servicesDescription} onChange={(v) => update("servicesDescription", v)} multiline />
          <Field label="Button label" value={content.servicesCta} onChange={(v) => update("servicesCta", v)} />
          <Field label="Button destination" value={content.servicesCtaHref} onChange={(v) => update("servicesCtaHref", v)} />
          <Field label="Service 1 title" value={content.service1Title} onChange={(v) => update("service1Title", v)} />
          <Field label="Service 1 description" value={content.service1Text} onChange={(v) => update("service1Text", v)} multiline />
          <Field label="Service 2 title" value={content.service2Title} onChange={(v) => update("service2Title", v)} />
          <Field label="Service 2 description" value={content.service2Text} onChange={(v) => update("service2Text", v)} multiline />
          <Field label="Service 3 title" value={content.service3Title} onChange={(v) => update("service3Title", v)} />
          <Field label="Service 3 description" value={content.service3Text} onChange={(v) => update("service3Text", v)} multiline />
        </div>
      </Section>

      <Section number="05" title="Gallery" description="Build a flexible gallery of event photographs.">
        <div className="cms-grid">
          <Field label="Eyebrow" value={content.galleryEyebrow} onChange={(v) => update("galleryEyebrow", v)} />
          <Field label="Section title" value={content.galleryTitle} onChange={(v) => update("galleryTitle", v)} />
          <Field label="Description" value={content.galleryDescription} onChange={(v) => update("galleryDescription", v)} multiline />
        </div>
        <ImageCollectionEditor
          title="Gallery images"
          description="Your existing five images have been carried forward."
          items={content.galleryItems}
          onChange={(items) => update("galleryItems", items)}
          defaultTitle="New gallery image"
        />
      </Section>

      <Section number="06" title="About REIS" description="The about section copy, image and button.">
        <div className="cms-grid">
          <Field label="Eyebrow" value={content.aboutEyebrow} onChange={(v) => update("aboutEyebrow", v)} />
          <Field label="Title" value={content.aboutTitle} onChange={(v) => update("aboutTitle", v)} multiline />
          <Field label="Paragraph 1" value={content.aboutText1} onChange={(v) => update("aboutText1", v)} multiline />
          <Field label="Paragraph 2" value={content.aboutText2} onChange={(v) => update("aboutText2", v)} multiline />
          <Field label="Button label" value={content.aboutCta} onChange={(v) => update("aboutCta", v)} />
          <Field label="Button destination" value={content.aboutCtaHref} onChange={(v) => update("aboutCtaHref", v)} />
          <Field label="About image URL" value={content.aboutImage} onChange={(v) => update("aboutImage", v)} />
        </div>
      </Section>

      <Section number="07" title="Contact call to action" description="The final enquiry section and contact details.">
        <div className="cms-grid">
          <Field label="Eyebrow" value={content.finalCtaEyebrow} onChange={(v) => update("finalCtaEyebrow", v)} />
          <Field label="Title" value={content.finalCtaTitle} onChange={(v) => update("finalCtaTitle", v)} multiline />
          <Field label="Description" value={content.finalCtaDescription} onChange={(v) => update("finalCtaDescription", v)} multiline />
          <Field label="Call button label" value={content.finalCtaCall} onChange={(v) => update("finalCtaCall", v)} />
          <Field label="WhatsApp button label" value={content.finalCtaWhatsapp} onChange={(v) => update("finalCtaWhatsapp", v)} />
          <Field label="Phone 1" value={content.phone1} onChange={(v) => update("phone1", v)} />
          <Field label="Phone 2" value={content.phone2} onChange={(v) => update("phone2", v)} />
          <Field label="Email" value={content.email} onChange={(v) => update("email", v)} />
        </div>
      </Section>

      <Section number="08" title="Footer" description="Footer image, tagline and business details.">
        <div className="cms-grid">
          <Field label="Footer tagline" value={content.footerTagline} onChange={(v) => update("footerTagline", v)} />
          <Field label="Footer image URL" value={content.footerImage} onChange={(v) => update("footerImage", v)} hint="Optional image displayed in the footer." />
          <Field label="Copyright name" value={content.copyrightName} onChange={(v) => update("copyrightName", v)} />
          <Field label="Footer category" value={content.footerCategory} onChange={(v) => update("footerCategory", v)} />
          <Field label="Copyright prefix" value={content.footerYearPrefix} onChange={(v) => update("footerYearPrefix", v)} />
        </div>
      </Section>

      <Section number="09" title="Homepage colours" description="Choose colours visually, apply a ready-made theme, or build a gradient. Save your changes when you're happy.">
        <div className="colour-editor">
          <h3>Ready-made colour themes</h3>
          <p className="cms-hint">Choose a coordinated palette, then customise any colour below.</p>
          <div className="theme-preset-grid">
            {themePresets.map((theme) => (
              <button key={theme.name} type="button" className="theme-preset" onClick={() => {
                const keys: (keyof HomepagePalette)[] = ["cream", "paper", "ink", "muted", "olive", "footer"];
                const next = { ...content.palette };
                keys.forEach((key, index) => { next[key] = theme.values[index]; });
                update("palette", next);
              }}>
                <span className="theme-preview-swatches">
                  {theme.values.map((colour, index) => <i key={index} style={{ background: colour }} />)}
                </span>
                <strong>{theme.name}</strong>
                <span className="theme-apply-label">Apply theme</span>
              </button>
            ))}
          </div>

          <h3>Choose individual colours</h3>
          <p className="cms-hint">Tap any colour swatch. Use search to find a named colour, or use the custom picker for your own colour.</p>
          <div className="colour-library-tools">
            <input id="colour-search" type="search" placeholder="Search colours, e.g. sage, gold, navy…" onChange={(event) => {
              const value = event.target.value.toLowerCase();
              document.querySelectorAll<HTMLElement>(".colour-group").forEach((group) => {
                const cards = Array.from(group.querySelectorAll<HTMLElement>(".named-colour"));
                let visible = 0;
                cards.forEach((card) => {
                  const match = card.dataset.search?.includes(value) ?? false;
                  card.hidden = !match;
                  if (match) visible++;
                });
                group.hidden = visible === 0;
              });
            }} />
          </div>
          <div className="palette-grid">
            {paletteLabels.map(({ key, label }) => (
              <div className="palette-control" key={key}>
                <label htmlFor={`palette-${key}`}>{label}</label>
                <div className="palette-input-row">
                  <input id={`palette-${key}`} type="color"
                    value={/^#[0-9a-fA-F]{6}$/.test(content.palette[key]) ? content.palette[key] : defaultHomepageContent.palette[key]}
                    onChange={(event) => updatePalette(key, event.target.value)} />
                  <details className="advanced-colour">
                    <summary>Advanced</summary>
                    <input aria-label={`${label} hex value`} value={content.palette[key]}
                      onChange={(event) => updatePalette(key, event.target.value)} maxLength={7} />
                  </details>
                </div>
                <span className="palette-swatch" style={{ background: content.palette[key] }} />
                <strong className="selected-colour-name">
                  {colourGroups.flatMap((group) => group.colours).find((colour) => colour.hex.toLowerCase() === content.palette[key].toLowerCase())?.name ?? "Custom colour"}
                </strong>
                <div className="named-colour-grid">
                  {colourGroups.map((group) => (
                    <details className="colour-group" key={group.name}>
                      <summary>{group.name} ({group.colours.length})</summary>
                      <div className="named-colour-options">
                        {group.colours.map((colour) => (
                          <button type="button" key={colour.hex + colour.name}
                            className="named-colour" data-search={`${colour.name} ${group.name}`.toLowerCase()}
                            title={`${colour.name} ${colour.hex}`}
                            aria-label={`Set ${label} to ${colour.name}`}
                            onClick={() => updatePalette(key, colour.hex)}>
                            <i style={{ background: colour.hex }} />
                            <span>{colour.name}</span>
                          </button>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <h3>Gradient studio</h3>
          <p className="cms-hint">Preview a gradient and copy its start and end colours into the homepage palette. Gradient presets are previews and do not replace your saved solid-colour settings automatically.</p>
          <div className="gradient-preset-grid">
            {gradientPresets.map((gradient) => (
              <button type="button" className="gradient-preset" key={gradient.name}
                onClick={() => setGradientPreview(`linear-gradient(${gradient.direction}, ${gradient.start}, ${gradient.end})`)}>
                <span style={{ background: `linear-gradient(${gradient.direction}, ${gradient.start}, ${gradient.end})` }} />
                <strong>{gradient.name}</strong>
              </button>
            ))}
          </div>
          <div className="gradient-builder">
            <label>Gradient application
              <select
                value={content.homepageGradient.mode}
                onChange={(event) => update("homepageGradient", {
                  ...content.homepageGradient,
                  mode: event.target.value as HomepageGradient["mode"],
                })}
              >
                <option value="solid">Use solid colours</option>
                <option value="gradient">Use gradient</option>
              </select>
            </label>
            <label>Apply gradient to
              <select
                value={content.homepageGradient.target}
                onChange={(event) => update("homepageGradient", {
                  ...content.homepageGradient,
                  target: event.target.value as HomepageGradient["target"],
                })}
              >
                <option value="footer">Footer</option>
                <option value="cta">Final call-to-action</option>
              </select>
            </label>
            <label>Gradient start <input type="color" value={gradientStart} onChange={(event) => {
              setGradientStart(event.target.value);
              setGradientPreview(`linear-gradient(${gradientDirection}, ${event.target.value}, ${gradientEnd})`);
            }} /></label>
            <label>Gradient end <input type="color" value={gradientEnd} onChange={(event) => {
              setGradientEnd(event.target.value);
              setGradientPreview(`linear-gradient(${gradientDirection}, ${gradientStart}, ${event.target.value})`);
            }} /></label>
            <label>Direction
              <select value={gradientDirection} onChange={(event) => {
                setGradientDirection(event.target.value);
                setGradientPreview(`linear-gradient(${event.target.value}, ${gradientStart}, ${gradientEnd})`);
              }}>
                <option value="90deg">Horizontal</option><option value="180deg">Vertical</option>
                <option value="135deg">Diagonal</option><option value="to right">Left to right</option>
              </select>
            </label>
            <div className="gradient-live-preview" style={{ background: gradientPreview }}><span>Live gradient preview</span></div>
            <button type="button" className="cms-save" onClick={() => {
              updatePalette("olive", gradientStart);
              updatePalette("footer", gradientEnd);
              alert("Gradient colours copied to Olive accent and Footer background. Save changes to publish the solid colours.");
            }}>Use these colours in palette</button>
          </div>
        </div>
        <p className="cms-hint">Your solid colour selections update the homepage palette. Remember to save your changes.</p>
      </Section>

      <div className="cms-bottom-save">
        <div>
          <strong>Ready to publish your edits?</strong>
          <span>Save your changes before leaving the editor.</span>
        </div>
        <button type="button" className="cms-save" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="spin" size={17} /> : <Save size={17} />}
          {saving ? "Saving..." : saved ? "Saved" : "Save changes"}
        </button>
      </div>
    </main>
  );
}
