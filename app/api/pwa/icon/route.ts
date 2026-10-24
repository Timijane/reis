import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const size = url.searchParams.get("size") === "512" ? 512 : 192;
  const fallback = new URL(`/icons/icon-${size}.png`, url.origin);

  try {
    const snapshot = await getAdminDb()
      .doc("siteContent/homepage")
      .get();

    const logoUrl = snapshot.data()?.logoUrl;

    if (
      typeof logoUrl !== "string" ||
      !/^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//i.test(
        logoUrl
      )
    ) {
      return NextResponse.redirect(fallback);
    }

    const transformedUrl = logoUrl.replace(
      "/image/upload/",
      `/image/upload/c_pad,w_${size},h_${size},b_transparent,f_png/`
    );

    const imageResponse = await fetch(transformedUrl, {
      cache: "no-store",
      redirect: "error",
    });

    if (!imageResponse.ok) {
      return NextResponse.redirect(fallback);
    }

    return new Response(await imageResponse.arrayBuffer(), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=300, s-maxage=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Failed to generate REIS PWA icon:", error);
    return NextResponse.redirect(fallback);
  }
}
