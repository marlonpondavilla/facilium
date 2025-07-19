"use client";

import { Button } from "@/components/ui/button";
import Welcome from "@/components/welcome";
import { useAuth } from "@/context/auth";
import React from "react";

const UserPage = () => {
	const auth = useAuth();

	return (
		<div className="flex flex-col justify-center items-center gap-4 text-white">
			{!!auth?.customClaims?.faculty ? (
				<h1>hello faculty {auth.user?.displayName}</h1>
			) : !!auth?.customClaims?.admin ? (
				<h1 className="text-lg text-white">
					Admin cannot continue on this page, please logout
				</h1>
			) : (
				<Welcome />
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

export default UserPage;
