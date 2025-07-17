"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth";
import { useState } from "react";

const AdminPage = () => {
	const auth = useAuth();
	const [refreshing, setRefreshing] = useState(false);

	if (auth?.loading) {
		return (
			<div className="flex items-center justify-center h-screen text-white text-2xl">
				Loading...
			</div>
		);
	}

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
		<div className="flex flex-col justify-center items-center h-screen text-white text-3xl gap-4 text-center">
			{auth?.customClaims?.admin ? (
				<>
					<p>{auth.user?.displayName ?? "Admin"} — You are an admin!</p>
				</>
			) : (
				<>
					<h1 className="text-lg">
						Please click the button or refresh the page
					</h1>
					<Button
						onClick={handleRefreshClaims}
						disabled={refreshing}
						variant="secondary"
					>
						{refreshing ? "Refreshing..." : "Refresh Role"}
					</Button>
				</>
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
