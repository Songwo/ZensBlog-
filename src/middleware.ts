import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function hasAuthSession(req: NextRequest) {
  return (
    req.cookies.has("authjs.session-token") ||
    req.cookies.has("__Secure-authjs.session-token") ||
    req.cookies.has("next-auth.session-token") ||
    req.cookies.has("__Secure-next-auth.session-token")
  );
}

export default function middleware(req: NextRequest) {
  const isAdmin = req.nextUrl.pathname.startsWith("/admin");
  const isLogin = req.nextUrl.pathname === "/admin/login";
  const isCommunityCreate = req.nextUrl.pathname.startsWith("/community/new");
  const isApi = req.nextUrl.pathname.startsWith("/api/auth");
  const isAuthed = hasAuthSession(req);

  if (isAdmin && !isLogin && !isApi && !isAuthed) {
    return NextResponse.redirect(new URL("/auth/signin?callbackUrl=/admin", req.url));
  }

  if (isCommunityCreate && !isAuthed) {
    return NextResponse.redirect(new URL("/auth/signin?callbackUrl=/community/new", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/community/new"],
};
