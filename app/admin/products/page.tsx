"use client";

import "./products.css";

import {
  type FormEvent,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getCategories,
  type RentalCategory,
} from "@/lib/cms/categories";
import {
  createRental,
  deleteRental,
  getRentals,
  updateRental,
  type Rental,
} from "@/lib/cms/rentals";

type CloudinaryUploadResult = {
  event?: string;
  info?: {
    secure_url?: string;
    public_id?: string;
    original_filename?: string;
    bytes?: number;
    format?: string;
  };
};

type CloudinaryWidget = {
  open: () => void;
  close: () => void;
  destroy: () => void;
};

type CloudinaryWidgetOptions = {
  cloudName: string;
  uploadPreset: string;
  folder: string;
  sources: string[];
  multiple: boolean;
  maxFileSize: number;
  clientAllowedFormats: string[];
  cropping: boolean;
  resourceType: string;
};


type FormState = {
  name: string;
  slug: string;
  categoryId: string;
  description: string;
  image: string;
  price: string;
  minimumQuantity: string;
  maximumQuantity: string;
  quantityAvailable: string;
  inventoryMode: Rental["inventoryMode"];
  active: boolean;
  featured: boolean;
};

const emptyForm: FormState = {
  name: "",
  slug: "",
  categoryId: "",
  description: "",
  image: "",
  price: "",
  minimumQuantity: "1",
  maximumQuantity: "",
  quantityAvailable: "",
  inventoryMode: "quantity_controlled",
  active: true,
  featured: false,
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toForm(rental: Rental): FormState {
  return {
    name: rental.name || "",
    slug: rental.slug || "",
    categoryId: rental.categoryId || "",
    description: rental.description || "",
    image: rental.image || "",
    price: String(rental.price ?? ""),
    minimumQuantity: String(rental.minimumQuantity || 1),
    maximumQuantity:
      rental.maximumQuantity !== undefined
        ? String(rental.maximumQuantity)
        : "",
    quantityAvailable:
      rental.quantityAvailable !== undefined
        ? String(rental.quantityAvailable)
        : "",
    inventoryMode: rental.inventoryMode,
    active: rental.active,
    featured: rental.featured || false,
  };
}

function loadCloudinaryWidget(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("Image uploading is only available in the browser.")
    );
  }

  if (window.cloudinary) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const scriptId = "reis-cloudinary-upload-widget";
    let script = document.getElementById(
      scriptId
    ) as HTMLScriptElement | null;

    if (script?.dataset.loaded === "true" && window.cloudinary) {
      resolve();
      return;
    }

    const handleLoad = () => {
      if (window.cloudinary) {
        if (script) script.dataset.loaded = "true";
        resolve();
      } else {
        reject(
          new Error(
            "Cloudinary loaded, but its upload widget is unavailable. Refresh the page and try again."
          )
        );
      }
    };

    const handleError = () => {
      reject(
        new Error(
          "Unable to load Cloudinary. Check your internet connection and try again."
        )
      );
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src =
        "https://upload-widget.cloudinary.com/global/all.js";
      script.async = true;
      script.addEventListener("load", handleLoad, { once: true });
      script.addEventListener("error", handleError, { once: true });
      document.head.appendChild(script);
      return;
    }

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });

    if (window.cloudinary) {
      resolve();
    }
  });
}

export default function ProductsPage() {
  const router = useRouter();
  const [productType, setProductType] = useState<"rental" | "tent">("rental");

  const [rentals, setRentals] = useState<Rental[]>([]);
  const [categories, setCategories] = useState<RentalCategory[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );


  useEffect(() => {
    const syncProductType = () => {
      const params = new URLSearchParams(window.location.search);
      setProductType(params.get("type") === "tent" ? "tent" : "rental");
    };

    syncProductType();
    window.addEventListener("popstate", syncProductType);
    return () => window.removeEventListener("popstate", syncProductType);
  }, []);

  const isTent = productType === "tent";
  const productLabel = isTent ? "Tent & Marquee" : "Rental";
  const productPlural = isTent ? "Tents & Marquees" : "Rentals";

  const availableCategories = categories
    .filter(
      (category) =>
        category.active &&
        (
          category.section === "tents" ||
          category.section === "rentals" ||
          !category.section
        )
    )
    .filter(
      (category) =>
        (category.section === "tents") === isTent
    );

  async function load() {
    setLoading(true);

    try {
      const [allProducts, categoryData] = await Promise.all([
        getRentals(),
        getCategories(),
      ]);

      const filteredProducts = allProducts.filter(
        (item) => (item.type || "rental") === productType
      );

      setRentals(filteredProducts);
      setCategories(categoryData);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load products."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // Reload when switching between the rental and tent catalogues.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productType]);

  function updateField<K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function showMessage(
    text: string,
    type: "success" | "error" | "info" = "info"
  ) {
    setMessage(text);
    setMessageType(type);
  }

  function startNew() {
    setEditingId(null);
    setForm(emptyForm);
    showMessage("", "info");
  }

  function editRental(rental: Rental) {
    setEditingId(rental.id);
    setForm(toForm(rental));
    showMessage("", "info");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function uploadImage() {
    if (uploading || saving) return;

    setUploading(true);
    showMessage("Preparing image uploader…", "info");

    try {
      await loadCloudinaryWidget();

      if (!window.cloudinary) {
        throw new Error(
          "Cloudinary uploader is unavailable. Refresh the page and try again."
        );
      }

      const widget = window.cloudinary.createUploadWidget(
        {
          cloudName: "dmbjrohtn",
          uploadPreset: "pelumi",
          folder: "reis/products",
          sources: ["local", "camera"],
          multiple: false,
          maxFileSize: 10000000,
          clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
          cropping: false,
          resourceType: "image",
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            setUploading(false);
            showMessage(
              "Image upload failed. Check your Cloudinary upload preset and try again.",
              "error"
            );
            return;
          }

          if (!result) return;

          if (result.event === "success" && result.info?.secure_url) {
            const imageUrl = result.info.secure_url;

            if (
              !imageUrl.startsWith("https://res.cloudinary.com/")
            ) {
              setUploading(false);
              showMessage(
                "The returned image URL is not a recognised Cloudinary image URL.",
                "error"
              );
              return;
            }

            updateField("image", imageUrl);
            setUploading(false);

            showMessage(
              "Image uploaded successfully. Save the product to keep the image assignment.",
              "success"
            );
          }

          if (result.event === "close") {
            setUploading(false);
            showMessage(
              "Image uploader closed. Your product has not been saved.",
              "info"
            );
          }
        }
      );

      widget.open();
    } catch (error) {
      setUploading(false);
      showMessage(
        error instanceof Error
          ? error.message
          : "Unable to open the Cloudinary uploader.",
        "error"
      );
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    showMessage("", "info");

    if (saving || uploading) {
      showMessage(
        "Wait for the current upload or save operation to finish.",
        "error"
      );
      return;
    }

    const price = Number(form.price);
    const minimumQuantity = Number(form.minimumQuantity || 1);
    const maximumQuantity = form.maximumQuantity
      ? Number(form.maximumQuantity)
      : undefined;
    const quantityAvailable = form.quantityAvailable
      ? Number(form.quantityAvailable)
      : undefined;

    if (!form.name.trim()) {
      showMessage(
        `Enter a ${productLabel.toLowerCase()} name.`,
        "error"
      );
      return;
    }

    if (!form.categoryId) {
      showMessage("Choose a category for this product.", "error");
      return;
    }

    const selectedCategory = availableCategories.find(
      (category) => category.id === form.categoryId
    );

    if (!selectedCategory) {
      showMessage(
        "The selected category is not available in this catalogue. Choose another category.",
        "error"
      );
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      showMessage("Enter a valid price.", "error");
      return;
    }

    if (
      !Number.isInteger(minimumQuantity) ||
      minimumQuantity < 1
    ) {
      showMessage(
        "Minimum quantity must be a whole number of at least 1.",
        "error"
      );
      return;
    }

    if (
      maximumQuantity !== undefined &&
      (
        !Number.isInteger(maximumQuantity) ||
        maximumQuantity < minimumQuantity
      )
    ) {
      showMessage(
        "Maximum quantity must be a whole number greater than or equal to the minimum quantity.",
        "error"
      );
      return;
    }

    if (
      quantityAvailable !== undefined &&
      (
        !Number.isInteger(quantityAvailable) ||
        quantityAvailable < 0
      )
    ) {
      showMessage(
        "Available quantity must be a non-negative whole number.",
        "error"
      );
      return;
    }

    const image = form.image.trim();

    if (
      image &&
      !/^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//i.test(
        image
      )
    ) {
      showMessage(
        "Use a valid HTTPS Cloudinary image URL, or upload an image using the upload button.",
        "error"
      );
      return;
    }

    const rentalData = {
      name: form.name.trim(),
      slug: slugify(
        editingId && form.slug.trim()
          ? form.slug
          : form.name
      ),
      type: productType,
      categoryId: form.categoryId,
      description: form.description.trim(),
      image,
      active: form.active,
      featured: form.featured,
      price,
      currency: "GBP" as const,
      minimumQuantity,
      ...(maximumQuantity !== undefined
        ? { maximumQuantity }
        : {}),
      inventoryMode: form.inventoryMode,
      ...(quantityAvailable !== undefined
        ? { quantityAvailable }
        : {}),
    };

    if (!rentalData.slug) {
      showMessage("Enter a valid product name or URL slug.", "error");
      return;
    }

    setSaving(true);

    try {
      if (editingId) {
        await updateRental(editingId, rentalData);
        showMessage(
          `${productLabel} updated successfully.`,
          "success"
        );
      } else {
        await createRental(rentalData);
        showMessage(
          `${productLabel} created successfully.`,
          "success"
        );
      }

      setEditingId(null);
      setForm(emptyForm);
      await load();
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Unable to save the product. Check your Firebase permissions and try again.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeRental(rental: Rental) {
    const confirmed = window.confirm(
      `Delete "${rental.name}"? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await deleteRental(rental.id);

      showMessage(`${productLabel} deleted.`, "success");

      if (editingId === rental.id) {
        setEditingId(null);
        setForm(emptyForm);
      }

      await load();
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete the product.",
        "error"
      );
    }
  }

  return (
    <main className="rental-manager">
      <nav className="rm-nav" aria-label="Admin navigation">
        <Link className="rm-nav-brand" href="/admin" aria-label="REIS admin dashboard">
          <span className="rm-nav-mark">R</span>
          <span className="rm-nav-brand-copy">
            <strong>REIS</strong>
            <small>EVENT SERVICES</small>
          </span>
        </Link>

        <details className="rm-nav-menu">
          <summary aria-label="Toggle admin navigation">
            <span className="rm-menu-icon" aria-hidden="true">
              <span></span><span></span><span></span>
            </span>
            <span className="rm-menu-label">MENU</span>
          </summary>

          <div className="rm-nav-panel">
            <div className="rm-nav-panel-heading">ADMINISTRATION</div>
            <Link href="/admin">Dashboard</Link>
            <Link href="/admin/homepage">Homepage</Link>
            <Link href="/admin/services">Services</Link>
            <Link href="/admin/media">Media</Link>
            <Link href="/admin/categories">Categories</Link>
            <Link
              href="/admin/products"
              aria-current={!isTent ? "page" : undefined}
              onClick={(event) => {
                event.preventDefault();
                router.push("/admin/products");
                setProductType("rental");
              }}
            >
              Rentals
            </Link>
            <Link
              href="/admin/products?type=tent"
              aria-current={isTent ? "page" : undefined}
              onClick={(event) => {
                event.preventDefault();
                router.push("/admin/products?type=tent");
                setProductType("tent");
              }}
            >
              Tents &amp; Marquees
            </Link>
            <Link href="/admin/styling-enquiries">Styling Enquiries</Link>
            <Link href="/admin/bookings">Bookings</Link>
          </div>
        </details>
      </nav>

      <div className="rm-main">
        <div className="rm-content">
          <div className="section-head">
            <div>
              <div className="eyebrow">CATALOGUE MANAGEMENT</div>
              <h1>{productPlural}</h1>

              <p className="lead">
                {isTent
                  ? "Add and manage tents and marquees available for hire."
                  : "Add and manage the physical items customers can rent."}
              </p>
            </div>

            <button
              type="button"
              className="button"
              onClick={startNew}
            >
              + New {productLabel.toLowerCase()}
            </button>
          </div>

          {message && (
            <div
              className="admin-message"
              role="status"
              aria-live="polite"
              data-type={messageType}
            >
              {message}
            </div>
          )}

          <form className="admin-card" onSubmit={save}>
            <div className="eyebrow">
              {editingId
                ? `EDIT ${productLabel.toUpperCase()}`
                : `NEW ${productLabel.toUpperCase()}`}
            </div>

            <div className="form-grid">
              <label>
                {productLabel} name

                <input
                  value={form.name}
                  onChange={(event) =>
                    updateField("name", event.target.value)
                  }
                  placeholder={
                    isTent ? "Premium Marquee Tent" : "Chiavari Chair"
                  }
                  required
                />
              </label>



              <label>
                Category

                <select
                  value={form.categoryId}
                  onChange={(event) =>
                    updateField("categoryId", event.target.value)
                  }
                  required
                >
                  <option value="">Select category</option>

                  {availableCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                {availableCategories.length === 0 && (
                  <small>
                    No active categories are available. Create an active{" "}
                    {isTent ? "tent and marquee" : "rental"} category first.
                  </small>
                )}
              </label>

              <label>
                Price per item (£)

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) =>
                    updateField("price", event.target.value)
                  }
                  placeholder="1.00"
                  required
                />
              </label>

              <label>
                Minimum quantity

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.minimumQuantity}
                  onChange={(event) =>
                    updateField("minimumQuantity", event.target.value)
                  }
                  required
                />
              </label>

              <label>
                Maximum quantity

                <input
                  type="number"
                  min={form.minimumQuantity || "1"}
                  step="1"
                  value={form.maximumQuantity}
                  onChange={(event) =>
                    updateField("maximumQuantity", event.target.value)
                  }
                  placeholder="Optional"
                />
              </label>

              <label>
                Available quantity

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.quantityAvailable}
                  onChange={(event) =>
                    updateField("quantityAvailable", event.target.value)
                  }
                  placeholder="Optional"
                />
              </label>

              <label>
                Inventory mode

                <select
                  value={form.inventoryMode}
                  onChange={(event) =>
                    updateField(
                      "inventoryMode",
                      event.target.value as Rental["inventoryMode"]
                    )
                  }
                >
                  <option value="quantity_controlled">
                    Quantity controlled
                  </option>
                  <option value="admin_confirmed">
                    Admin confirmed
                  </option>
                  <option value="enquiry">Enquiry / quote</option>
                </select>
              </label>

              <div className="wide">
                <label htmlFor="product-image-url">
                  Product image
                </label>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: "12px",
                    marginTop: "8px",
                  }}
                >
                  <button
                    type="button"
                    className="button"
                    onClick={() => void uploadImage()}
                    disabled={uploading || saving}
                  >
                    {uploading
                      ? "Opening uploader…"
                      : form.image
                        ? "Replace image"
                        : "Upload image"}
                  </button>

                  {form.image && (
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => updateField("image", "")}
                      disabled={uploading || saving}
                    >
                      Remove image
                    </button>
                  )}
                </div>

                {form.image ? (
                  <div
                    style={{
                      marginTop: "16px",
                      maxWidth: "420px",
                    }}
                  >
                    <img
                      src={form.image}
                      alt={`${form.name || productLabel} preview`}
                      style={{
                        display: "block",
                        width: "100%",
                        maxHeight: "280px",
                        objectFit: "contain",
                        borderRadius: "8px",
                        background: "#f5f3ee",
                      }}
                    />

                    <small
                      style={{
                        display: "block",
                        marginTop: "8px",
                        overflowWrap: "anywhere",
                      }}
                    >
                      Uploaded image preview. Save the product to persist
                      the image URL.
                    </small>
                  </div>
                ) : (
                  <div
                    style={{
                      marginTop: "12px",
                      padding: "24px",
                      border: "1px dashed #c9c5bc",
                      borderRadius: "8px",
                      background: "#faf9f6",
                    }}
                  >
                    <p style={{ margin: 0 }}>
                      No image selected. Upload a JPG, JPEG, PNG or WebP
                      image up to 10 MB.
                    </p>
                  </div>
                )}

                <input
                  id="product-image-url"
                  type="hidden"
                  value={form.image}
                  readOnly
                />
              </div>

              <label className="wide">
                Description

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  rows={4}
                  placeholder={
                    isTent
                      ? "Describe the tent or marquee, capacity and hire details..."
                      : "Describe the rental item..."
                  }
                />
              </label>
            </div>

            <div className="check-row">
              <label>
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) =>
                    updateField("active", event.target.checked)
                  }
                />
                Active
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(event) =>
                    updateField("featured", event.target.checked)
                  }
                />
                Featured on catalogue
              </label>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="button"
                disabled={saving || uploading}
              >
                {saving
                  ? "Saving…"
                  : editingId
                    ? "Save changes"
                    : `Create ${productLabel.toLowerCase()}`}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="button secondary"
                  onClick={startNew}
                  disabled={saving || uploading}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="section-head">
            <div>
              <div className="eyebrow">CATALOGUE</div>

              <h2>
                {loading
                  ? "Loading…"
                  : `${rentals.length} ${productPlural.toLowerCase()}`}
              </h2>
            </div>
          </div>

          {!loading && rentals.length === 0 ? (
            <div className="admin-card">
              <h3>No {productPlural.toLowerCase()} yet</h3>

              <p>
                Create your first item above. Only active products should
                appear in the public catalogue.
              </p>
            </div>
          ) : (
            <div className="rental-list">
              {rentals.map((rental) => (
                <article className="rental-row" key={rental.id}>
                  <div className="rental-thumb">
                    {rental.image ? (
                      <img
                        src={rental.image}
                        alt={rental.name}
                      />
                    ) : (
                      <span>REIS</span>
                    )}
                  </div>

                  <div className="rental-info">
                    <strong>{rental.name}</strong>

                    <span>
                      £{Number(rental.price || 0).toFixed(2)} / item
                    </span>

                    <small>
                      {categories.find(
                        (category) =>
                          category.id === rental.categoryId
                      )?.name || "Uncategorised"}
                    </small>
                  </div>

                  <div className="rental-status">
                    <span>
                      {rental.active ? "Active" : "Hidden"}
                    </span>

                    <small>{rental.inventoryMode}</small>
                  </div>

                  <div className="rental-actions">
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => editRental(rental)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="button danger"
                      onClick={() => void removeRental(rental)}
                      disabled={saving || uploading}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
