"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth";
import React from "react";

const UserPage = () => {
	const auth = useAuth();
	return (
		<div className="flex flex-col justify-center items-center gap-4">
			<h1 className="text-center text-4xl mt-4 text-white">
				Hello {auth?.user?.email ?? "no user data"}
			</h1>
			<Button onClick={() => auth?.logout()}>Logout</Button>
		</div>
	);
};

export default UserPage;
