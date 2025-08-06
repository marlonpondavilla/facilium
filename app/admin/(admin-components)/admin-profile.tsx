"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth";

const AdminProfile = () => {
	const auth = useAuth();

	return (
		<div className="flex justify-center items-center gap-4 flex-col">
			<h1 className="text-2xl">Admin Profile</h1>
			<Button
				onClick={async () => {
					await auth?.logout();
				}}
				className="bg-red-500 text-white px-4 py-2 text-xs rounded-full"
			>
				Logout
			</Button>
		</div>
	);
};

export default AdminProfile;
