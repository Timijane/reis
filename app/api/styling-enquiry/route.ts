import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { verifyCustomerToken } from "@/lib/customer/server-auth";

export const runtime = "nodejs";

const MAX_IMAGES = 8;

function clean(value: unknown, max = 2000): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function validImages(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= MAX_IMAGES &&
    value.every((url) => {
      if (typeof url !== "string" || url.length > 2000) return false;

      try {
        const parsed = new URL(url);

        return (
          parsed.protocol === "https:" &&
          parsed.hostname === "res.cloudinary.com"
        );
      } catch {
        return false;
      }
    })
  );
}

export async function POST(request: Request) {
  const identity = await verifyCustomerToken(request);

  if (!identity?.uid || !identity.email) {
    return NextResponse.json(
      { error: "Please sign in to submit a styling enquiry." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const name = clean(body.name, 120);
    const submittedEmail = clean(body.email, 254).toLowerCase();
    const email = identity.email.trim().toLowerCase();
    const phone = clean(body.phone, 40);
    const eventDate = clean(body.eventDate, 20);
    const eventType = clean(body.eventType, 80);
    const venue = clean(body.venue, 200);
    const description = clean(body.description, 5000);

    if (!name || !submittedEmail || !phone || !eventDate || !venue || !description) {
      return NextResponse.json(
        { error: "Please complete all required fields." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submittedEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (submittedEmail !== email) {
      return NextResponse.json(
        { error: "Your submitted email must match your signed-in account." },
        { status: 403 }
      );
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(eventDate) ||
      Number.isNaN(Date.parse(`${eventDate}T00:00:00Z`))
    ) {
      return NextResponse.json(
        { error: "Please provide a valid event date." },
        { status: 400 }
      );
    }

    const venuePhotos = body.venuePhotos ?? [];
    const inspirationImages = body.inspirationImages ?? [];

    if (
      !validImages(venuePhotos) ||
      !validImages(inspirationImages) ||
      venuePhotos.length + inspirationImages.length > MAX_IMAGES
    ) {
      return NextResponse.json(
        { error: "Please upload no more than eight valid images." },
        { status: 400 }
      );
    }

    const dimensions = {
      length: clean(body.length, 30),
      width: clean(body.width, 30),
      height: clean(body.height, 30),
    };

    const reference = `STY-${Date.now().toString(36).toUpperCase()}`;

    const record = {
      reference,
      customerUid: identity.uid,
      customerEmailNormalized: email,
      name,
      email,
      phone,
      eventDate,
      eventType: eventType || "Other",
      venue,
      description,
      venuePhotos,
      inspirationImages,
      dimensions,
      status: "new",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await getAdminDb().collection("stylingEnquiries").add(record);

    return NextResponse.json(
      {
        success: true,
        reference,
        message: "Your styling enquiry has been received.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Styling enquiry submission failed:", error);

    return NextResponse.json(
      { error: "We could not submit your enquiry. Please try again." },
      { status: 500 }
    );
  }
}
