import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || "case-photos";
    const customPath = formData.get("path") as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Limit checks: 15MB max
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File exceeds 15MB limit" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabase();

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Supabase storage is not configured" },
        { status: 503 }
      );
    }

    const serviceClient = createServiceClient() || supabase;
    const fileExt = file.name.split(".").pop();
    const filePath = customPath || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    const { data, error } = await serviceClient.storage
      .from(bucket)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error("Storage upload error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Get URL
    if (bucket === "case-photos" || bucket === "case-videos") {
      const { data: publicData } = serviceClient.storage.from(bucket).getPublicUrl(data.path);
      return NextResponse.json({
        success: true,
        url: publicData.publicUrl,
        path: data.path,
        size: file.size,
      });
    }

    // Signed URL for documents
    const { data: signedData, error: signErr } = await serviceClient.storage
      .from(bucket)
      .createSignedUrl(data.path, 60 * 60 * 24 * 365);

    if (signErr) {
      return NextResponse.json({ success: false, error: signErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      url: signedData.signedUrl,
      path: data.path,
      size: file.size,
    });
  } catch (err: unknown) {
    console.error("Upload API route error:", err);
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
