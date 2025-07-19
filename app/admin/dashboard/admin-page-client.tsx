"use client";

import { Button } from "@/components/ui/button";
import Welcome from "@/components/welcome";
import { useAuth } from "@/context/auth";

const AdminPageClient = () => {
	const auth = useAuth();

	if (auth?.loading) {
		return (
			<div className="flex items-center justify-center h-screen text-white text-2xl">
				Loading...
			</div>
		);
	}

	return (
		<div className="flex flex-col justify-center items-center h-screen text-white text-3xl gap-4 text-center">
			{auth?.customClaims?.admin ? (
				<>
					<p>{auth.user?.displayName ?? "Admin"} — You are an admin!</p>
				</>
			) : auth?.customClaims?.faculty ? (
				<h1>You are not allowed to view this page please logut</h1>
			) : (
				<>
					<Welcome />
				</>
			)}

			<Button
				onClick={async () => {
					await auth?.logout();
				}}
			>
				Logout
			</Button>
		</div>
	);
};

export default AdminPageClient;
