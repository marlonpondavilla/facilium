"use client";

import { useAuth } from "@/context/auth";
import { Alegreya_SC } from "next/font/google";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import React from "react";

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

	const handleProfileClick = () => {
		if (pathname.startsWith("/faculty")) {
			router.push("/faculty/profile");
		} else if (pathname.startsWith("/program-head")) {
			router.push("/program-head/profile");
		} else if (pathname.startsWith("/dean")) {
			router.push("/dean/profile");
		} else {
			router.push("/error-page");
		}
	};

	const profileName = getInitials(userDisplayName);

	return (
		<div className="min-h-screen flex flex-col">
			{/* Header */}
			<div className="flex items-center justify-between w-full py-5 px-8 facilium-bg-whiter">
				<div className="left-section flex items-center gap-4">
					<Image
						src={"/bsu-meneses-logo.png"}
						width={100}
						height={100}
						alt="Meneses Logo"
						priority
						className="w-18"
					/>
					<div className={`logo-name ${alegreyaSC.className} font-bold`}>
						<h1 className="text-2xl">Bulacan State University</h1>
						<h2>Meneses Campus</h2>
					</div>
				</div>

				<div className="right-section flex gap-2 items-center">
					<div className="faculty-info flex items-end flex-col">
						<h3 className="text-base">{auth?.user?.displayName}</h3>
						<h4 className="text-xs text-gray-500">{auth?.user?.email}</h4>
					</div>
					<p
						onClick={handleProfileClick}
						className="border text-center text-2xl py-2 px-3 facilium-bg-indigo facilium-color-white cursor-pointer hover:opacity-70 transition-all rounded"
					>
						{profileName}
					</p>
				</div>
			</div>

			{/* Main content */}
			<div className="faculty-content flex justify-center items-center my-8 flex-grow">
				{children}
			</div>

			{/* Footer */}
			<footer className="facilium-bg-pink mt-auto py-4 text-center facilium-color-white">
				<p className="tracking-wide">
					Bulacan State University - Meneses Campus &copy; 2025
				</p>
			</footer>
		</div>
	);
};

export default FacultyHeader;
