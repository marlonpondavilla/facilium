"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth";
import { useRouter } from "next/navigation";
import React from "react";

const UserPage = () => {
	const auth = useAuth();

	return (
		<div className="flex flex-col justify-center items-center gap-4">
			{!!auth?.customClaims?.admin && (
				<>
					<h1 className="text-lg text-white">
						Admin cannot continue on this page, please logout
					</h1>
					<Button
						onClick={async () => {
							await auth?.logout();
						}}
					>
						Logout
					</Button>
				</>
			)}
			{!auth?.customClaims?.admin && (
				<>
					<h1 className="text-3xl text-white">
						Hello User {auth?.user?.email}
					</h1>
					<Button
						onClick={async () => {
							await auth?.logout();
						}}
					>
						Logout
					</Button>
				</>
			)}
		</div>
	);
};

export default UserPage;
