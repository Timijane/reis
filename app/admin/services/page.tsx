"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Eye,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { watchAdminAuth, type AdminUser } from "@/lib/admin/auth";
import { auth } from "@/lib/firebase";
import "./services.css";
import "./portfolio.css";

type PortfolioImage = {
  url: string;
  publicId: string;
  bytes: number;
  format: string;
  width?: number;
  height?: number;
};

type PortfolioProject = {
  id: string;
  title: string;
  description: string;
  category: string;
  images: PortfolioImage[];
  status: "draft" | "published";
  createdAt: string | null;
  updatedAt: string | null;
  publishedAt: string | null;
};

type CloudinaryInfo = {
  secure_url?: string;
  public_id?: string;
  bytes?: number;
  format?: string;
  width?: number;
  height?: number;
};

type CloudinaryWidgetResult = {
  event?: string;
  info?: CloudinaryInfo;
};

type CloudinaryWidget = {
  open: () => void;
  close: () => void;
  destroy: () => void;
};

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

const MAX_TOTAL_BYTES = 15 * 1024 * 1024;
const MAX_IMAGE_COUNT = 10;
const MIN_IMAGE_COUNT = 2;
const CLOUD_NAME = "dmbjrohtn";
const UPLOAD_PRESET = "pelumi";

const EMPTY_FORM = {
  title: "",
  description: "",
  category: "Event Styling",
  status: "draft" as "draft" | "published",
};

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(value: string | null) {
  if (!value) return "Not yet published";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function loadCloudinary(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Uploads require a browser."));
  }

  if (window.cloudinary) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.getElementById(
      "reis-cloudinary-upload-widget"
    ) as HTMLScriptElement | null;

    const script = existing ?? document.createElement("script");

    const onLoad = () => {
      if (window.cloudinary) {
        script.dataset.loaded = "true";
        resolve();
      } else {
        reject(new Error("Cloudinary uploader did not initialize."));
      }
    };

    const onError = () =>
      reject(new Error("Could not load Cloudinary. Check your connection."));

    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });

    if (!existing) {
      script.id = "reis-cloudinary-upload-widget";
      script.src = "https://upload-widget.cloudinary.com/global/all.js";
      script.async = true;
      document.head.appendChild(script);
    }
  });
}

export default function ServicesPortfolioPage() {
  const router = useRouter();

  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [images, setImages] = useState<PortfolioImage[]>([]);
  const [filter, setFilter] = useState<"all" | "draft" | "published">("all");

  const getToken = useCallback(async () => {
    const user = auth.currentUser;

    if (!user) throw new Error("Your session has expired. Please sign in again.");

    return user.getIdToken();
  }, []);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = await getToken();
      const response = await fetch("/api/admin/service-portfolio", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load portfolio projects.");
      }

      setProjects(Array.isArray(result.projects) ? result.projects : []);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not load projects."
      );
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    const unsubscribe = watchAdminAuth((_, currentAdmin, loadingState) => {
      if (loadingState) return;

      setAuthLoading(false);

      if (!currentAdmin) {
        router.replace("/admin/login");
        return;
      }

      setAdmin(currentAdmin);
      void loadProjects();
    });

    return () => unsubscribe();
  }, [router, loadProjects]);

  function openNewProject() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImages([]);
    setMessage("");
    setError("");
    setEditorOpen(true);
  }

  function openEditProject(project: PortfolioProject) {
    setEditingId(project.id);
    setForm({
      title: project.title,
      description: project.description,
      category: project.category,
      status: project.status,
    });
    setImages(project.images);
    setMessage("");
    setError("");
    setEditorOpen(true);
  }

  async function uploadImages() {
    if (uploading || images.length >= MAX_IMAGE_COUNT) return;

    setUploading(true);
    setError("");
    setMessage("");

    try {
      await loadCloudinary();

      if (!window.cloudinary) {
        throw new Error("Cloudinary uploader is unavailable.");
      }

      const remainingCount = MAX_IMAGE_COUNT - images.length;
      const remainingBytes =
        MAX_TOTAL_BYTES - images.reduce((sum, image) => sum + image.bytes, 0);

      if (remainingBytes <= 0) {
        throw new Error("The 15 MB combined image limit has been reached.");
      }

      const widget = window.cloudinary.createUploadWidget(
        {
          cloudName: CLOUD_NAME,
          uploadPreset: UPLOAD_PRESET,
          folder: "reis/service-portfolio",
          sources: ["local", "camera"],
          multiple: true,
          maxFiles: remainingCount,
          maxFileSize: remainingBytes,
          maxImageFileSize: remainingBytes,
          clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
          resourceType: "image",
          cropping: false,
          showAdvancedOptions: false,
          singleUploadAutoClose: false,
        },
        (uploadError, result) => {
          if (uploadError) {
            setError("An image upload failed. Please try again.");
            setUploading(false);
            return;
          }

          if (result?.event === "success" && result.info) {
            const info = result.info;
            const url = info.secure_url || "";
            const publicId = info.public_id || "";
            const format = (info.format || "").toLowerCase();
            const bytes = info.bytes || 0;

            if (
              !url.startsWith("https://res.cloudinary.com/") ||
              !publicId ||
              !["jpg", "jpeg", "png", "webp"].includes(format) ||
              !Number.isSafeInteger(bytes) ||
              bytes <= 0
            ) {
              setError("Cloudinary returned invalid image information.");
              return;
            }

            setImages((current) => {
              const currentBytes = current.reduce(
                (sum, image) => sum + image.bytes,
                0
              );

              if (
                current.length >= MAX_IMAGE_COUNT ||
                currentBytes + bytes > MAX_TOTAL_BYTES
              ) {
                setError("This upload exceeds the image count or 15 MB limit.");
                return current;
              }

              setMessage("Image uploaded. Save the project to keep the assignment.");
              return [
                ...current,
                {
                  url,
                  publicId,
                  bytes,
                  format,
                  ...(info.width ? { width: info.width } : {}),
                  ...(info.height ? { height: info.height } : {}),
                },
              ];
            });
          }

          if (result?.event === "close") {
            setUploading(false);
          }
        }
      );

      widget.open();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not upload images."
      );
      setUploading(false);
    }
  }

  function removeImage(index: number) {
    setImages((current) => current.filter((_, imageIndex) => imageIndex !== index));
    setMessage("");
  }

  async function saveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    const descriptionWordCount = form.description.trim()
      ? form.description.trim().split(/\s+/).length
      : 0;

    if (descriptionWordCount > 2000) {
      setError("The project description cannot exceed 2,000 words.");
      return;
    }

    if (images.length < MIN_IMAGE_COUNT || images.length > MAX_IMAGE_COUNT) {
      setError("Each portfolio design needs between 2 and 10 images.");
      return;
    }

    const totalBytes = images.reduce((sum, image) => sum + image.bytes, 0);

    if (totalBytes > MAX_TOTAL_BYTES) {
      setError("The combined image size cannot exceed 15 MB.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const token = await getToken();
      const response = await fetch("/api/admin/service-portfolio", {
        method: editingId ? "PATCH" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(editingId ? { id: editingId } : {}),
          title: form.title,
          description: form.description,
          category: form.category,
          images,
          status: form.status,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not save the project.");
      }

      setMessage(editingId ? "Project updated successfully." : "Project created successfully.");
      setEditorOpen(false);
      await loadProjects();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not save the project."
      );
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(project: PortfolioProject) {
    const status = project.status === "published" ? "draft" : "published";

    if (
      status === "draft" &&
      !window.confirm(`Unpublish "${project.title}"?`)
    ) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const token = await getToken();
      const response = await fetch("/api/admin/service-portfolio", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: project.id, status }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not update publishing status.");
      }

      setMessage(
        status === "published" ? "Project published." : "Project unpublished."
      );
      await loadProjects();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not update status."
      );
    }
  }

  async function deleteProject(project: PortfolioProject) {
    if (!window.confirm(`Delete "${project.title}" permanently?`)) return;

    setError("");
    setMessage("");

    try {
      const token = await getToken();
      const response = await fetch("/api/admin/service-portfolio", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: project.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not delete the project.");
      }

      setMessage("Project deleted.");
      await loadProjects();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not delete project."
      );
    }
  }

  const visibleProjects = projects.filter(
    (project) => filter === "all" || project.status === filter
  );

  if (authLoading || loading) {
    return (
      <main className="portfolio-loading">
        <Loader2 size={22} className="portfolio-spin" />
        <span>Loading REIS portfolio…</span>
      </main>
    );
  }

  if (!admin) return null;

  return (
    <main className="portfolio-admin">
      <header className="portfolio-header">
        <div>
          <Link href="/admin" className="portfolio-back">
            <ArrowLeft size={16} /> Admin dashboard
          </Link>
          <p className="portfolio-eyebrow">REIS EVENT SERVICES · CREATIVE WORK</p>
          <h1>Styling portfolio</h1>
          <p className="portfolio-intro">
            Curate the event designs and styling projects clients can explore.
          </p>
        </div>

        <div className="portfolio-header-actions">
          <Link href="/admin/services/content" className="portfolio-secondary">
            Edit homepage Services
          </Link>
          <button
            type="button"
            className="portfolio-primary"
            onClick={openNewProject}
          >
            <Plus size={17} /> New design
          </button>
        </div>
      </header>

      <section className="portfolio-stats" aria-label="Portfolio summary">
        <article>
          <span>Total designs</span>
          <strong>{projects.length}</strong>
        </article>
        <article>
          <span>Published</span>
          <strong>{projects.filter((item) => item.status === "published").length}</strong>
        </article>
        <article>
          <span>Drafts</span>
          <strong>{projects.filter((item) => item.status === "draft").length}</strong>
        </article>
      </section>

      {message && <div className="portfolio-notice success">{message}</div>}
      {error && <div className="portfolio-notice error">{error}</div>}

      <section className="portfolio-library">
        <div className="portfolio-library-heading">
          <div>
            <p className="portfolio-eyebrow">THE COLLECTION</p>
            <h2>Design library</h2>
          </div>

          <div className="portfolio-filters" aria-label="Filter designs">
            {(["all", "published", "draft"] as const).map((item) => (
              <button
                type="button"
                key={item}
                className={filter === item ? "active" : ""}
                onClick={() => setFilter(item)}
              >
                {item === "all"
                  ? "All designs"
                  : item === "published"
                    ? "Published"
                    : "Drafts"}
              </button>
            ))}
          </div>
        </div>

        {visibleProjects.length === 0 ? (
          <div className="portfolio-empty">
            <ImagePlus size={32} strokeWidth={1.3} />
            <h3>{filter === "all" ? "Your collection starts here" : `No ${filter} designs`}</h3>
            <p>
              {filter === "all"
                ? "Add your first styling project to begin building the REIS portfolio."
                : "Projects with this status will appear here."}
            </p>
            {filter === "all" && (
              <button
                type="button"
                className="portfolio-primary"
                onClick={openNewProject}
              >
                <Plus size={16} /> Add your first design
              </button>
            )}
          </div>
        ) : (
          <div className="portfolio-grid">
            {visibleProjects.map((project) => (
              <article className="portfolio-card" key={project.id}>
                <div className="portfolio-card-image">
                  {project.images[0]?.url ? (
                    <img src={project.images[0].url} alt={project.title} />
                  ) : (
                    <ImagePlus size={28} />
                  )}
                  <span className={`portfolio-status ${project.status}`}>
                    {project.status}
                  </span>
                  <span className="portfolio-image-count">
                    {project.images.length} images
                  </span>
                </div>

                <div className="portfolio-card-body">
                  <p className="portfolio-card-category">{project.category}</p>
                  <h3>{project.title}</h3>
                  <p className="portfolio-card-description">{project.description}</p>
                  <p className="portfolio-card-date">
                    Updated {formatDate(project.updatedAt)}
                  </p>

                  <div className="portfolio-card-actions">
                    <button
                      type="button"
                      onClick={() => openEditProject(project)}
                    >
                      <Pencil size={15} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void changeStatus(project)}
                    >
                      {project.status === "published" ? (
                        <><Eye size={15} /> Unpublish</>
                      ) : (
                        <><Check size={15} /> Publish</>
                      )}
                    </button>
                    <button
                      type="button"
                      className="portfolio-delete"
                      onClick={() => void deleteProject(project)}
                      aria-label={`Delete ${project.title}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {editorOpen && (
        <div
          className="portfolio-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving && !uploading) {
              setEditorOpen(false);
            }
          }}
        >
          <section
            className="portfolio-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="portfolio-editor-title"
          >
            <header className="portfolio-modal-header">
              <div>
                <p className="portfolio-eyebrow">
                  {editingId ? "REFINE THE COLLECTION" : "ADD TO THE COLLECTION"}
                </p>
                <h2 id="portfolio-editor-title">
                  {editingId ? "Edit design" : "New styling design"}
                </h2>
              </div>
              <button
                type="button"
                className="portfolio-close"
                aria-label="Close editor"
                disabled={saving || uploading}
                onClick={() => setEditorOpen(false)}
              >
                <X size={20} />
              </button>
            </header>

            <form onSubmit={saveProject} className="portfolio-form">
              <label className="portfolio-field">
                <span>Project title *</span>
                <input
                  required
                  maxLength={120}
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder="e.g. An intimate garden celebration"
                />
              </label>

              <label className="portfolio-field">
                <span>Description *</span>
                <textarea
                  required
                  maxLength={20000}
                  rows={4}
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Describe the completed event, styling choices and details (maximum 2,000 words)…"
                />
                <span className="portfolio-description-count" aria-live="polite">
                  {form.description.trim()
                    ? form.description.trim().split(/\s+/).length
                    : 0} / 2,000 words
                </span>
              </label>

              <div className="portfolio-form-row">
                <label className="portfolio-field">
                  <span>Category *</span>
                  <select
                    value={form.category}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        category: event.target.value,
                      }))
                    }
                  >
                    <option>Event Styling</option>
                    <option>Weddings</option>
                    <option>Birthdays</option>
                    <option>Corporate Events</option>
                    <option>Baby Showers</option>
                    <option>Table Styling</option>
                    <option>Marquee Styling</option>
                    <option>Custom Designs</option>
                    <option>Other Celebrations</option>
                  </select>
                </label>

                <label className="portfolio-field">
                  <span>Publishing status</span>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        status: event.target.value as "draft" | "published",
                      }))
                    }
                  >
                    <option value="draft">Save as draft</option>
                    <option value="published">Publish design</option>
                  </select>
                </label>
              </div>

              <div className="portfolio-images-heading">
                <div>
                  <h3>Project photography</h3>
                  <p>2–10 images · 15 MB combined maximum · JPG, PNG or WebP</p>
                </div>
                <span>
                  {images.length}/{MAX_IMAGE_COUNT}
                </span>
              </div>

              <div className="portfolio-image-grid">
                {images.map((image, index) => (
                  <div className="portfolio-image-tile" key={`${image.publicId}-${index}`}>
                    <img src={image.url} alt={`Project image ${index + 1}`} />
                    <span>{formatBytes(image.bytes)}</span>
                    <button
                      type="button"
                      aria-label={`Remove image ${index + 1}`}
                      onClick={() => removeImage(index)}
                      disabled={saving || uploading}
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}

                {images.length < MAX_IMAGE_COUNT && (
                  <button
                    type="button"
                    className="portfolio-upload-tile"
                    onClick={() => void uploadImages()}
                    disabled={uploading || saving}
                  >
                    {uploading ? (
                      <Loader2 size={23} className="portfolio-spin" />
                    ) : (
                      <Upload size={23} />
                    )}
                    <span>{uploading ? "Uploading…" : "Add images"}</span>
                  </button>
                )}
              </div>

              <div className="portfolio-image-total">
                Combined image size:{" "}
                <strong>
                  {formatBytes(images.reduce((sum, image) => sum + image.bytes, 0))}
                </strong>{" "}
                / 15 MB
              </div>

              {message && <div className="portfolio-notice success">{message}</div>}
              {error && <div className="portfolio-notice error">{error}</div>}

              <footer className="portfolio-form-footer">
                <button
                  type="button"
                  className="portfolio-secondary"
                  disabled={saving || uploading}
                  onClick={() => setEditorOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="portfolio-primary"
                  disabled={saving || uploading}
                >
                  {saving ? (
                    <><Loader2 size={16} className="portfolio-spin" /> Saving…</>
                  ) : (
                    <><Save size={16} /> {editingId ? "Save changes" : "Save design"}</>
                  )}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
