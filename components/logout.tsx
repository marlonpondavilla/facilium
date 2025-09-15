"use client";

import { useAuth } from "@/context/auth";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";

const LogoutAuthButton = () => {
	const auth = useAuth();
	const loggingOut = auth?.loggingOut;
	return (
		<Button
			onClick={async () => {
				if (!loggingOut) await auth?.logout();
			}}
			size={"default"}
			variant={"destructive"}
			disabled={!!loggingOut}
			className="flex items-center gap-2"
		>
			{loggingOut && (
				<Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
			)}
			{loggingOut ? "Logging out..." : "Logout"}
		</Button>
	);
};

export default LogoutAuthButton;
