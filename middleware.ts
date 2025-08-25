import { NextRequest, NextResponse } from "next/server";
import { decodeJwt } from "jose";

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Public accessible routes
	const publicRoutes = ["/", "/login", "/signup", "/admin"];

	// Get token from cookie
	const token = request.cookies.get("firebaseAuthToken")?.value;

	// No token, allow access to public routes only
	if (!token) {
		if (publicRoutes.includes(pathname)) {
			return NextResponse.next();
		}
		return NextResponse.redirect(new URL("/", request.url));
	}

	// decode token
	let role: string | undefined;
	try {
		const decodedToken = decodeJwt(token);
		role = decodedToken?.role as string | undefined;
	} catch (err) {
		console.error("Invalid token:", err);
		return NextResponse.redirect(new URL("/", request.url));
	}

	const isAdmin = role === "admin";

	// Block non-admins from accessing /admin/dashboard
	if (pathname.startsWith("/admin/dashboard") && !isAdmin) {
		return NextResponse.redirect(new URL("/dashboard", request.url));
	}

	// Block admins from accessing regular dashboard
	if (pathname.startsWith("/dashboard") && isAdmin) {
		return NextResponse.redirect(new URL("/admin/dashboard", request.url));
	}

	// Prevent authenticated users from accessing public routes
	if (publicRoutes.includes(pathname)) {
		if (isAdmin && pathname !== "/admin/dashboard") {
			return NextResponse.redirect(new URL("/admin/dashboard", request.url));
		}
		if (!isAdmin && pathname !== "/dashboard") {
			return NextResponse.redirect(new URL("/dashboard", request.url));
		}
	}

	// All checks passed
	return NextResponse.next();
}

export const config = {
	matcher: [
		"/",
		"/dashboard/:path*",
		"/admin/:path*",
		"/program-head:path*",
		"/faculty:path*",
		"/dean:path*",
		"/login",
		"/signup",
		"/admin",
	],
};
