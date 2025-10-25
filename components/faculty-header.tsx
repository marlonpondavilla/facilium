"use client";

import { useAuth } from "@/context/auth";
import { Alegreya_SC } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { Button } from "./ui/button";
import { useRequireAuth } from "@/lib/use-require-auth";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const alegreyaSC = Alegreya_SC({
	subsets: ["latin"],
	weight: ["400", "700"],
});

const FacultyHeader = ({ children }: { children: React.ReactNode }) => {
	const router = useRouter();
	const pathname = usePathname();
	const auth = useAuth();
	const userDisplayName = auth?.user?.displayName ?? "--";
	const photoURL = (auth?.user?.photoURL || "").trim() || undefined;

	// Centralized guard
	useRequireAuth();

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
			<div className="flex flex-nowrap items-center justify-between gap-4 w-full py-5 px-4 sm:px-6 md:px-8 facilium-bg-pink">
				<Link href={"/dashboard"}>
					<div className="left-section flex items-center gap-4 min-w-0 flex-1">
						<div className="relative">
							<Image
								src={"/bsu-meneses-logo.png"}
								width={100}
								height={100}
								alt="Meneses Logo"
								className="w-14 sm:w-20 drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]"
								style={{
									filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3)) drop-shadow(0 0 8px rgba(255,255,255,0.3))"
								}}
							/>
						</div>
						<div
							className={`logo-name ${alegreyaSC.className} font-bold facilium-color-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]`}
						>
							<h1 className="text-md sm:text-xl">Bulacan State University</h1>
							<h2 className="text-sm sm:text-base">Meneses Campus</h2>
						</div>
					</div>
				</Link>

				<div className="right-section flex gap-2 items-center shrink-0 text-white">
					{/* Hide on small screens */}
					<div className="faculty-info hidden md:flex items-end flex-col">
						<h3 className="text-base text-white font-medium">{auth?.user?.displayName}</h3>
						<h4 className="text-xs text-white/80">{auth?.user?.email}</h4>
					</div>
					{photoURL ? (
						<button
							onClick={handleProfileClick}
							className="rounded-full p-0 focus:outline-none"
							aria-label="Open profile"
							title="Open profile"
						>
							<Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-2 ring-white shadow-md cursor-pointer">
								<AvatarImage
									src={photoURL}
									alt={userDisplayName}
									className="object-cover"
								/>
								<AvatarFallback className="text-base">
									{profileName}
								</AvatarFallback>
							</Avatar>
						</button>
					) : (
						<Button
							onClick={handleProfileClick}
							className="border text-center text-2xl h-full px-3 bg-white text-[#7a0e3f] cursor-pointer hover:bg-gray-100 transition-all rounded"
						>
							{profileName}
						</Button>
					)}
				</div>
			</div>

			<div className="faculty-content flex justify-center items-start py-8 flex-grow px-4 sm:px-6 md:px-10">
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
