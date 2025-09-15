"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth";
import toast from "react-hot-toast";
import { assignDesignationByUid } from "@/data/actions";

const AdminRedirectPage = () => {
	const router = useRouter();
	const auth = useAuth();
	const user = auth?.user;

	const loading = auth?.loading ?? true;
	const customClaims = auth?.customClaims ?? null;

	useEffect(() => {
		const handleRedirectAssign = async () => {
			if (!loading && customClaims?.role) {
				if (customClaims.role !== "admin") {
					toast.error("Unauthorized access. Please use the correct page.");
					auth?.logout?.();
				} else {
					if (user?.uid) {
						try {
							// forcing to assign dean designation even change in firebase
							await assignDesignationByUid({ uid: user.uid, role: "Admin" });
						} catch (error) {
							console.error("Failed to assign dean designation:", error);
							toast.error("Failed to sync designation. Please try again.");
						}
					}
					router.push("/admin/dashboard");
					console.log(customClaims.role);
					return;
				}
			}
		};
		handleRedirectAssign();
	}, [loading, customClaims, router, auth, user?.uid]);

	if (loading || !customClaims) {
		return <p>Redirecting...</p>;
	}

	return null;
};

export default AdminRedirectPage;
