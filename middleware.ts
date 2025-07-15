import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { decodeJwt } from "jose";

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const publicRoutes = ["/", "/login", "/signup", "/admin"];

	const cookieStore = await cookies();
	const token = cookieStore.get("firebaseAuthToken")?.value;

	if (!token) {
		// routes that can be accessed if no auth user
		if (publicRoutes.includes(pathname)) {
			return NextResponse.next();
		}

		return NextResponse.redirect(new URL("/", request.url));
	}

	const decodedToken = decodeJwt(token);

	// force auth user to redirect in their routes
	if (publicRoutes.includes(pathname) && !decodedToken.admin) {
		return NextResponse.redirect(new URL("/dashboard", request.url));
	}

	// if (decodedToken.admin) {
	// 	return NextResponse.redirect(new URL("/admin"));
	// }

	return NextResponse.next();
}

export const config = {
	matcher: ["/", "/dashboard/:path*", "/admin/:path*", "/login", "/signup"],
};
