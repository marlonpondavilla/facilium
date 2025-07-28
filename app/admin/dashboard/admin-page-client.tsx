"use client";

import Welcome from "@/components/welcome";
import { useAuth } from "@/context/auth";
import AdminSideBar from "@/components/admin-side-bar";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import BuildingComponent from "./(admin-components)/building-component";
import RolesComponent from "./(admin-components)/roles-component";
import UsersComponent from "./(admin-components)/users-component";
import AdminComponent from "./(admin-components)/admin-component";
import AdminProfile from "./(admin-components)/admin-profile";

const AdminPageClient = () => {
	const auth = useAuth();
	const pathname = usePathname();
	const router = useRouter();

	if (auth?.loading) {
		return (
			<div className="flex items-center justify-center h-screen text-white text-2xl">
				Loading...
			</div>
		);
	}

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
