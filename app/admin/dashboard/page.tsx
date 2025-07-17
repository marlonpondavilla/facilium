"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth";
import { useRouter } from "next/navigation";

const AdminPage = () => {
	const auth = useAuth();
	const router = useRouter();

	return (
		<div className="flex flex-col justify-center items-center h-screen text-white text-3xl gap-4">
			{!!auth?.customClaims?.admin &&
				auth?.user?.displayName + " You are an admin"}

			{!auth?.customClaims?.admin && (
				<h1 className="text-center text-lg">
					"Please logout and try logging into your account again to take this
					effect, if you're not admin you cannot proceed"
				</h1>
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

export default AdminPage;
