"use client";

import { useAuth } from "@/context/auth";
import { Button } from "./ui/button";

const LogoutAuthButton = () => {
	const auth = useAuth();
	return (
		<Button
			onClick={async () => {
				await auth?.logout();
			}}
			size={"default"}
			variant={"destructive"}
		>
			Logout
		</Button>
	);
};

export default LogoutAuthButton;
