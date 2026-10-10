import { revalidatePath } from "next/cache";

/**
 * Safely calls Next.js revalidatePath without throwing when invoked
 * outside an active incoming request scope (e.g. background tasks or test suites).
 */
export function safeRevalidatePath(originalPath: string) {
  try {
    revalidatePath(originalPath);
  } catch {
    // Gracefully ignore outside Next.js request context
  }
}
