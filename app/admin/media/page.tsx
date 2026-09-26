"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  assignHomepageImage,
  deleteMediaAsset,
  getMediaAssets,
  saveMediaAsset,
  type MediaAsset,
} from "@/lib/cms/media";
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

const SLOTS = [
  ["logoUrl", "Brand Logo"],
  ["gallery1Image", "Hero Image"],
  ["rental1Image", "Rental 01"],
  ["rental2Image", "Rental 02"],
  ["rental3Image", "Rental 03"],
  ["rental4Image", "Rental 04"],
  ["rental5Image", "Rental 05"],
  ["rental6Image", "Rental 06"],
  ["gallery2Image", "Gallery 02"],
  ["gallery3Image", "Gallery 03"],
  ["gallery4Image", "Gallery 04"],
  ["gallery5Image", "Gallery 05"],
  ["aboutImage", "About Image"],
] as const;

type Slot = (typeof SLOTS)[number][0];

export default function MediaPage() {
  const router = useRouter();

  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [selected, setSelected] = useState<MediaAsset | null>(null);
  const [slot, setSlot] = useState<Slot>("gallery1Image");
  const [assigning, setAssigning] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function loadMedia() {
    try {
      setAssets(await getMediaAssets());
    } catch (error) {
      console.error(error);
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
      loadMedia();
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
            originalFilename: info.original_filename || "REIS image",
            format: info.format || "",
            width: info.width,
            height: info.height,
            bytes: info.bytes,
            resourceType: info.resource_type || "image",
          };

          try {
            await saveMediaAsset(asset, admin.uid);
            await loadMedia();
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

  async function assignSelected() {
    if (!selected) return;

    setAssigning(true);

    try {
      await assignHomepageImage(slot, selected.secureUrl);
      alert(
        `${SLOTS.find(([id]) => id === slot)?.[1]} updated successfully.`
      );
    } catch (error) {
      console.error(error);
      alert("Could not assign this image.");
    } finally {
      setAssigning(false);
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
      setSelected(null);
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
              Upload images and assign them directly to your website.
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

        <section className="media-assignment">
          <div>
            <span className="assignment-label">IMAGE SLOT</span>

            <select
              value={slot}
              onChange={(e) => setSlot(e.target.value as Slot)}
            >
              {SLOTS.map(([id, label]) => (
                <option value={id} key={id}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="assignment-help">
            {selected ? (
              <>
                <span>
                  Selected: <strong>{selected.originalFilename}</strong>
                </span>

                <button
                  className="assign-button"
                  onClick={assignSelected}
                  disabled={assigning}
                >
                  {assigning ? (
                    <Loader2 className="spin" size={16} />
                  ) : (
                    <Check size={16} />
                  )}
                  {assigning ? "Assigning..." : "Use for this slot"}
                </button>
              </>
            ) : (
              <span>Select an image below, then assign it to a slot.</span>
            )}
          </div>
        </section>

        {assets.length === 0 ? (
          <section className="empty-media">
            <ImagePlus size={36} strokeWidth={1.2} />
            <h2>Your media library is empty.</h2>
            <p>Upload your first REIS image.</p>
            <button onClick={openUploader}>Upload first image</button>
          </section>
        ) : (
          <section className="media-grid">
            {assets.map((asset) => (
              <article
                className={
                  selected?.id === asset.id
                    ? "media-card selected"
                    : "media-card"
                }
                key={asset.id}
                onClick={() => setSelected(asset)}
              >
                <div className="media-image">
                  <img
                    src={asset.secureUrl}
                    alt={asset.originalFilename}
                  />

                  {selected?.id === asset.id && (
                    <div className="selected-badge">
                      <Check size={15} />
                      Selected
                    </div>
                  )}
                </div>

                <div className="media-card-info">
                  <strong>{asset.originalFilename}</strong>
                  <span>
                    {asset.width && asset.height
                      ? `${asset.width} × ${asset.height}`
                      : asset.format.toUpperCase()}
                  </span>
                </div>
              </article>
            ))}
          </section>
        )}

        {selected && (
          <div
            className="media-overlay"
            onClick={() => setSelected(null)}
          >
            <div
              className="media-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                className="modal-close"
                onClick={() => setSelected(null)}
              >
                <X size={20} />
              </button>

              <img
                src={selected.secureUrl}
                alt={selected.originalFilename}
              />

              <div className="modal-details">
                <span>MEDIA ASSET</span>
                <h2>{selected.originalFilename}</h2>

                <p>
                  {selected.width && selected.height
                    ? `${selected.width} × ${selected.height}`
                    : ""}
                  {selected.format
                    ? ` • ${selected.format.toUpperCase()}`
                    : ""}
                </p>

                <button
                  className="delete-button"
                  onClick={() => removeAsset(selected)}
                >
                  <Trash2 size={16} />
                  Remove from library
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
