import { type NextRequest, NextResponse } from "next/server";

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

export async function middleware(request: NextRequest) {
  const hasAuthCookie = getSupabaseAuthCookieNames(request).length > 0;

  if (!hasAuthCookie) {
    if (request.nextUrl.pathname === "/") return redirectToLogin(request);
    return NextResponse.next({ request });
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    "/((?!login|auth/callback|_next/static|_next/image|favicon.ico|manifest.webmanifest|OneSignalSDKWorker.js|OneSignalSDKUpdaterWorker.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
