import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const protectedPrefixes = ["/dashboard", "/admin"];

async function getProfileRole(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("middleware.getProfileRole", error);
    return null;
  }

  const role = data?.role;
  return typeof role === "string" ? role : null;
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => {
          response.cookies.set({ name, value, ...options });
        },
        remove: (name, options) => {
          response.cookies.set({ name, value: "", ...options });
        }
      }
    }
  );

  const { data } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/register") && data.user) {
    const role = await getProfileRole(supabase, data.user.id);
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (role === "family") {
      return NextResponse.redirect(new URL("/dashboard/family", request.url));
    }
    if (role === "nurse") {
      return NextResponse.redirect(new URL("/dashboard/nurse", request.url));
    }
  }

  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  if (!isProtected) return response;

  if (!data.user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = await getProfileRole(supabase, data.user.id);

  if (pathname.startsWith("/admin")) {
    if (role !== "admin") {
      if (role === "family") {
        return NextResponse.redirect(new URL("/dashboard/family", request.url));
      }
      if (role === "nurse") {
        return NextResponse.redirect(new URL("/dashboard/nurse", request.url));
      }
      return NextResponse.redirect(new URL("/login?error=no_profile", request.url));
    }
    return response;
  }

  if (pathname.startsWith("/dashboard/family") && role && role !== "family" && role !== "admin") {
    if (role === "nurse") {
      return NextResponse.redirect(new URL("/dashboard/nurse", request.url));
    }
    return NextResponse.redirect(new URL("/login?error=no_profile", request.url));
  }

  if (pathname.startsWith("/dashboard/nurse") && role && role !== "nurse" && role !== "admin") {
    if (role === "family") {
      return NextResponse.redirect(new URL("/dashboard/family", request.url));
    }
    return NextResponse.redirect(new URL("/login?error=no_profile", request.url));
  }

  if (role === "admin" && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/register"]
};
