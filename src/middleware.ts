import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const pathname = request.nextUrl.pathname;

  // 1. Check verified session cookies first (resilient against Supabase offline/network errors)
  const adminSession = request.cookies.get("apni_madad_admin_session");
  const userSession = request.cookies.get("apni_madad_user_session");

  if (pathname.startsWith("/admin")) {
    if (adminSession?.value === "authenticated") {
      return response;
    }
  }

  if (pathname.startsWith("/dashboard")) {
    if (adminSession?.value === "authenticated" || userSession?.value) {
      return response;
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase is not configured, permit session cookie or redirect to login
  if (!url || !key) {
    if (pathname.startsWith("/admin") && adminSession?.value !== "authenticated") {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(redirectUrl);
    }
    return response;
  }

  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    // Refresh auth session safely
    let user = null;
    try {
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } catch {
      // Supabase network unreachable
    }

    // Protect /admin routes
    if (pathname.startsWith("/admin")) {
      if (!user && adminSession?.value !== "authenticated") {
        const redirectUrl = new URL("/login", request.url);
        redirectUrl.searchParams.set("next", pathname);
        return NextResponse.redirect(redirectUrl);
      }

      if (user && adminSession?.value !== "authenticated") {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

          if (profile?.role !== "admin") {
            const redirectUrl = new URL("/dashboard", request.url);
            redirectUrl.searchParams.set("error", "admin_required");
            return NextResponse.redirect(redirectUrl);
          }
        } catch {
          // Keep response
        }
      }
    }

    // Protect /dashboard routes
    if (pathname.startsWith("/dashboard")) {
      if (!user && !userSession?.value && adminSession?.value !== "authenticated") {
        const redirectUrl = new URL("/login", request.url);
        redirectUrl.searchParams.set("next", pathname);
        return NextResponse.redirect(redirectUrl);
      }
    }
  } catch (err) {
    console.warn("Middleware auth error notice:", err);
    if (pathname.startsWith("/admin") && adminSession?.value !== "authenticated") {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
