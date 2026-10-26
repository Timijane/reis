import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toIsoDate(value: unknown): string | null {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }

  return null;
}

export async function GET() {
  try {
    const snapshot = await getAdminDb()
      .collection("servicePortfolio")
      .get();

    const projects = snapshot.docs
      .map((document) => {
        const data = document.data();

        const images = Array.isArray(data.images)
          ? data.images
              .filter(
                (image: unknown) =>
                  !!image &&
                  typeof image === "object" &&
                  typeof (image as { url?: unknown }).url === "string" &&
                  (image as { url: string }).url.startsWith(
                    "https://res.cloudinary.com/"
                  )
              )
              .map((image: Record<string, unknown>) => ({
                url: image.url,
                format:
                  typeof image.format === "string" ? image.format : undefined,
                width:
                  typeof image.width === "number" ? image.width : undefined,
                height:
                  typeof image.height === "number" ? image.height : undefined,
              }))
          : [];

        return {
          id: document.id,
          title: typeof data.title === "string" ? data.title : "",
          description:
            typeof data.description === "string" ? data.description : "",
          status: data.status,
          publishedAt: toIsoDate(data.publishedAt),
          images,
        };
      })
      .filter(
        (project) =>
          project.status === "published" &&
          project.title.trim().length > 0 &&
          project.description.trim().length > 0 &&
          project.images.length >= 2
      )
      .sort((a, b) => {
        const aTime = a.publishedAt ? Date.parse(a.publishedAt) : 0;
        const bTime = b.publishedAt ? Date.parse(b.publishedAt) : 0;
        return bTime - aTime;
      })
      .slice(0, 50)
      .map(({ status: _status, publishedAt: _publishedAt, ...project }) => project);

    return NextResponse.json(
      { projects },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("Public service portfolio API error:", error);

    return NextResponse.json(
      { error: "Completed projects are temporarily unavailable." },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
