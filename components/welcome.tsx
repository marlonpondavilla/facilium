import { useAuth } from "@/context/auth";
import { useState } from "react";
import { Button } from "./ui/button";

const Welcome = () => {
	const auth = useAuth();
	const [refreshing, setRefreshing] = useState(false);

	const handleRefreshClaims = async () => {
		if (!!auth?.user) {
			setRefreshing(true);

			try {
				await auth.user.getIdToken(true);
				window.location.reload();
			} catch (e: any) {
				console.log(e.message);
			} finally {
				setRefreshing(false);
			}
		}
	};
	return (
		<div className="flex flex-col justify-center items-center gap-4">
			<h1 className="text-lg">
				Welcome to the innovative solutions just for you!
			</h1>
			<Button
				onClick={handleRefreshClaims}
				disabled={refreshing}
				variant="secondary"
			>
				{refreshing ? "Refreshing..." : "Refresh Role"}
			</Button>
		</div>
	);
};

export default Welcome;
