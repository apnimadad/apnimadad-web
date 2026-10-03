"use server";

import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Upload a file buffer to Supabase Storage
 * Buckets: case-photos (public), case-docs (private), case-videos (public)
 */
export async function uploadToStorage(
  bucket: "case-photos" | "case-docs" | "case-videos",
  path: string,
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return { success: false, error: "Supabase not configured" };
  }

  const file = formData.get("file") as File | null;
  if (!file) return { success: false, error: "No file provided" };

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });

  if (error) {
    console.error("Upload error:", error);
    return { success: false, error: error.message };
  }

  // Public URL for public buckets
  if (bucket === "case-photos" || bucket === "case-videos") {
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return { success: true, url: urlData.publicUrl };
  }

  // Signed URL for private docs (1 year)
  const { data: signed, error: signErr } = await supabase.storage
    .from(bucket)
    .createSignedUrl(data.path, 60 * 60 * 24 * 365);

  if (signErr) return { success: false, error: signErr.message };
  return { success: true, url: signed.signedUrl };
}
