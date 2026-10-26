"use client";

import { useEffect, useState, type FormEvent } from "react";
import "./styling.css";
import { auth } from "@/lib/firebase";

const CLOUD_NAME = "dmbjrohtn";
const UPLOAD_PRESET = "pelumi";
const MAX_IMAGES = 8;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

type PortfolioProject = {
  id: string;
  title: string;
  description: string;
  images: { url: string; format?: string; width?: number; height?: number }[];
};

type UploadResult = {
  venuePhotos: string[];
  inspirationImages: string[];
};

async function uploadImages(files: FileList | null): Promise<string[]> {
  const selected = Array.from(files ?? []);

  if (!selected.length) return [];

  if (selected.some((file) => !file.type.startsWith("image/"))) {
    throw new Error("Please select image files only.");
  }

  if (selected.some((file) => file.size > MAX_FILE_SIZE)) {
    throw new Error("Each image must be 10 MB or smaller.");
  }

  const uploaded: string[] = [];

  for (const file of selected) {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", UPLOAD_PRESET);
    data.append("folder", "reis/styling-enquiries");

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: "POST", body: data }
    );

    const result = await response.json();

    if (!response.ok || typeof result.secure_url !== "string") {
      throw new Error("An image could not be uploaded. Please try again.");
    }

    uploaded.push(result.secure_url);
  }

  return uploaded;
}

export default function Styling() {
  const [sent, setSent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [hireFormOpen, setHireFormOpen] = useState(false);
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      try {
        const response = await fetch("/api/service-portfolio", {
          cache: "no-store",
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || "Completed projects are temporarily unavailable."
          );
        }

        if (active) {
          setProjects(
            Array.isArray(result.projects) ? result.projects : []
          );
        }
      } catch (caught) {
        if (active) {
          setProjectsError(
            caught instanceof Error
              ? caught.message
              : "Completed projects are temporarily unavailable."
          );
        }
      } finally {
        if (active) setProjectsLoading(false);
      }
    }

    void loadProjects();

    return () => {
      active = false;
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSent("");

    const form = event.currentTarget;
    const values = new FormData(form);

    try {
      const venueFiles = values.getAll("venuePhotos") as File[];
      const inspirationFiles = values.getAll("inspirationImages") as File[];
      const selectedCount =
        venueFiles.filter((file) => file.size > 0).length +
        inspirationFiles.filter((file) => file.size > 0).length;

      if (selectedCount > MAX_IMAGES) {
        throw new Error("Please select no more than eight images in total.");
      }

      const uploadInput = async (name: string) => {
        const input = form.elements.namedItem(name) as HTMLInputElement | null;
        return uploadImages(input?.files ?? null);
      };

      const [venuePhotos, inspirationImages]: UploadResult[keyof UploadResult][] =
        await Promise.all([
          uploadInput("venuePhotos"),
          uploadInput("inspirationImages"),
        ]);

      const payload = {
        name: values.get("name"),
        email: values.get("email"),
        phone: values.get("phone"),
        eventDate: values.get("eventDate"),
        eventType: values.get("eventType"),
        venue: values.get("venue"),
        description: values.get("description"),
        length: values.get("length"),
        width: values.get("width"),
        height: values.get("height"),
        venuePhotos,
        inspirationImages,
      };

      const user = auth.currentUser;

      if (!user) {
        throw new Error("Please sign in before submitting your styling enquiry.");
      }

      const idToken = await user.getIdToken();

      const response = await fetch("/api/styling-enquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Your enquiry could not be submitted.");
      }

      setSent(result.reference);
      form.reset();
    } catch (err) {
      setHireFormOpen(true);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="reis-styling-page">
      <div className="reis-styling-wrap">
        <section className="reis-styling-hero">
          <div className="eyebrow">REIS EVENT SERVICES · OUR WORK</div>
          <h1>Beautiful events.<br /><em>Thoughtfully created.</em></h1>
          <p className="lead">
            Explore completed celebrations and styling projects by REIS.
            When you are ready to bring your vision to life, tell us about
            your occasion and our team will discuss your requirements.
          </p>
          <button
            className="reis-hire-button"
            type="button"
            aria-expanded={hireFormOpen}
            aria-controls="reis-hire-form"
            onClick={() => {
              setHireFormOpen((open) => !open);
              setError("");
            }}
          >
            {hireFormOpen ? "Close enquiry form" : "Hire Us"}
            <span aria-hidden="true">{hireFormOpen ? "−" : "↗"}</span>
          </button>
        </section>

        {sent && (
          <div className="notice" role="status">
            <strong>Your styling enquiry has been submitted.</strong>
            <p>Keep this reference for your records: {sent}</p>
            <p>The REIS team will contact you using the details supplied.</p>
            <button className="btn" type="button" onClick={() => {
              setSent("");
              setHireFormOpen(true);
            }}>
              Submit another enquiry
            </button>
          </div>
        )}

        {error && (
          <div className="notice" role="alert">
            {error}
          </div>
        )}

        {!sent && hireFormOpen && (
          <form id="reis-hire-form" className="form reis-hire-form" onSubmit={submit}>
            <div className="two">
              <div className="field">
                <label htmlFor="name">Full name</label>
                <input id="name" name="name" required maxLength={120} />
              </div>
              <div className="field">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  name="email"
                  required
                  type="email"
                  maxLength={254}
                />
              </div>
            </div>

            <div className="two">
              <div className="field">
                <label htmlFor="phone">Phone / WhatsApp</label>
                <input id="phone" name="phone" required maxLength={40} />
              </div>
              <div className="field">
                <label htmlFor="eventDate">Event date</label>
                <input id="eventDate" name="eventDate" required type="date" />
              </div>
            </div>

            <div className="two">
              <div className="field">
                <label htmlFor="eventType">Event type</label>
                <select id="eventType" name="eventType" defaultValue="Wedding">
                  <option>Wedding</option>
                  <option>Birthday</option>
                  <option>Baby shower</option>
                  <option>Corporate event</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="venue">Venue / location</label>
                <input id="venue" name="venue" required maxLength={200} />
              </div>
            </div>

            <div className="field">
              <label htmlFor="description">
                What would you like us to design?
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={6}
                maxLength={5000}
                placeholder="Describe the look, colours, décor, seating, flowers, draping and other requirements."
              />
            </div>

            <div className="field">
              <label htmlFor="venuePhotos">Venue photographs</label>
              <input
                id="venuePhotos"
                name="venuePhotos"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
              />
            </div>

            <div className="field">
              <label htmlFor="inspirationImages">
                Inspiration images (optional)
              </label>
              <input
                id="inspirationImages"
                name="inspirationImages"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
              />
            </div>

            <p className="muted">
              Up to eight images in total, 10 MB per image.
            </p>

            <div className="three">
              <div className="field">
                <label htmlFor="length">Length (m), if known</label>
                <input id="length" name="length" type="number" min="0" step="0.01" />
              </div>
              <div className="field">
                <label htmlFor="width">Width (m), if known</label>
                <input id="width" name="width" type="number" min="0" step="0.01" />
              </div>
              <div className="field">
                <label htmlFor="height">Height (m), if known</label>
                <input id="height" name="height" type="number" min="0" step="0.01" />
              </div>
            </div>

            <button className="btn" type="submit" disabled={busy}>
              {busy ? "Submitting enquiry…" : "Submit design request"}
            </button>
          </form>
        )}

        <section className="reis-projects-section" aria-labelledby="reis-projects-title">
          <div className="reis-projects-heading">
            <div>
              <div className="eyebrow">SELECTED CELEBRATIONS</div>
              <h2 id="reis-projects-title">A little of what we create.</h2>
              <p>Considered details, beautiful settings and memorable occasions.</p>
            </div>
          </div>

          {projectsLoading && (
            <p className="reis-projects-message" role="status">
              Loading completed projects…
            </p>
          )}

          {!projectsLoading && projectsError && (
            <p className="reis-projects-message" role="alert">
              {projectsError}
            </p>
          )}

          {!projectsLoading && !projectsError && projects.length === 0 && (
            <p className="reis-projects-message">
              Our latest projects will appear here soon. Select Hire Us to
              tell us about the occasion you are planning.
            </p>
          )}

          <div className="reis-projects-grid">
            {projects.map((project) => (
              <article className="reis-project-card" key={project.id}>
                <div className="reis-project-gallery">
                  {project.images.map((image, index) => (
                    <div
                      className={`reis-project-image${index === 0 ? " is-featured" : ""}`}
                      key={`${image.url}-${index}`}
                    >
                      <img
                        src={image.url}
                        alt={`${project.title} — photograph ${index + 1}`}
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
                <div className="reis-project-copy">
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
