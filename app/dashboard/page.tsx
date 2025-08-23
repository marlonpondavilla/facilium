"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth";
import toast from "react-hot-toast";

const DashboardRedirectPage = () => {
	const router = useRouter();
	const auth = useAuth();

	const loading = auth?.loading ?? true;
	const customClaims = auth?.customClaims ?? null;

	useEffect(() => {
		if (!loading && customClaims?.role) {
			if (customClaims.role === "") {
				router.push("/faculty");
				return;
			} else if (customClaims.role === "program-head") {
				router.push("/program-head");
				console.log(customClaims.role);
				return;
			} else if (customClaims.role === "faculty") {
				router.push("/faculty");
				console.log(customClaims.role);
				return;
			} else if (customClaims.role === "dean") {
				router.push("/dean");
				console.log(customClaims.role);
				return;
			} else if (customClaims.role === "admin") {
				toast.error("Admins cannot access user page.");
				auth?.logout();
			} else {
				router.refresh();
			}
		}
	}, [loading, customClaims, router]);

	if (loading || !customClaims) {
		return <p>Redirecting...</p>;
	}

	return null;
};

export default DashboardRedirectPage;
