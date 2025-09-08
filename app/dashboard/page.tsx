"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth";
import toast from "react-hot-toast";
import { assignDesignationByUid } from "@/data/actions";

const DashboardRedirectPage = () => {
	const router = useRouter();
	const auth = useAuth();

	const loading = auth?.loading ?? true;
	const customClaims = auth?.customClaims ?? null;
	const user = auth?.user;

	useEffect(() => {
		const handleRedirectAndAssign = async () => {
			if (!loading && customClaims?.role) {
				const role = customClaims.role;

				if (role === "") {
					router.push("/faculty");
					return;
				} else if (role === "program-head") {
					router.push("/program-head");
					return;
				} else if (role === "faculty") {
					router.push("/faculty");
					return;
				} else if (role === "dean") {
					if (user?.uid) {
						try {
							// forcing to assign dean designation even change in firebase
							await assignDesignationByUid({ uid: user.uid, role: "Dean" });
						} catch (error) {
							console.error("Failed to assign dean designation:", error);
							toast.error("Failed to sync designation. Please try again.");
						}
					}
					router.push("/dean");
					return;
				} else if (role === "admin") {
					toast.error("Admins cannot access user page.");
					auth?.logout();
					return;
				} else {
					router.refresh();
				}
			}
		};

		handleRedirectAndAssign();
	}, [loading, customClaims, router, user, auth]);

	if (loading || !customClaims) {
		return <p>Redirecting...</p>;
	}

	return (
		<p className="text-center">Welcome to facilium please reload the page</p>
	);
};

export default DashboardRedirectPage;
