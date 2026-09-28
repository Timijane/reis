"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { getCategories, type RentalCategory } from "@/lib/cms/categories";
import {
  createRental,
  deleteRental,
  getRentals,
  updateRental,
  type Rental,
} from "@/lib/cms/rentals";

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
    name: rental.name,
    slug: rental.slug,
    categoryId: rental.categoryId || "",
    description: rental.description,
    image: rental.image || "",
    price: String(rental.price),
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

export default function ProductsPage() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [categories, setCategories] = useState<RentalCategory[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);

    try {
      const [rentalData, categoryData] = await Promise.all([
        getRentals(),
        getCategories(),
      ]);

      setRentals(rentalData);
      setCategories(categoryData);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load rentals."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function updateField<K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function startNew() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
  }

  function editRental(rental: Rental) {
    setEditingId(rental.id);
    setForm(toForm(rental));
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    const price = Number(form.price);
    const minimumQuantity = Number(form.minimumQuantity || 1);
    const maximumQuantity = form.maximumQuantity
      ? Number(form.maximumQuantity)
      : undefined;
    const quantityAvailable = form.quantityAvailable
      ? Number(form.quantityAvailable)
      : undefined;

    if (!form.name.trim()) {
      setMessage("Enter a rental name.");
      return;
    }

    if (!form.categoryId) {
      setMessage("Choose a category.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setMessage("Enter a valid price.");
      return;
    }

    if (!Number.isInteger(minimumQuantity) || minimumQuantity < 1) {
      setMessage("Minimum quantity must be at least 1.");
      return;
    }

    if (
      maximumQuantity !== undefined &&
      (!Number.isInteger(maximumQuantity) ||
        maximumQuantity < minimumQuantity)
    ) {
      setMessage("Maximum quantity must be greater than minimum quantity.");
      return;
    }

    if (
      quantityAvailable !== undefined &&
      (!Number.isInteger(quantityAvailable) ||
        quantityAvailable < 0)
    ) {
      setMessage("Available quantity must be a whole number.");
      return;
    }

    setSaving(true);

    const rentalData = {
      name: form.name.trim(),
      slug: slugify(form.slug || form.name),
      type: "rental" as const,
      categoryId: form.categoryId,
      description: form.description.trim(),
      image: form.image.trim(),
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

    try {
      if (editingId) {
        await updateRental(editingId, rentalData);
        setMessage("Rental updated successfully.");
      } else {
        await createRental(rentalData);
        setMessage("Rental created successfully.");
      }

      await load();
      startNew();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save rental."
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
      setMessage("Rental deleted.");
      await load();

      if (editingId === rental.id) {
        startNew();
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete rental."
      );
    }
  }

  return (
    <main className="admin">
      <div className="adminnav">
        <Link href="/admin">Dashboard</Link>
        <Link href="/admin/homepage">Homepage</Link>
        <Link href="/admin/media">Media</Link>
        <Link href="/admin/categories">Categories</Link>
        <Link href="/admin/products">Rentals</Link>
        <Link href="/admin/bookings">Bookings</Link>
      </div>

      <div className="section">
        <div className="wrap">
          <div className="section-head">
            <div>
              <div className="eyebrow">CATALOGUE MANAGEMENT</div>
              <h1>Rentals</h1>
              <p className="lead">
                Add and manage the physical items customers can rent.
              </p>
            </div>

            <button
              type="button"
              className="button"
              onClick={startNew}
            >
              + New rental
            </button>
          </div>

          {message && (
            <div className="admin-message">
              {message}
            </div>
          )}

          <form className="admin-card" onSubmit={save}>
            <div className="eyebrow">
              {editingId ? "EDIT RENTAL" : "NEW RENTAL"}
            </div>

            <div className="form-grid">
              <label>
                Rental name
                <input
                  value={form.name}
                  onChange={(e) =>
                    updateField("name", e.target.value)
                  }
                  placeholder="Chiavari Chair"
                />
              </label>

              <label>
                URL slug
                <input
                  value={form.slug}
                  onChange={(e) =>
                    updateField("slug", e.target.value)
                  }
                  placeholder="chiavari-chair"
                />
              </label>

              <label>
                Category
                <select
                  value={form.categoryId}
                  onChange={(e) =>
                    updateField("categoryId", e.target.value)
                  }
                >
                  <option value="">Select category</option>
                  {categories
                    .filter((category) => category.active)
                    .map((category) => (
                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.name}
                      </option>
                    ))}
                </select>
              </label>

              <label>
                Price per item (£)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) =>
                    updateField("price", e.target.value)
                  }
                  placeholder="1.00"
                />
              </label>

              <label>
                Minimum quantity
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.minimumQuantity}
                  onChange={(e) =>
                    updateField(
                      "minimumQuantity",
                      e.target.value
                    )
                  }
                />
              </label>

              <label>
                Maximum quantity
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.maximumQuantity}
                  onChange={(e) =>
                    updateField(
                      "maximumQuantity",
                      e.target.value
                    )
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
                  onChange={(e) =>
                    updateField(
                      "quantityAvailable",
                      e.target.value
                    )
                  }
                  placeholder="Optional"
                />
              </label>

              <label>
                Inventory mode
                <select
                  value={form.inventoryMode}
                  onChange={(e) =>
                    updateField(
                      "inventoryMode",
                      e.target.value as Rental["inventoryMode"]
                    )
                  }
                >
                  <option value="quantity_controlled">
                    Quantity controlled
                  </option>
                  <option value="admin_confirmed">
                    Admin confirmed
                  </option>
                  <option value="enquiry">
                    Enquiry / quote
                  </option>
                </select>
              </label>

              <label className="wide">
                Image URL
                <input
                  value={form.image}
                  onChange={(e) =>
                    updateField("image", e.target.value)
                  }
                  placeholder="Cloudinary image URL"
                />
              </label>

              <label className="wide">
                Description
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    updateField(
                      "description",
                      e.target.value
                    )
                  }
                  rows={4}
                  placeholder="Describe the rental item..."
                />
              </label>
            </div>

            <div className="check-row">
              <label>
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) =>
                    updateField("active", e.target.checked)
                  }
                />
                Active
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) =>
                    updateField(
                      "featured",
                      e.target.checked
                    )
                  }
                />
                Featured on catalogue
              </label>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save changes"
                    : "Create rental"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="button secondary"
                  onClick={startNew}
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
                  ? "Loading..."
                  : `${rentals.length} rental${rentals.length === 1 ? "" : "s"}`}
              </h2>
            </div>
          </div>

          {!loading && rentals.length === 0 ? (
            <div className="admin-card">
              <h3>No rentals yet</h3>
              <p>
                Create your first rental above. It will become
                available to the booking catalogue.
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
                        alt=""
                      />
                    ) : (
                      <span>REIS</span>
                    )}
                  </div>

                  <div className="rental-info">
                    <strong>{rental.name}</strong>
                    <span>
                      £{rental.price.toFixed(2)} / item
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
                    <small>
                      {rental.inventoryMode}
                    </small>
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
                      onClick={() => removeRental(rental)}
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
