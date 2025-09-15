"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/auth";

/**
 * useRequireAuth
 * Central route-level guard that mirrors middleware decisions client-side to prevent UI flashes
 * and consolidates redirect logic.
 */
export const useRequireAuth = ({
	allowWhenAuthenticated = true,
	publicOnly = false,
}: {
	// if false, redirect authenticated users away (login/signup pages)
	allowWhenAuthenticated?: boolean;
	publicOnly?: boolean;
} = {}) => {
	const router = useRouter();
	const pathname = usePathname();
	const auth = useAuth();

	useEffect(() => {
		if (!auth) return;
		if (auth.loading || auth.loggingOut) return;

		const user = auth.user;

		// Public-only (e.g., login) but user is authenticated
		if (publicOnly && user) {
			router.replace("/dashboard");
			return;
		}

		// Protected path but no user
		if (!publicOnly && !user) {
			router.replace("/login");
			return;
		}
		// Include 'auth' directly to satisfy exhaustive-deps; derived values accessed inside
	}, [auth, router, pathname, publicOnly, allowWhenAuthenticated]);
};
