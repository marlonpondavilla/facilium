"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth";
import toast from "react-hot-toast";

const AdminRedirectPage = () => {
	const router = useRouter();
	const auth = useAuth();

	const loading = auth?.loading ?? true;
	const customClaims = auth?.customClaims ?? null;

	useEffect(() => {
		if (!loading && customClaims?.role) {
			if (customClaims.role !== "admin") {
				toast.error("Unauthorized access. Please use the correct page.");
				auth?.logout();
			} else {
				router.push("/admin/dashboard");
				console.log(customClaims.role);
				return;
			}
		}
	}, [loading, customClaims, router]);

	if (loading || !customClaims) {
		return <p>Redirecting...</p>;
	}

	return null;
};

export default AdminRedirectPage;
