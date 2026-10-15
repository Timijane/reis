import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/admin/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLLECTION = "servicePortfolio";
const MAX_IMAGES = 10;
const MIN_IMAGES = 2;
const MAX_TOTAL_BYTES = 15 * 1024 * 1024;
const ALLOWED_FORMATS = new Set(["jpg", "jpeg", "png", "webp"]);

type PortfolioImage = {
  url: string;
  publicId: string;
  bytes: number;
  format: string;
  width?: number;
  height?: number;
};

type PortfolioStatus = "draft" | "published";

function errorResponse(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  if (error instanceof Error && error.message === "FORBIDDEN") {
    return NextResponse.json(
      { error: "Administrator access required." },
      { status: 403 }
    );
  }

  console.error("Service portfolio API error:", error);

  return NextResponse.json(
    { error: "Unable to process the portfolio request." },
    { status: 500 }
  );
}

function validateImages(value: unknown): PortfolioImage[] | null {
  if (!Array.isArray(value)) return null;
  if (value.length < MIN_IMAGES || value.length > MAX_IMAGES) return null;

  const images: PortfolioImage[] = [];
  let totalBytes = 0;

  for (const item of value) {
    if (!item || typeof item !== "object") return null;

    const image = item as Record<string, unknown>;
    const url = typeof image.url === "string" ? image.url.trim() : "";
    const publicId =
      typeof image.publicId === "string" ? image.publicId.trim() : "";
    const format =
      typeof image.format === "string"
        ? image.format.trim().toLowerCase()
        : "";
    const bytes = image.bytes;

    if (!url || !publicId || !ALLOWED_FORMATS.has(format)) return null;

    try {
      const parsed = new URL(url);

      if (
        parsed.protocol !== "https:" ||
        parsed.hostname !== "res.cloudinary.com" ||
        parsed.username ||
        parsed.password
      ) {
        return null;
      }
    } catch {
      return null;
    }

    if (
      typeof bytes !== "number" ||
      !Number.isSafeInteger(bytes) ||
      bytes <= 0 ||
      bytes > MAX_TOTAL_BYTES
    ) {
      return null;
    }

    if (publicId.length > 300) return null;

    totalBytes += bytes;

    if (totalBytes > MAX_TOTAL_BYTES) return null;

    const result: PortfolioImage = {
      url,
      publicId,
      bytes,
      format,
    };

    for (const dimension of ["width", "height"] as const) {
      const number = image[dimension];

      if (
        typeof number === "number" &&
        Number.isSafeInteger(number) &&
        number > 0 &&
        number <= 30000
      ) {
        result[dimension] = number;
      }
    }

    images.push(result);
  }

  return images;
}

function validateText(
  value: unknown,
  maximum: number,
  required = false
): string | null {
  if (typeof value !== "string") return null;

  const text = value.trim();

  if ((required && !text) || text.length > maximum) return null;

  return text;
}

function serializeDocument(id: string, data: Record<string, any>) {
  return {
    id,
    title: data.title ?? "",
    description: data.description ?? "",
    category: data.category ?? "",
    images: Array.isArray(data.images) ? data.images : [],
    status: data.status ?? "draft",
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? null,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() ?? null,
    publishedAt: data.publishedAt?.toDate?.()?.toISOString?.() ?? null,
  };
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const snapshot = await getAdminDb()
      .collection(COLLECTION)
      .orderBy("updatedAt", "desc")
      .limit(200)
      .get();

    const projects = snapshot.docs.map((document) =>
      serializeDocument(document.id, document.data())
    );

    return NextResponse.json({ projects });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const body = await request.json();

    const title = validateText(body.title, 120, true);
    const description = validateText(body.description, 5000, true);
    const category = validateText(body.category, 100, true);
    const images = validateImages(body.images);

    if (!title || !description || !category || !images) {
      return NextResponse.json(
        {
          error:
            "Provide a title, description, category and 2–10 valid images. The combined image size must not exceed 15 MB.",
        },
        { status: 400 }
      );
    }

    const status: PortfolioStatus =
      body.status === "published" ? "published" : "draft";

    const now = FieldValue.serverTimestamp();

    const record = {
      title,
      description,
      category,
      images,
      status,
      createdBy: admin.uid,
      createdAt: now,
      updatedAt: now,
      publishedAt: status === "published" ? now : null,
    };

    const reference = await getAdminDb()
      .collection(COLLECTION)
      .add(record);

    return NextResponse.json(
      {
        success: true,
        project: {
          id: reference.id,
          title,
          description,
          category,
          images,
          status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json();

    const id = typeof body.id === "string" ? body.id.trim() : "";

    if (!id || id.length > 150 || id.includes("/")) {
      return NextResponse.json(
        { error: "A valid project ID is required." },
        { status: 400 }
      );
    }

    const reference = getAdminDb().collection(COLLECTION).doc(id);
    const existing = await reference.get();

    if (!existing.exists) {
      return NextResponse.json(
        { error: "Portfolio project not found." },
        { status: 404 }
      );
    }

    const updates: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if ("title" in body) {
      const title = validateText(body.title, 120, true);

      if (!title) {
        return NextResponse.json(
          { error: "A valid title is required (maximum 120 characters)." },
          { status: 400 }
        );
      }

      updates.title = title;
    }

    if ("description" in body) {
      const description = validateText(body.description, 5000, true);

      if (!description) {
        return NextResponse.json(
          { error: "A valid description is required." },
          { status: 400 }
        );
      }

      updates.description = description;
    }

    if ("category" in body) {
      const category = validateText(body.category, 100, true);

      if (!category) {
        return NextResponse.json(
          { error: "A valid category is required." },
          { status: 400 }
        );
      }

      updates.category = category;
    }

    if ("images" in body) {
      const images = validateImages(body.images);

      if (!images) {
        return NextResponse.json(
          {
            error:
              "Provide 2–10 valid images with a combined size no greater than 15 MB.",
          },
          { status: 400 }
        );
      }

      updates.images = images;
    }

    if ("status" in body) {
      if (body.status !== "draft" && body.status !== "published") {
        return NextResponse.json(
          { error: "Status must be draft or published." },
          { status: 400 }
        );
      }

      updates.status = body.status;
      updates.publishedAt =
        body.status === "published"
          ? FieldValue.serverTimestamp()
          : null;
    }

    await reference.update(updates);

    return NextResponse.json({
      success: true,
      message: "Portfolio project updated successfully.",
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const id = typeof body.id === "string" ? body.id.trim() : "";

    if (!id || id.length > 150 || id.includes("/")) {
      return NextResponse.json(
        { error: "A valid project ID is required." },
        { status: 400 }
      );
    }

    const reference = getAdminDb().collection(COLLECTION).doc(id);
    const existing = await reference.get();

    if (!existing.exists) {
      return NextResponse.json(
        { error: "Portfolio project not found." },
        { status: 404 }
      );
    }

    await reference.delete();

    return NextResponse.json({
      success: true,
      message: "Portfolio project deleted.",
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    return errorResponse(error);
  }
}
