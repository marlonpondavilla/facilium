import { NextRequest, NextResponse } from "next/server";
import { decodeJwt } from "jose";

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const publicRoutes = ["/", "/login", "/signup", "/admin"];

	const token = request.cookies.get("firebaseAuthToken")?.value;

	if (!token) {
		// Allow unauthenticated access to public routes
		if (publicRoutes.includes(pathname)) {
			return NextResponse.next();
		}
		// Redirect unauthenticated users to home/login
		return NextResponse.redirect(new URL("/", request.url));
	}

	const decodedToken = decodeJwt(token);

	// Restrict admin dashboard access to admins only
	if (pathname.startsWith("/admin/dashboard") && !decodedToken.admin) {
		return NextResponse.redirect(new URL("/dashboard", request.url));
	}

	// Prevent admin from accessing user dashboard
	if (pathname.startsWith("/dashboard") && decodedToken.admin) {
		return NextResponse.redirect(new URL("/admin/dashboard", request.url));
	}

	// Redirect logged-in users away from public pages
	if (publicRoutes.includes(pathname)) {
		if (decodedToken.admin && pathname !== "/admin/dashboard") {
			return NextResponse.redirect(new URL("/admin/dashboard", request.url));
		} else if (!decodedToken.admin && pathname !== "/dashboard") {
			return NextResponse.redirect(new URL("/dashboard", request.url));
		}
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		"/",
		"/dashboard/:path*",
		"/admin/:path*",
		"/login",
		"/signup",
		"/admin",
	],
};
