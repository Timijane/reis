"use client";

import Script from "next/script";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ImagePlus,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  getHomepageContent,
  saveHomepageContent,
  defaultHomepageContent,
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

const IMAGE_SLOTS = [
  { id: "logoUrl", label: "Global Logo", group: "Brand" },
  { id: "heroImage", label: "Hero Section", group: "Homepage" },

  { id: "rental1Image", label: "Rental 01", group: "Rentals" },
  { id: "rental2Image", label: "Rental 02", group: "Rentals" },
  { id: "rental3Image", label: "Rental 03", group: "Rentals" },
  { id: "rental4Image", label: "Rental 04", group: "Rentals" },
  { id: "rental5Image", label: "Rental 05", group: "Rentals" },
  { id: "rental6Image", label: "Rental 06", group: "Rentals" },

  { id: "gallery1Image", label: "Gallery 01", group: "Gallery" },
  { id: "gallery2Image", label: "Gallery 02", group: "Gallery" },
  { id: "gallery3Image", label: "Gallery 03", group: "Gallery" },
  { id: "gallery4Image", label: "Gallery 04", group: "Gallery" },
  { id: "gallery5Image", label: "Gallery 05", group: "Gallery" },

  { id: "aboutImage", label: "About", group: "About" },
] as const;

type ImageSlotId = (typeof IMAGE_SLOTS)[number]["id"];

type SlotStatus = "default" | "assigned" | "unassigned";

function getStatus(
  slot: ImageSlotId,
  homepage: HomepageContent
): SlotStatus {
  const current = homepage[slot];

  if (typeof current !== "string" || !current.trim()) {
    return "unassigned";
  }

  const defaultValue = defaultHomepageContent[slot];

  if (current === defaultValue) {
    return "default";
  }

  return "assigned";
}

function getSlotValue(
  slot: ImageSlotId,
  homepage: HomepageContent
) {
  const value = homepage[slot];
  return typeof value === "string" ? value : "";
}

function getFilename(url: string, label: string) {
  if (!url) return label;

  try {
    const pathname = new URL(url).pathname;
    const filename = pathname.split("/").pop();

    if (filename) {
      return decodeURIComponent(filename);
    }
  } catch {
    // Fall back to the slot name.
  }

  return label;
}

export default function MediaPage() {
  const router = useRouter();

  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [homepage, setHomepage] =
    useState<HomepageContent>(defaultHomepageContent);

  const [selectedSlot, setSelectedSlot] =
    useState<ImageSlotId>("logoUrl");

  const [uploadedUrl, setUploadedUrl] = useState("");
  const [uploadedFilename, setUploadedFilename] = useState("");
  const [uploading, setUploading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const [uploadModalOpen, setUploadModalOpen] =
    useState(false);

  const selectedDefinition = useMemo(
    () =>
      IMAGE_SLOTS.find(
        (slot) => slot.id === selectedSlot
      ) || IMAGE_SLOTS[0],
    [selectedSlot]
  );

  const selectedUrl = getSlotValue(
    selectedSlot,
    homepage
  );

  const selectedStatus = getStatus(
    selectedSlot,
    homepage
  );

  async function loadHomepage() {
    try {
      const content = await getHomepageContent();
      setHomepage(content);
    } catch (error) {
      console.error(
        "Failed to load homepage media:",
        error
      );
    }
  }

  useEffect(() => {
    const unsubscribe = watchAdminAuth(
      (_, currentAdmin, authLoading) => {
        if (authLoading) return;

        if (!currentAdmin) {
          router.replace("/admin/login");
          return;
        }

        setAdmin(currentAdmin);
        setLoading(false);
        loadHomepage();
      }
    );

    return unsubscribe;
  }, [router]);

  function openUploader() {
    if (!window.cloudinary || !admin) {
      alert(
        "The image uploader is still loading. Please try again."
      );
      return;
    }

    setUploading(true);

    const widget =
      window.cloudinary.createUploadWidget(
        {
          cloudName: CLOUD_NAME,
          uploadPreset: UPLOAD_PRESET,
          multiple: false,
          maxFileSize: 10000000,
          clientAllowedFormats: [
            "jpg",
            "jpeg",
            "png",
            "webp",
          ],
          sources: ["local", "camera"],
          folder: "reis-event-services",
        },
        (error, result) => {
          if (error) {
            console.error(
              "Cloudinary upload error:",
              error
            );
            setUploading(false);
            return;
          }

          if (result?.event === "success") {
            const info = result.info;

            setUploadedUrl(
              info.secure_url || ""
            );

            setUploadedFilename(
              info.original_filename ||
                selectedDefinition.label
            );

            setUploadModalOpen(false);
            setUploading(false);
          }

          if (result?.event === "close") {
            setUploading(false);
          }
        }
      );

    widget.open();
  }

  async function assignUploadedImage() {
    if (!uploadedUrl) {
      alert("Upload an image first.");
      return;
    }

    setAssigning(true);

    try {
      const updated = {
        ...homepage,
        [selectedSlot]: uploadedUrl,
      };

      await saveHomepageContent(updated);

      setHomepage(updated);
      setUploadedUrl("");
      setUploadedFilename("");

      alert(
        `${selectedDefinition.label} has been assigned successfully.`
      );
    } catch (error) {
      console.error(
        "Could not assign image:",
        error
      );

      alert(
        "The image was uploaded, but the assignment could not be saved."
      );
    } finally {
      setAssigning(false);
    }
  }

  async function resetToDefault() {
    const defaultValue =
      defaultHomepageContent[selectedSlot];

    if (!defaultValue) {
      const updated = {
        ...homepage,
        [selectedSlot]: "",
      };

      await saveHomepageContent(updated);
      setHomepage(updated);
      return;
    }

    const confirmed = window.confirm(
      `Restore ${selectedDefinition.label} to its default image?`
    );

    if (!confirmed) return;

    try {
      const updated = {
        ...homepage,
        [selectedSlot]: defaultValue,
      };

      await saveHomepageContent(updated);
      setHomepage(updated);

      setUploadedUrl("");
      setUploadedFilename("");
    } catch (error) {
      console.error(
        "Could not restore default image:",
        error
      );

      alert("Could not restore the default image.");
    }
  }

  if (loading) {
    return (
      <main className="media-loading">
        <Loader2 className="spin" size={22} />
        Loading media manager...
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

            <h1>Media Manager</h1>

            <p>
              Manage the exact images assigned to
              every visual position on the website.
            </p>
          </div>
        </header>

        <section className="media-manager">
          <div className="media-manager-sidebar">
            <div className="media-selector-label">
              WEBSITE IMAGE
            </div>

            <div className="media-dropdown">
              <ChevronDown size={17} />

              <select
                value={selectedSlot}
                onChange={(event) =>
                  setSelectedSlot(
                    event.target.value as ImageSlotId
                  )
                }
              >
                {IMAGE_SLOTS.map((slot) => (
                  <option
                    key={slot.id}
                    value={slot.id}
                  >
                    {slot.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="media-slot-list">
              {IMAGE_SLOTS.map((slot) => {
                const status = getStatus(
                  slot.id,
                  homepage
                );

                return (
                  <button
                    key={slot.id}
                    className={
                      selectedSlot === slot.id
                        ? "media-slot active"
                        : "media-slot"
                    }
                    onClick={() =>
                      setSelectedSlot(slot.id)
                    }
                  >
                    <span className="media-slot-name">
                      {slot.label}
                    </span>

                    <span
                      className={`media-slot-status ${status}`}
                    >
                      {status === "default"
                        ? "DEFAULT"
                        : status === "assigned"
                          ? "ASSIGNED"
                          : "NOT ASSIGNED"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="media-manager-main">
            <div className="media-manager-heading">
              <div>
                <span>
                  {selectedDefinition.group}
                </span>

                <h2>
                  {selectedDefinition.label}
                </h2>
              </div>

              <div
                className={`media-current-status ${selectedStatus}`}
              >
                {selectedStatus === "default"
                  ? "DEFAULT"
                  : selectedStatus === "assigned"
                    ? "ASSIGNED"
                    : "NOT ASSIGNED"}
              </div>
            </div>

            <div className="media-current-image">
              {selectedUrl ? (
                <img
                  src={selectedUrl}
                  alt={selectedDefinition.label}
                />
              ) : (
                <div className="media-no-image">
                  <ImagePlus size={36} />
                  <strong>
                    No image assigned
                  </strong>
                  <span>
                    Upload an image for this
                    website position.
                  </span>
                </div>
              )}
            </div>

            <div className="media-current-details">
              <div>
                <span>CURRENT IMAGE</span>

                <strong>
                  {selectedUrl
                    ? uploadedUrl &&
                      uploadedUrl === selectedUrl
                      ? uploadedFilename
                      : getFilename(
                          selectedUrl,
                          selectedDefinition.label
                        )
                    : "None"}
                </strong>
              </div>

              <div>
                <span>WEBSITE POSITION</span>
                <strong>
                  {selectedDefinition.label}
                </strong>
              </div>
            </div>

            {uploadedUrl && (
              <div className="media-pending">
                <div className="media-pending-image">
                  <img
                    src={uploadedUrl}
                    alt="Uploaded preview"
                  />
                </div>

                <div>
                  <span>
                    NEW IMAGE READY
                  </span>

                  <strong>
                    {uploadedFilename ||
                      selectedDefinition.label}
                  </strong>

                  <p>
                    This image has been uploaded but
                    has not replaced the current
                    website image yet.
                  </p>
                </div>

                <button
                  className="media-assign-button"
                  onClick={assignUploadedImage}
                  disabled={assigning}
                >
                  {assigning ? (
                    <Loader2
                      className="spin"
                      size={16}
                    />
                  ) : (
                    <Check size={16} />
                  )}

                  {assigning
                    ? "Assigning..."
                    : `Assign to ${selectedDefinition.label}`}
                </button>
              </div>
            )}

            <div className="media-manager-actions">
              <button
                className="media-upload-main-button"
                onClick={() =>
                  setUploadModalOpen(true)
                }
              >
                <Upload size={17} />
                Upload new image
              </button>

              {selectedStatus === "assigned" && (
                <button
                  className="media-reset-button"
                  onClick={resetToDefault}
                >
                  Restore default
                </button>
              )}
            </div>

            <div className="media-help">
              <strong>
                How image assignment works
              </strong>

              <p>
                Select a website position from the
                dropdown. Upload a new image, review
                the preview, then press Assign. The
                website will only change after you
                press Assign.
              </p>
            </div>
          </div>
        </section>

        {uploadModalOpen && (
          <div
            className="media-overlay"
            onClick={() =>
              !uploading &&
              setUploadModalOpen(false)
            }
          >
            <div
              className="media-upload-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <button
                className="modal-close"
                onClick={() =>
                  !uploading &&
                  setUploadModalOpen(false)
                }
              >
                <X size={20} />
              </button>

              <div className="upload-modal-icon">
                <Upload size={25} />
              </div>

              <span className="modal-eyebrow">
                UPLOAD IMAGE
              </span>

              <h2>
                {selectedDefinition.label}
              </h2>

              <p>
                You are uploading an image for this
                exact website position. After upload,
                you must press Assign before it
                replaces the current image.
              </p>

              <div className="upload-target">
                <span>SELECTED POSITION</span>
                <strong>
                  {selectedDefinition.label}
                </strong>
              </div>

              <button
                className="save-assignment upload-now-button"
                onClick={openUploader}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2
                      className="spin"
                      size={17}
                    />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={17} />
                    Choose image
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
