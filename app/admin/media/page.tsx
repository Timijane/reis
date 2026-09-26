"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  ImagePlus,
  Link2,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  deleteMediaAsset,
  getMediaAssets,
  saveMediaAsset,
  type MediaAsset,
} from "@/lib/cms/media";
import {
  getHomepageContent,
  type HomepageContent,
} from "@/lib/cms/homepage";
import { watchAdminAuth, type AdminUser } from "@/lib/admin/auth";
import "./media.css";

declare global {
  interface Window {
    cloudinary?: {
      createUploadWidget: (
        options: Record<string, unknown>,
        callback: (error: unknown, result: any) => void
      ) => {
        open: () => void;
      };
    };
  }
}

const CLOUD_NAME = "dmbjrohtn";
const UPLOAD_PRESET = "pelumi";

const ASSIGNMENT_SLOTS = [
  { id: "logoUrl", label: "Global Logo" },
  { id: "heroImage", label: "Landing Page — Hero" },
  { id: "rental1Image", label: "Landing Page — Rental 01" },
  { id: "rental2Image", label: "Landing Page — Rental 02" },
  { id: "rental3Image", label: "Landing Page — Rental 03" },
  { id: "rental4Image", label: "Landing Page — Rental 04" },
  { id: "rental5Image", label: "Landing Page — Rental 05" },
  { id: "rental6Image", label: "Landing Page — Rental 06" },
  { id: "gallery1Image", label: "Landing Page — Gallery 01" },
  { id: "gallery2Image", label: "Landing Page — Gallery 02" },
  { id: "gallery3Image", label: "Landing Page — Gallery 03" },
  { id: "gallery4Image", label: "Landing Page — Gallery 04" },
  { id: "gallery5Image", label: "Landing Page — Gallery 05" },
  { id: "aboutImage", label: "Landing Page — About" },
] as const;

type AssignmentSlot = (typeof ASSIGNMENT_SLOTS)[number]["id"];

function getAssignments(
  asset: MediaAsset,
  homepage: HomepageContent | null
): string[] {
  if (!homepage) return [];

  const assignments: string[] = [];

  const globalLogoLocations = [
    "Landing Page — Header Logo",
    "Landing Page — Footer Logo",
    "Admin Login — Logo",
    "Admin Forgot Password — Logo",
  ];

  for (const slot of ASSIGNMENT_SLOTS) {
    const value = homepage[slot.id as keyof HomepageContent];

    if (typeof value === "string" && value === asset.secureUrl) {
      if (slot.id === "logoUrl") {
        assignments.push(...globalLogoLocations);
      } else {
        assignments.push(slot.label);
      }
    }
  }

  return [...new Set(assignments)];
}

export default function MediaPage() {
  const router = useRouter();

  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [homepage, setHomepage] = useState<HomepageContent | null>(null);

  const [preview, setPreview] = useState<MediaAsset | null>(null);
  const [assigning, setAssigning] = useState<MediaAsset | null>(null);
  const [assignedView, setAssignedView] = useState<MediaAsset | null>(null);

  const [assignmentSlot, setAssignmentSlot] =
    useState<AssignmentSlot>("heroImage");
  const [url, setUrl] = useState("");
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function loadData() {
    try {
      const [media, content] = await Promise.all([
        getMediaAssets(),
        getHomepageContent(),
      ]);

      setAssets(media);
      setHomepage(content);
    } catch (error) {
      console.error("Failed to load media:", error);
    }
  }

  useEffect(() => {
    const unsubscribe = watchAdminAuth((_, currentAdmin, authLoading) => {
      if (authLoading) return;

      if (!currentAdmin) {
        router.replace("/admin/login");
        return;
      }

      setAdmin(currentAdmin);
      setLoading(false);
      loadData();
    });

    return unsubscribe;
  }, [router]);

  function openUploader() {
    if (!window.cloudinary || !admin) return;

    setUploading(true);

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: CLOUD_NAME,
        uploadPreset: UPLOAD_PRESET,
        multiple: true,
        maxFileSize: 10000000,
        clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
        sources: ["local", "camera"],
        folder: "reis-event-services",
      },
      async (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          setUploading(false);
          return;
        }

        if (result?.event === "success") {
          const info = result.info;

          const asset: MediaAsset = {
            id:
              info.asset_id ||
              info.public_id.replace(/[^a-zA-Z0-9_-]/g, "_"),
            publicId: info.public_id,
            secureUrl: info.secure_url,
            originalFilename:
              info.original_filename || "REIS image",
            format: info.format || "",
            width: info.width,
            height: info.height,
            bytes: info.bytes,
            resourceType: info.resource_type || "image",
          };

          try {
            await saveMediaAsset(asset, admin.uid);
            await loadData();
          } catch (saveError) {
            console.error("Could not save media record:", saveError);
          }
        }

        if (result?.event === "close") {
          setUploading(false);
        }
      }
    );

    widget.open();
  }

  function openAssign(asset: MediaAsset) {
    setAssigning(asset);
    setUrl(asset.secureUrl);
    setAssignmentSlot("heroImage");
  }

  async function assignImage() {
    if (!assigning) return;

    const imageUrl = url.trim() || assigning.secureUrl;

    if (!imageUrl) {
      alert("Please provide an image URL.");
      return;
    }

    setSavingAssignment(true);

    try {
      const current = await getHomepageContent();

      const updated = {
        ...current,
        [assignmentSlot]: imageUrl,
      };

      const { saveHomepageContent } = await import("@/lib/cms/homepage");

      await saveHomepageContent(updated);

      setHomepage(updated);
      setAssigning(null);
      setUrl("");

      alert(
        `${ASSIGNMENT_SLOTS.find(
          (slot) => slot.id === assignmentSlot
        )?.label} assigned successfully.`
      );
    } catch (error) {
      console.error("Assignment failed:", error);
      alert("Could not assign this image.");
    } finally {
      setSavingAssignment(false);
    }
  }

  async function removeAsset(asset: MediaAsset) {
    const confirmed = window.confirm(
      "Remove this image from the REIS Media Library?"
    );

    if (!confirmed) return;

    try {
      await deleteMediaAsset(asset.id);
      setAssets((current) =>
        current.filter((item) => item.id !== asset.id)
      );
      setPreview(null);
      setAssignedView(null);
    } catch (error) {
      console.error(error);
      alert("The image could not be removed.");
    }
  }

  if (loading) {
    return (
      <main className="media-loading">
        <Loader2 className="spin" size={22} />
        Loading media library...
      </main>
    );
  }

  return (
    <>
      <Script
        src="https://upload-widget.cloudinary.com/global/all.js"
        strategy="afterInteractive"
      />

      <main className="media-page">
        <header className="media-header">
          <div>
            <button
              className="back-button"
              onClick={() => router.push("/admin")}
            >
              <ArrowLeft size={16} />
              Dashboard
            </button>

            <div className="media-eyebrow">
              REIS EVENT SERVICES · MEDIA
            </div>

            <h1>Media Library</h1>

            <p>
              Upload, assign and manage every image used across REIS.
            </p>
          </div>

          <button
            className="upload-button"
            onClick={openUploader}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="spin" size={18} />
            ) : (
              <ImagePlus size={18} />
            )}
            {uploading ? "Uploading..." : "Upload media"}
          </button>
        </header>

        {assets.length === 0 ? (
          <section className="empty-media">
            <ImagePlus size={36} strokeWidth={1.2} />
            <h2>Your media library is empty.</h2>
            <p>Upload your first REIS image.</p>
            <button onClick={openUploader}>
              Upload first image
            </button>
          </section>
        ) : (
          <section className="media-grid">
            {assets.map((asset) => {
              const assignments = getAssignments(asset, homepage);

              return (
                <article className="media-card" key={asset.id}>
                  <div className="media-image">
                    <img
                      src={asset.secureUrl}
                      alt={asset.originalFilename}
                    />
                  </div>

                  <div className="media-card-info">
                    <strong>{asset.originalFilename}</strong>

                    <span>
                      {asset.width && asset.height
                        ? `${asset.width} × ${asset.height}`
                        : asset.format.toUpperCase()}
                    </span>

                    <div className="media-card-actions">
                      <button
                        className="media-action"
                        onClick={() => setPreview(asset)}
                      >
                        Preview
                      </button>

                      <button
                        className="media-action primary"
                        onClick={() => openAssign(asset)}
                      >
                        <Plus size={14} />
                        Assign
                      </button>

                      <button
                        className={
                          assignments.length
                            ? "media-action assigned active"
                            : "media-action assigned"
                        }
                        onClick={() => setAssignedView(asset)}
                      >
                        <Check size={14} />
                        Assigned
                        {assignments.length > 0 && (
                          <small>{assignments.length}</small>
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {preview && (
          <div
            className="media-overlay"
            onClick={() => setPreview(null)}
          >
            <div
              className="media-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                className="modal-close"
                onClick={() => setPreview(null)}
              >
                <X size={20} />
              </button>

              <img
                src={preview.secureUrl}
                alt={preview.originalFilename}
              />

              <div className="modal-details">
                <span>MEDIA ASSET</span>
                <h2>{preview.originalFilename}</h2>

                <p>
                  {preview.width && preview.height
                    ? `${preview.width} × ${preview.height}`
                    : ""}
                  {preview.format
                    ? ` • ${preview.format.toUpperCase()}`
                    : ""}
                </p>

                <button
                  className="delete-button"
                  onClick={() => removeAsset(preview)}
                >
                  <Trash2 size={16} />
                  Remove from library
                </button>
              </div>
            </div>
          </div>
        )}

        {assignedView && (
          <div
            className="media-overlay"
            onClick={() => setAssignedView(null)}
          >
            <div
              className="media-assigned-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                className="modal-close"
                onClick={() => setAssignedView(null)}
              >
                <X size={20} />
              </button>

              <div className="assigned-modal-heading">
                <Check size={20} />
                <div>
                  <span>IMAGE ASSIGNMENTS</span>
                  <h2>{assignedView.originalFilename}</h2>
                </div>
              </div>

              {getAssignments(assignedView, homepage).length > 0 ? (
                <div className="assignment-list">
                  {getAssignments(assignedView, homepage).map(
                    (location) => (
                      <div
                        className="assignment-row"
                        key={location}
                      >
                        <Check size={16} />
                        <span>{location}</span>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="no-assignments">
                  <span>NOT ASSIGNED</span>
                  <p>
                    This image is currently not assigned to a
                    website location.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {assigning && (
          <div
            className="media-overlay"
            onClick={() => setAssigning(null)}
          >
            <div
              className="media-assignment-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                className="modal-close"
                onClick={() => setAssigning(null)}
              >
                <X size={20} />
              </button>

              <div className="assignment-modal-image">
                <img
                  src={assigning.secureUrl}
                  alt={assigning.originalFilename}
                />
              </div>

              <div className="assignment-modal-content">
                <span className="modal-eyebrow">
                  ASSIGN MEDIA
                </span>

                <h2>Where should this image appear?</h2>

                <p>{assigning.originalFilename}</p>

                <label>
                  Website location
                  <select
                    value={assignmentSlot}
                    onChange={(event) =>
                      setAssignmentSlot(
                        event.target.value as AssignmentSlot
                      )
                    }
                  >
                    {ASSIGNMENT_SLOTS.map((slot) => (
                      <option value={slot.id} key={slot.id}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Image URL
                  <div className="url-input">
                    <Link2 size={16} />
                    <input
                      value={url}
                      onChange={(event) =>
                        setUrl(event.target.value)
                      }
                      placeholder="https://..."
                    />
                  </div>
                </label>

                <p className="assignment-note">
                  You can use the uploaded Media Library image or
                  replace it with any valid image URL.
                </p>

                <button
                  className="save-assignment"
                  onClick={assignImage}
                  disabled={savingAssignment}
                >
                  {savingAssignment ? (
                    <Loader2 className="spin" size={17} />
                  ) : (
                    <Check size={17} />
                  )}
                  {savingAssignment
                    ? "Assigning..."
                    : "Assign image"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
