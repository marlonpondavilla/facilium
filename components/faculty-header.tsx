"use client";

import { useAuth } from "@/context/auth";
import { Alegreya_SC } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { Button } from "./ui/button";

const alegreyaSC = Alegreya_SC({
	subsets: ["latin"],
	weight: ["400", "700"],
});

const FacultyHeader = ({ children }: { children: React.ReactNode }) => {
	const router = useRouter();
	const pathname = usePathname();
	const auth = useAuth();
	const userDisplayName = auth?.user?.displayName ?? "--";

	const getInitials = (name: string): string => {
		const words = name.trim().split(" ");
		if (words.length === 1) {
			return words[0][0].toUpperCase();
		}
		return (words[0][0] + words[1][0]).toUpperCase();
	};

	const profileRoutes: {
		"/faculty": string;
		"/program-head": string;
		"/dean": string;
	} = {
		"/faculty": "/faculty/profile",
		"/program-head": "/program-head/profile",
		"/dean": "/dean/profile",
	};

	const handleProfileClick = () => {
		// Check if the pathname matches one of the keys in profileRoutes
		const route = Object.keys(profileRoutes).find((route) =>
			pathname.startsWith(route)
		);

		if (route) {
			router.push(profileRoutes[route as keyof typeof profileRoutes]);
		} else {
			router.push("/error-page");
		}
	};

	const profileName = userDisplayName ? getInitials(userDisplayName) : "N/A";

	return (
		<div className="min-h-screen flex flex-col">
			{/* Header */}

			<div className="flex flex-wrap items-center justify-between gap-4 w-full py-5 px-4 sm:px-6 md:px-8 bg-[linear-gradient(to_right,_#AC1754_55%,_#F5F5F5_97%)]">
				<Link href={"/dashboard"}>
					<div className="left-section flex items-center gap-4">
						<Image
							src={"/bsu-meneses-logo.png"}
							width={100}
							height={100}
							alt="Meneses Logo"
							className="w-14 sm:w-20"
						/>
						<div
							className={`logo-name ${alegreyaSC.className} font-bold facilium-color-white`}
						>
							<h1 className="text-lg sm:text-xl">Bulacan State University</h1>
							<h2 className="text-sm sm:text-base">Meneses Campus</h2>
						</div>
					</div>
				</Link>

				<div className="right-section flex gap-2 items-center">
					{/* Hide on small screens */}
					<div className="faculty-info hidden md:flex items-end flex-col">
						<h3 className="text-base">{auth?.user?.displayName}</h3>
						<h4 className="text-xs text-gray-500">{auth?.user?.email}</h4>
					</div>
					<Button
						onClick={handleProfileClick}
						className="border text-center text-2xl h-full px-3 facilium-bg-indigo facilium-color-white cursor-pointer hover:opacity-70 transition-all rounded"
					>
						{profileName}
					</Button>
				</div>
			</div>

			{/* Main content */}
			<div className="faculty-content flex justify-center items-center my-8 flex-grow px-4 sm:px-6 md:px-10">
				{children}
			</div>

			{/* Footer */}
			<footer className="facilium-bg-pink mt-auto py-4 w-full">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 text-center facilium-color-white">
					<p className="tracking-wide text-sm sm:text-base">
						Bulacan State University - Meneses Campus &copy; 2025
					</p>
				</div>
			</footer>
		</div>
	);
};

export default FacultyHeader;
