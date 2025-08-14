"use client";

import { useAuth } from "@/context/auth";
import Image from "next/image";
import {
	Building,
	ChevronFirst,
	ChevronRight,
	House,
	Menu,
	UserCog,
	UsersRound,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Alegreya_SC } from "next/font/google";
import Link from "next/link";

const alegreyaSC = Alegreya_SC({
	subsets: ["latin"],
	weight: ["400", "700"],
});

const AdminSideBar = ({ children }: { children: React.ReactNode }) => {
	const auth = useAuth();
	const pathname = usePathname();

	const [showSidebar, setShowSidebar] = useState(false);

	const tabs = [
		{
			title: "Dashboard",
			links: "/admin/dashboard",
			icon: <House size={20} />,
			id: "dashboard",
		},
		{
			title: "Designation",
			links: "/admin/designation",
			icon: <UserCog size={20} />,
			id: "designation",
		},
		{
			title: "Building",
			links: "/admin/building",
			icon: <Building size={20} />,
			id: "building",
		},
		{
			title: "Users",
			links: "/admin/users",
			icon: <UsersRound size={20} />,
			id: "users",
		},
	];

	return (
		<div className="flex text-white min-h-screen">
			{/* Menu */}
			<Menu
				className={`text-white md:hidden m-2 ${
					showSidebar ? "hidden" : "block"
				}`}
				size={50}
				onClick={() => setShowSidebar(true)}
			/>
			{/* Left Sidebar */}
			<div
				className={`left-container facilium-bg-indigo md:flex flex-col justify-between items-center p-4 min-h-screen ${
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
						<p className="text-xs text-center leading-relaxed tracking-widest">
							Admin Main Menu
						</p>
						<hr />
						<ul className="mt-8 flex flex-col justify-start gap-6">
							{tabs.map((tabInfo, index) => (
								<li
									key={index}
									className={`flex items-center gap-2 px-8 py-2 rounded ${
										pathname.includes(tabInfo.links)
											? "bg-indigo-400"
											: "text-white"
									}`}
								>
									{tabInfo.icon}
									<Link href={tabInfo.links}>{tabInfo.title}</Link>
								</li>
							))}
						</ul>
					</div>
				</div>

				{/*Logos and Logout */}
				<div className="bottom-links flex flex-col items-center gap-4">
					<div className="bsu-logo flex flex-col items-center gap-2 text-center text-sm w-full p-4">
						<div>
							<Image
								src="/bsu-meneses-logo.png"
								width={50}
								height={50}
								alt="bulsu meneses logo"
								className="w-12 h-12 object-contain"
							/>
						</div>
						<div>
							<p className={`leading-snug text-xs ${alegreyaSC.className}`}>
								Bulacan State University <br /> Meneses Campus
							</p>
						</div>
					</div>

					<Link
						className={`admin-info flex justify-center items-center gap-2 transition border hover:bg-[#8d99ae] p-2 rounded ${
							pathname === "/admin/admin-profile" ? "bg-[#8d99ae] py-[5px]" : ""
						}`}
						href="/admin/admin-profile"
					>
						<h1 className="facilium-bg-profile py-[6px] px-[10px] rounded">
							AU
						</h1>
						<div>
							<h2 className="text-sm">Admin User</h2>
							<h3 className="text-[10px]">{auth?.user?.email}</h3>
						</div>
						<ChevronRight size={30} />
					</Link>
				</div>
			</div>

			{/* Right Content Area */}
			<div
				className={`right-container flex-1 p-6 facilium-bg-white text-black overflow-y-auto max-h-screen ${
					showSidebar ? "hidden" : ""
				}`}
			>
				{children}
			</div>
		</div>
	);
};

export default AdminSideBar;
