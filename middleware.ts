import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
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

function redirectToLogin(request: NextRequest) {
  const login = request.nextUrl.clone();
  login.pathname = "/login";
  login.search = "";
  return NextResponse.redirect(login);
}

function redirectToHome(request: NextRequest) {
  const home = request.nextUrl.clone();
  home.pathname = "/";
  home.search = "";
  return NextResponse.redirect(home);
}

function clearSupabaseAuthCookies(request: NextRequest, response: NextResponse) {
  getSupabaseAuthCookieNames(request).forEach((name) => {
    request.cookies.delete(name);
    response.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
    });
  });
}

function isLoginPath(pathname: string) {
  return pathname === "/login";
}

function isProtectedPath(pathname: string) {
  return pathname === "/";
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hasAuthCookie = getSupabaseAuthCookieNames(request).length > 0;

  if (!hasAuthCookie) {
    if (isProtectedPath(pathname)) return redirectToLogin(request);
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
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
    clearSupabaseAuthCookies(request, response);
    if (isProtectedPath(pathname)) {
      const redirectResponse = redirectToLogin(request);
      clearSupabaseAuthCookies(request, redirectResponse);
      return redirectResponse;
    }

    return response;
  }

  if (isLoginPath(pathname)) {
    return redirectToHome(request);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!auth/callback|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|OneSignalSDKWorker.js|OneSignalSDKUpdaterWorker.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
