import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { decodeJwt } from "jose";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;

  if (!token) {
    if (pathname === "/login" || pathname === "/signup") {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/login" || pathname === "/signup" || pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const decodedToken = decodeJwt(token);

  if(decodedToken.admin){
    return NextResponse.redirect(new URL("/admin"))
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/login",
    "/signup"
  ],
};

