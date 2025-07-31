"use client";

import LogoutAuthButton from "@/components/logout";
import { Button } from "@/components/ui/button";
import Welcome from "@/components/welcome";
import { useAuth } from "@/context/auth";
import React from "react";

const UserPage = () => {
	const auth = useAuth();

	return (
		<div className="flex flex-col justify-center items-center gap-4">
			{!!auth?.customClaims?.faculty ? (
				<h1>hello faculty {auth.user?.displayName}</h1>
			) : !!auth?.customClaims?.admin ? (
				<h1 className="text-lg">
					Admin cannot continue on this page, please logout
				</h1>
			) : (
				<Welcome />
			)}

			<LogoutAuthButton />
		</div>
	);
};

export default UserPage;
