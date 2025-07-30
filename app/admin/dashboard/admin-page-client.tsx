"use client";

import Welcome from "@/components/welcome";
import { useAuth } from "@/context/auth";
import AdminSideBar from "@/components/admin-side-bar";

const AdminPageClient = () => {
	const auth = useAuth();

	return (
		<div>
			{auth?.customClaims?.admin ? (
				<AdminSideBar>
					<h1>Admin</h1>
				</AdminSideBar>
			) : auth?.customClaims?.faculty ? (
				<h1>You are not allowed to view this page please logut</h1>
			) : (
				<>
					<Welcome />
				</>
			)}
		</div>
	);
};

export default AdminPageClient;
