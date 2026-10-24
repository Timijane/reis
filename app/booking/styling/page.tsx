"use client";

import { useState, type FormEvent } from "react";
import { auth } from "@/lib/firebase";

const CLOUD_NAME = "dmbjrohtn";
const UPLOAD_PRESET = "pelumi";
const MAX_IMAGES = 8;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

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
    <main className="section">
      <div className="wrap">
        <div className="eyebrow">EVENT STYLING</div>
        <h1>Tell us what you want designed.</h1>
        <p className="lead">
          Styling is quote-based. Share your event brief, venue information and
          photographs so the REIS team can review your requirements before
          preparing a quotation.
        </p>

        {sent && (
          <div className="notice" role="status">
            <strong>Your styling enquiry has been submitted.</strong>
            <p>Keep this reference for your records: {sent}</p>
            <p>The REIS team will contact you using the details supplied.</p>
            <button className="btn" type="button" onClick={() => setSent("")}>
              Submit another enquiry
            </button>
          </div>
        )}

        {error && (
          <div className="notice" role="alert">
            {error}
          </div>
        )}

        {!sent && (
          <form className="form" onSubmit={submit}>
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
      </div>
    </main>
  );
}
