"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
	error,
	reset,
}: {
	error: Error;
	reset: () => void;
}) {
	useEffect(() => {
		console.error("Global error boundary caught:", error);
	}, [error]);

	return (
		<div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
			<div className="max-w-md w-full space-y-6 text-center">
				<h1 className="text-2xl font-semibold text-gray-800">
					Something went wrong
				</h1>
				<p className="text-sm text-gray-600 break-words">
					{error.message || "Unexpected error occurred."}
				</p>
				<div className="flex gap-3 justify-center">
					<Button onClick={() => reset()} variant="default">
						Try Again
					</Button>
					<Button onClick={() => window.location.reload()} variant="secondary">
						Reload
					</Button>
				</div>
			</div>
		</div>
	);
}
