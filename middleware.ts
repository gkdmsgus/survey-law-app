import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isApiProtected =
    req.nextUrl.pathname.startsWith("/api/favorites") ||
    req.nextUrl.pathname.startsWith("/api/notifications");

  if (isApiProtected && !req.auth) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/api/favorites/:path*", "/api/notifications/:path*"],
};
