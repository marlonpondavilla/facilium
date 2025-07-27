"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth";
import Image from "next/image";
import {
	Building,
	ChevronFirst,
	House,
	Menu,
	UserCog,
	UsersRound,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

const AdminSideBar = ({ children }: { children: React.ReactNode }) => {
	const auth = useAuth();
	const searchParams = useSearchParams();
	const tab = searchParams.get("tab") || "dashboard";
	const [showSidebar, setShowSidebar] = useState(false);

	const tabs = [
		{
			title: "Dashboard",
			links: "?tab=dashboard",
			icon: <House size={20} />,
			id: "dashboard",
		},
		{
			title: "Roles",
			links: "?tab=roles",
			icon: <UserCog size={20} />,
			id: "roles",
		},
		{
			title: "Building",
			links: "?tab=building",
			icon: <Building size={20} />,
			id: "building",
		},
		{
			title: "Users",
			links: "?tab=users",
			icon: <UsersRound size={20} />,
			id: "users",
		},
	];

	return (
		<div className="flex text-white min-h-screen">
			{/* Menu */}
			<Menu
				className={`text-black md:hidden m-2 ${
					showSidebar ? "hidden" : "block"
				}`}
				size={50}
				onClick={() => setShowSidebar(true)}
			/>
			{/* Left Sidebar */}
			<div
				className={`left-container facilium-bg-indigo md:flex flex-col justify-between items-center p-6 h-screen ${
					showSidebar ? "flex" : "hidden"
				}`}
			>
				<div className="flex flex-col items-start gap-4">
					<div
						className="flex text-red-400 font-bold md:hidden"
						onClick={() => setShowSidebar(false)}
					>
						<ChevronFirst />
						Close
					</div>
					<div className="flex items-center">
						<Image
							src="/facilium-logo.png"
							width={50}
							height={50}
							alt="facilium logo"
							className="w-18 h-18 object-contain"
						/>
						<h1 className="text-2xl tracking-widest">Facilium</h1>
					</div>

					<div className="tab-links mt-8">
						<p className="text-xs text-start leading-relaxed tracking-wide">
							Admin Main Menu
						</p>
						<ul className="mt-8 flex flex-col gap-6">
							{tabs.map((tabInfo, index) => (
								<li
									key={index}
									className={`flex items-center gap-2 px-4 py-2 rounded ${
										tab === tabInfo.id ? "bg-indigo-400" : "text-white"
									}`}
								>
									{tabInfo.icon}
									<a href={tabInfo.links}>{tabInfo.title}</a>
								</li>
							))}
						</ul>
					</div>
				</div>

				{/*Logos and Logout */}
				<div className="bottom-links flex flex-col items-center gap-4 mt-6">
					<div className="bsu-logo flex sm:flex-row items-center gap-2 text-center text-sm">
						<Image
							src="/bsu-main-logo.png"
							width={25}
							height={25}
							alt="bulsu main logo"
							className="w-8 h-8 object-contain"
						/>
						<Image
							src="/bsu-meneses-logo.png"
							width={25}
							height={25}
							alt="bulsu meneses logo"
							className="w-8 h-8 object-contain"
						/>
						<p className="leading-snug text-xs">
							Bulacan State University <br /> Meneses Campus
						</p>
					</div>

					<Button
						onClick={async () => {
							await auth?.logout();
						}}
						className="bg-red-500 text-white px-4 py-2 text-xs rounded-full"
					>
						Logout
					</Button>
				</div>
			</div>

			{/* Right Content Area */}
			<div
				className={`right-container flex-1 p-6 bg-white text-black ${
					showSidebar ? "hidden" : ""
				}`}
			>
				{children}
			</div>
		</div>
	);
};

export default AdminSideBar;
