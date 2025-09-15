import { ReactNode } from "react";
import { useAuth } from "@/context/auth";

export type AppRole = "admin" | "program-head" | "faculty" | "dean";

// Basic mapping of top-level route segments to roles
export const routeRoleMap: { pattern: RegExp; role: AppRole }[] = [
	{ pattern: /^\/admin(\/|$)/, role: "admin" },
	{ pattern: /^\/program-head(\/|$)/, role: "program-head" },
	{ pattern: /^\/faculty(\/|$)/, role: "faculty" },
	{ pattern: /^\/dean(\/|$)/, role: "dean" },
];

export const matchRequiredRole = (pathname: string): AppRole | null => {
	for (const entry of routeRoleMap) {
		if (entry.pattern.test(pathname)) return entry.role;
	}
	return null;
};

export const RoleGate = ({
	required,
	children,
	fallback,
}: {
	required: AppRole | AppRole[];
	children: ReactNode;
	fallback?: ReactNode;
}) => {
	const auth = useAuth();
	const roles = Array.isArray(required) ? required : [required];
	if (!auth?.user || auth.loading) return fallback ?? null;
	const claimRole = (auth.customClaims?.role as string) || "faculty";
	if (roles.includes(claimRole as AppRole)) return children as ReactNode;
	return fallback ?? null;
};
