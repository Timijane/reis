"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Edit3,
  Eye,
  EyeOff,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  createCategory,
  defaultCategories,
  deleteCategory,
  getCategories,
  updateCategory,
  type RentalCategory,
} from "@/lib/cms/categories";
import { watchAdminAuth } from "@/lib/admin/auth";
import "./categories.css";

type CategoryForm = Omit<
  RentalCategory,
  "id" | "createdAt" | "updatedAt"
>;

const emptyCategory: CategoryForm = {
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  active: true,
  featuredOnHomepage: false,
  homepageOrder: 999,
  destinationType: "category",
  destination: "",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<RentalCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<RentalCategory | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CategoryForm>(emptyCategory);

  useEffect(() => {
    const unsubscribe = watchAdminAuth((user, admin, authLoading) => {
      if (authLoading) return;

      if (!user || !admin) {
        window.location.href = "/admin/login";
        return;
      }

      loadCategories();
    });

    return unsubscribe;
  }, []);

  async function loadCategories() {
    try {
      const data = await getCategories();

      if (data.length === 0) {
        setCategories(
          defaultCategories.map((category, index) => ({
            ...category,
            id: `default-${index}`,
          }))
        );
      } else {
        setCategories(data);
      }
    } catch (error) {
      console.error(error);
      setMessage("Unable to load categories.");
    } finally {
      setLoading(false);
    }
  }

  function openNewCategory() {
    setEditing(null);
    setForm(emptyCategory);
    setShowForm(true);
    setMessage("");
  }

  function openEdit(category: RentalCategory) {
    setEditing(category);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl,
      active: category.active,
      featuredOnHomepage: category.featuredOnHomepage,
      homepageOrder: category.homepageOrder,
      destinationType: category.destinationType,
      destination: category.destination,
    });
    setShowForm(true);
    setMessage("");
  }

  function closeForm() {
    if (saving) return;
    setShowForm(false);
    setEditing(null);
    setForm(emptyCategory);
  }

  async function saveCategory(event: FormEvent) {
    event.preventDefault();

    if (!form.name.trim()) {
      setMessage("Category name is required.");
      return;
    }

    const slug = form.slug.trim() || slugify(form.name);

    if (!form.destination.trim()) {
      setMessage("Destination is required.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      if (editing) {
        await updateCategory(editing.id, {
          ...form,
          slug,
        });

        setCategories((current) =>
          current.map((item) =>
            item.id === editing.id
              ? { ...item, ...form, slug }
              : item
          )
        );

        setMessage("Category updated successfully.");
      } else {
        const created = await createCategory({
          ...form,
          slug,
        });

        setCategories((current) => [
          ...current,
          {
            ...form,
            slug,
            id: created.id,
          },
        ]);

        setMessage("Category created successfully.");
      }

      setShowForm(false);
      setEditing(null);
      setForm(emptyCategory);
    } catch (error) {
      console.error(error);
      setMessage("Unable to save category.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(category: RentalCategory) {
    try {
      await updateCategory(category.id, {
        active: !category.active,
      });

      setCategories((current) =>
        current.map((item) =>
          item.id === category.id
            ? { ...item, active: !item.active }
            : item
        )
      );
    } catch (error) {
      console.error(error);
      setMessage("Unable to update category.");
    }
  }

  async function toggleFeatured(category: RentalCategory) {
    try {
      await updateCategory(category.id, {
        featuredOnHomepage: !category.featuredOnHomepage,
      });

      setCategories((current) =>
        current.map((item) =>
          item.id === category.id
            ? {
                ...item,
                featuredOnHomepage: !item.featuredOnHomepage,
              }
            : item
        )
      );
    } catch (error) {
      console.error(error);
      setMessage("Unable to update homepage visibility.");
    }
  }

  async function removeCategory(category: RentalCategory) {
    const confirmed = window.confirm(
      `Delete "${category.name}"? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await deleteCategory(category.id);

      setCategories((current) =>
        current.filter((item) => item.id !== category.id)
      );

      setMessage("Category deleted.");
    } catch (error) {
      console.error(error);
      setMessage("Unable to delete category.");
    }
  }

  async function moveCategory(
    category: RentalCategory,
    direction: "up" | "down"
  ) {
    const index = categories.findIndex((item) => item.id === category.id);

    if (index < 0) return;

    const targetIndex =
      direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const current = [...categories];
    const target = current[targetIndex];

    current[index] = target;
    current[targetIndex] = category;

    const reordered = current.map((item, position) => ({
      ...item,
      homepageOrder: position + 1,
    }));

    setCategories(reordered);

    try {
      await Promise.all(
        reordered.map((item) =>
          updateCategory(item.id, {
            homepageOrder: item.homepageOrder,
          })
        )
      );
    } catch (error) {
      console.error(error);
      setMessage("Unable to save the new order.");
      await loadCategories();
    }
  }

  async function seedCategories() {
    const confirmed = window.confirm(
      "Create the 30 default REIS categories? Existing categories will not be changed."
    );

    if (!confirmed) return;

    setSaving(true);
    setMessage("");

    try {
      const existingNames = new Set(
        categories.map((category) => category.name.toLowerCase())
      );

      const missing = defaultCategories.filter(
        (category) =>
          !existingNames.has(category.name.toLowerCase())
      );

      const created = await Promise.all(
        missing.map((category) => createCategory(category))
      );

      const newCategories = missing.map((category, index) => ({
        ...category,
        id: created[index].id,
      }));

      setCategories((current) => [...current, ...newCategories]);
      setMessage(`${newCategories.length} categories added.`);
    } catch (error) {
      console.error(error);
      setMessage("Unable to seed categories.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="categories-page">
        <div className="categories-loading">Loading categories...</div>
      </main>
    );
  }

  return (
    <main className="categories-page">
      <header className="categories-header">
        <div>
          <p className="categories-eyebrow">REIS EVENT</p>
          <h1>Categories</h1>
          <p>
            Organise the rental catalogue and choose which categories
            appear on the homepage.
          </p>
        </div>

        <div className="categories-header-actions">
          <button
            className="categories-secondary-button"
            type="button"
            onClick={seedCategories}
            disabled={saving}
          >
            Add Default Categories
          </button>

          <button
            className="categories-primary-button"
            type="button"
            onClick={openNewCategory}
          >
            <Plus size={17} />
            Add Category
          </button>
        </div>
      </header>

      {message && (
        <div className="categories-message">
          {message}
        </div>
      )}

      <section className="categories-summary">
        <div>
          <strong>{categories.length}</strong>
          <span>Total categories</span>
        </div>

        <div>
          <strong>
            {categories.filter((item) => item.active).length}
          </strong>
          <span>Active</span>
        </div>

        <div>
          <strong>
            {
              categories.filter(
                (item) => item.featuredOnHomepage
              ).length
            }
          </strong>
          <span>Homepage featured</span>
        </div>
      </section>

      {showForm && (
        <section className="category-form-card">
          <div className="category-form-header">
            <div>
              <p className="categories-eyebrow">
                {editing ? "EDIT CATEGORY" : "NEW CATEGORY"}
              </p>
              <h2>
                {editing
                  ? `Edit ${editing.name}`
                  : "Create a category"}
              </h2>
            </div>

            <button
              className="icon-button"
              type="button"
              onClick={closeForm}
              disabled={saving}
              aria-label="Close"
            >
              <X size={19} />
            </button>
          </div>

          <form onSubmit={saveCategory}>
            <div className="category-form-grid">
              <label>
                <span>Name</span>
                <input
                  value={form.name}
                  onChange={(event) => {
                    const name = event.target.value;
                    setForm((current) => ({
                      ...current,
                      name,
                      slug:
                        current.slug === slugify(current.name) ||
                        !current.slug
                          ? slugify(name)
                          : current.slug,
                    }));
                  }}
                  placeholder="e.g. Chiavari Chairs"
                />
              </label>

              <label>
                <span>Slug</span>
                <input
                  value={form.slug}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      slug: slugify(event.target.value),
                    }))
                  }
                  placeholder="chiavari-chairs"
                />
              </label>

              <label className="full-width">
                <span>Description</span>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Short description for this category"
                  rows={3}
                />
              </label>

              <label className="full-width">
                <span>Category image URL</span>
                <input
                  value={form.imageUrl}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      imageUrl: event.target.value,
                    }))
                  }
                  placeholder="Image URL"
                />
              </label>

              <label>
                <span>Destination type</span>
                <select
                  value={form.destinationType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      destinationType:
                        event.target.value as RentalCategory["destinationType"],
                    }))
                  }
                >
                  <option value="category">
                    Rental category
                  </option>
                  <option value="rental">
                    Specific rental
                  </option>
                  <option value="custom">
                    Custom destination
                  </option>
                </select>
              </label>

              <label>
                <span>Destination</span>
                <input
                  value={form.destination}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      destination: event.target.value,
                    }))
                  }
                  placeholder="/rentals?category=chairs"
                />
              </label>

              <label>
                <span>Homepage order</span>
                <input
                  type="number"
                  min="1"
                  value={form.homepageOrder}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      homepageOrder:
                        Number(event.target.value) || 999,
                    }))
                  }
                />
              </label>

              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      active: event.target.checked,
                    }))
                  }
                />
                <span>Category is active</span>
              </label>

              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={form.featuredOnHomepage}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      featuredOnHomepage:
                        event.target.checked,
                    }))
                  }
                />
                <span>Show on homepage</span>
              </label>
            </div>

            <div className="category-form-actions">
              <button
                type="button"
                className="categories-secondary-button"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="categories-primary-button"
                disabled={saving}
              >
                <Save size={17} />
                {saving ? "Saving..." : "Save Category"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="category-list">
        <div className="category-list-header">
          <div>
            <p className="categories-eyebrow">CATALOGUE</p>
            <h2>Rental categories</h2>
          </div>
          <span>{categories.length} categories</span>
        </div>

        {categories.map((category, index) => (
          <article
            className={`category-row ${
              !category.active ? "inactive" : ""
            }`}
            key={category.id}
          >
            <div className="category-order">
              <span>{String(index + 1).padStart(2, "0")}</span>

              <div className="order-buttons">
                <button
                  type="button"
                  onClick={() => moveCategory(category, "up")}
                  disabled={index === 0}
                  aria-label="Move up"
                >
                  <ArrowUp size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => moveCategory(category, "down")}
                  disabled={index === categories.length - 1}
                  aria-label="Move down"
                >
                  <ArrowDown size={15} />
                </button>
              </div>
            </div>

            <div className="category-image">
              {category.imageUrl ? (
                <img
                  src={category.imageUrl}
                  alt=""
                />
              ) : (
                <span>REIS</span>
              )}
            </div>

            <div className="category-info">
              <div className="category-title-line">
                <h3>{category.name}</h3>

                {!category.active && (
                  <span className="status-badge inactive-badge">
                    Inactive
                  </span>
                )}

                {category.featuredOnHomepage && (
                  <span className="status-badge featured-badge">
                    Homepage
                  </span>
                )}
              </div>

              <p>
                {category.description ||
                  "No category description yet."}
              </p>

              <small>{category.destination}</small>
            </div>

            <div className="category-actions">
              <button
                type="button"
                onClick={() => toggleFeatured(category)}
                title={
                  category.featuredOnHomepage
                    ? "Remove from homepage"
                    : "Show on homepage"
                }
              >
                {category.featuredOnHomepage ? (
                  <Eye size={17} />
                ) : (
                  <EyeOff size={17} />
                )}
              </button>

              <button
                type="button"
                onClick={() => toggleActive(category)}
                title={
                  category.active
                    ? "Deactivate"
                    : "Activate"
                }
              >
                <Check size={17} />
              </button>

              <button
                type="button"
                onClick={() => openEdit(category)}
                title="Edit category"
              >
                <Edit3 size={17} />
              </button>

              <button
                type="button"
                className="danger"
                onClick={() => removeCategory(category)}
                title="Delete category"
              >
                <Trash2 size={17} />
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
