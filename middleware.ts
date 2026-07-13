import { type NextRequest, NextResponse } from "next/server";

function isSupabaseAuthCookie(name: string) {
  return /^sb-.+-auth-token(?:\.\d+)?$/.test(name);
}

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies.getAll().some((cookie) => isSupabaseAuthCookie(cookie.name));
}

function redirectToLogin(request: NextRequest) {
  const login = request.nextUrl.clone();
  login.pathname = "/login";
  login.search = "";
  return NextResponse.redirect(login);
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hasAuthCookie = hasSupabaseAuthCookie(request);

  if (pathname === "/" && !hasAuthCookie) {
    return redirectToLogin(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
