import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/admin/server-auth";

export const runtime = "nodejs";

const statuses = [
  "new",
  "reviewing",
  "quoted",
  "booked",
  "completed",
  "declined",
] as const;

function errorResponse(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  if (error instanceof Error && error.message === "FORBIDDEN") {
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 }
    );
  }

  console.error("Styling enquiries API error:", error);

  return NextResponse.json(
    { error: "Unable to process styling enquiries." },
    { status: 500 }
  );
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const snapshot = await getAdminDb()
      .collection("stylingEnquiries")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const enquiries = snapshot.docs.map((document) => {
      const data = document.data();

      return {
        id: document.id,
        ...data,
        createdAt:
          data.createdAt?.toDate?.()?.toISOString?.() ?? null,
        updatedAt:
          data.updatedAt?.toDate?.()?.toISOString?.() ?? null,
      };
    });

    return NextResponse.json({ enquiries });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin(request);

    const body = await request.json();

    const id = typeof body.id === "string" ? body.id.trim() : "";
    const status =
      typeof body.status === "string" ? body.status.trim() : undefined;
    const notes =
      typeof body.notes === "string" ? body.notes.trim() : undefined;

    if (!id || id.length > 150) {
      return NextResponse.json(
        { error: "A valid enquiry ID is required." },
        { status: 400 }
      );
    }

    if (status === undefined && notes === undefined) {
      return NextResponse.json(
        { error: "Provide a status or administrative note to update." },
        { status: 400 }
      );
    }

    if (status !== undefined && !statuses.includes(status as typeof statuses[number])) {
      return NextResponse.json(
        { error: "Invalid enquiry status." },
        { status: 400 }
      );
    }

    if (notes !== undefined && notes.length > 5000) {
      return NextResponse.json(
        { error: "Notes cannot exceed 5,000 characters." },
        { status: 400 }
      );
    }

    const reference = getAdminDb().collection("stylingEnquiries").doc(id);
    const existing = await reference.get();

    if (!existing.exists) {
      return NextResponse.json(
        { error: "Styling enquiry not found." },
        { status: 404 }
      );
    }

    const updates: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.adminNotes = notes;

    await reference.update(updates);

    return NextResponse.json({
      success: true,
      message: "Enquiry updated successfully.",
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
