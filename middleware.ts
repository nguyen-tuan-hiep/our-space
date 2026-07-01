import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

type CookieToSet = {
  name: string;
  value: string;
  options: Parameters<NextResponse["cookies"]["set"]>[2];
};

function isSupabaseAuthCookie(name: string) {
  return /^sb-.+-auth-token/.test(name);
}

function getSupabaseAuthCookieNames(request: NextRequest) {
  return request.cookies
    .getAll()
    .map((cookie) => cookie.name)
    .filter(isSupabaseAuthCookie);
}

function clearSupabaseAuthCookies(
  request: NextRequest,
  response: NextResponse,
) {
  getSupabaseAuthCookieNames(request).forEach((name) => {
    request.cookies.delete(name);
    response.cookies.delete(name);
  });
}

function redirectToLogin(request: NextRequest) {
  const login = request.nextUrl.clone();
  login.pathname = "/login";
  login.search = "";
  return NextResponse.redirect(login);
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const hasAuthCookie = getSupabaseAuthCookieNames(request).length > 0;

  if (!hasAuthCookie) {
    if (request.nextUrl.pathname === "/") return redirectToLogin(request);
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const login = redirectToLogin(request);
    clearSupabaseAuthCookies(request, login);
    return login;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!login|auth/callback|_next/static|_next/image|favicon.ico|manifest.webmanifest|OneSignalSDKWorker.js|OneSignalSDKUpdaterWorker.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
