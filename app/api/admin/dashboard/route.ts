import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/admin/server-auth";

export const dynamic = "force-dynamic";

type BookingRecord = {
  reference?: string;
  customer?: {
    name?: string;
  };
  event?: {
    date?: string;
  };
  status?: string;
  paymentStatus?: string;
  total?: number;
  createdAt?: string | { toDate?: () => Date };
  items?: Array<{
    type?: string;
    quantity?: number;
  }>;
};

function dateFrom(value: unknown): Date | null {
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    const date = value.toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function money(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : 0;
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const db = getAdminDb();
    const now = new Date();
    const firstMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1)
    );

    const startKey = firstMonth.toISOString();

    const [bookingSnapshot, productSnapshot, categorySnapshot] =
      await Promise.all([
        db.collection("bookings")
          .where("createdAt", ">=", startKey)
          .get(),
        db.collection("products").get(),
        db.collection("categories").get(),
      ]);

    const bookings = bookingSnapshot.docs.map(
      (document) => ({
        id: document.id,
        ...document.data(),
      }) as BookingRecord & { id: string }
    );

    const months = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(
        Date.UTC(
          firstMonth.getUTCFullYear(),
          firstMonth.getUTCMonth() + index,
          1
        )
      );

      return {
        key: `${date.getUTCFullYear()}-${String(
          date.getUTCMonth() + 1
        ).padStart(2, "0")}`,
        label: monthLabel(date),
        requests: 0,
        confirmed: 0,
        revenue: 0,
      };
    });

    const monthMap = new Map(months.map((month) => [month.key, month]));

    let pending = 0;
    let confirmed = 0;
    let completed = 0;
    let cancelled = 0;
    let paidRevenue = 0;
    let paidBookingCount = 0;
    let equipmentRequests = 0;
    let tentRequests = 0;
    let stylingRequests = 0;

    for (const booking of bookings) {
      const created = dateFrom(booking.createdAt);
      const key = created
        ? `${created.getUTCFullYear()}-${String(
            created.getUTCMonth() + 1
          ).padStart(2, "0")}`
        : "";

      const month = monthMap.get(key);
      const status = (booking.status || "").toLowerCase();
      const paymentStatus = (booking.paymentStatus || "").toLowerCase();

      if (month) {
        month.requests += 1;
      }

      if (["pending_review", "pending", "awaiting_review"].includes(status)) {
        pending += 1;
      }

      if (["confirmed", "approved"].includes(status)) {
        confirmed += 1;
        if (month) month.confirmed += 1;
      }

      if (["completed", "fulfilled"].includes(status)) {
        completed += 1;
      }

      if (["cancelled", "canceled", "rejected"].includes(status)) {
        cancelled += 1;
      }

      if (paymentStatus === "paid") {
        const amount = money(booking.total);
        paidRevenue += amount;
        paidBookingCount += 1;
        if (month) month.revenue += amount;
      }

      const types = new Set(
        (booking.items || []).map((item) => (item.type || "").toLowerCase())
      );

      if (types.has("tent") || types.has("marquee")) {
        tentRequests += 1;
      }

      if (types.has("styling")) {
        stylingRequests += 1;
      }

      if (
        types.has("rental") ||
        types.has("equipment") ||
        types.has("product")
      ) {
        equipmentRequests += 1;
      }
    }

    const activeProducts = productSnapshot.docs.filter(
      (document) => document.data().active === true
    ).length;

    const activeCategories = categorySnapshot.docs.filter(
      (document) => document.data().active === true
    ).length;

    const recentBookings = [...bookings]
      .sort((a, b) => {
        const dateA = dateFrom(a.createdAt)?.getTime() || 0;
        const dateB = dateFrom(b.createdAt)?.getTime() || 0;
        return dateB - dateA;
      })
      .slice(0, 6)
      .map((booking) => ({
        id: booking.id,
        reference: booking.reference || booking.id,
        customerName: booking.customer?.name || "Customer",
        eventDate: booking.event?.date || "",
        status: booking.status || "unknown",
        paymentStatus: booking.paymentStatus || "unknown",
        total: money(booking.total),
        createdAt: dateFrom(booking.createdAt)?.toISOString() || null,
      }));

    return NextResponse.json({
      period: {
        start: firstMonth.toISOString(),
        end: now.toISOString(),
      },
      summary: {
        bookingRequests: bookings.length,
        pending,
        confirmed,
        completed,
        cancelled,
        paidRevenue,
        paidBookingCount,
        activeProducts,
        activeCategories,
      },
      monthly: months,
      services: [
        { name: "Equipment rentals", requests: equipmentRequests },
        { name: "Tent & marquee", requests: tentRequests },
        { name: "Styling", requests: stylingRequests },
      ],
      recentBookings,
      currency: "GBP",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Please sign in again." },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "You do not have permission to view these figures." },
        { status: 403 }
      );
    }

    console.error("Admin dashboard statistics failed:", error);

    return NextResponse.json(
      { error: "We could not load the business overview. Please try again." },
      { status: 500 }
    );
  }
}
