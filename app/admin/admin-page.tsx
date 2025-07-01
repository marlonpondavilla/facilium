"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth";

const AdminPage = () => {
	const auth = useAuth();

	return (
		<div className="flex flex-col justify-center items-center h-screen text-white text-3xl gap-4">
			<h1>Admin dashboard {auth?.user?.displayName ?? "no user"}</h1>
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

export default AdminPage;
