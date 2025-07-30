"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Home() {
	const router = useRouter();
	return (
		<div className="flex flex-col justify-center items-center h-screen gap-4">
			<h1 className="text-2xl text-white">Root</h1>
			<Button
				onClick={() => {
					router.replace("/login");
				}}
			>
				Login Page
			</Button>
		</div>
	);
}
