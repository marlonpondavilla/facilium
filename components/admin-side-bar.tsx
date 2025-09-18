"use client";

import { useAuth } from "@/context/auth";
import Image from "next/image";
import {
	BookOpenText,
	Building,
	ChevronFirst,
	ChevronRight,
	House,
	Menu,
	UserCog,
	UsersRound,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Alegreya_SC } from "next/font/google";
import Link from "next/link";

const alegreyaSC = Alegreya_SC({
	subsets: ["latin"],
	weight: ["400", "700"],
});

const AdminSideBar = ({ children }: { children: React.ReactNode }) => {
	const auth = useAuth();
	const pathname = usePathname();
	const router = useRouter();

	// block non auth user (avoid redirect flicker while an intentional logout is in progress)
	useEffect(() => {
		if (auth?.loggingOut) return; // skip while logout flow handles navigation
		if (!auth?.user) {
			router.replace("/login");
		}
	}, [auth?.user, auth?.loggingOut, router]);

	const [showSidebar, setShowSidebar] = useState(false);

	// Handle window resize - close mobile menu on desktop
	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth >= 768) {
				setShowSidebar(false);
			}
		};

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	// Close mobile menu on route change
	useEffect(() => {
		if (window.innerWidth < 768) {
			setShowSidebar(false);
		}
	}, [pathname]);

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
			title: "Programs",
			links: "/admin/programs",
			icon: <BookOpenText size={20} />,
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
		<div className="flex text-white min-h-screen relative">
			{/* Mobile Hamburger Menu Button */}
			<button
				className={`fixed top-4 left-4 z-50 p-2 bg-indigo-600 rounded-lg shadow-lg md:hidden transition-all duration-300 ${
					showSidebar ? "left-72" : "left-4"
				}`}
				onClick={() => setShowSidebar(!showSidebar)}
				aria-label="Toggle navigation"
			>
				<Menu className="text-white" size={24} />
			</button>

			{/* Mobile Overlay */}
			{showSidebar && (
				<div
					className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity duration-300"
					onClick={() => setShowSidebar(false)}
				/>
			)}

			{/* Left Sidebar */}
			<div
				className={`left-container facilium-bg-indigo flex flex-col justify-between items-center p-4 min-h-screen transition-all duration-300 z-40
					md:relative md:translate-x-0 md:w-72
					${
						showSidebar
							? "fixed left-0 top-0 w-72 translate-x-0"
							: "fixed left-0 top-0 w-72 -translate-x-full md:translate-x-0"
					}`}
			>
				<div className="flex flex-col items-start gap-4 w-full">
					{/* Mobile Close Button */}
					<button
						className="flex items-center gap-2 text-red-400 font-bold md:hidden p-2 hover:bg-indigo-500 rounded transition-colors duration-200 w-full"
						onClick={() => setShowSidebar(false)}
					>
						<ChevronFirst size={20} />
						<span>Close Menu</span>
					</button>
					{/* Logo Section */}
					<div className="flex items-center gap-3 w-full px-2">
						<Image
							src="/facilium-logo.png"
							width={40}
							height={40}
							alt="facilium logo"
							className="w-10 h-10 object-contain flex-shrink-0"
						/>
						<h1 className="text-xl md:text-2xl font-semibold tracking-wider">
							Facilium
						</h1>
					</div>

					{/* Navigation Menu */}
					<nav className="tab-links mt-6 w-full">
						<div className="mb-6">
							<p className="text-xs text-center leading-relaxed tracking-widest text-indigo-200 uppercase font-medium">
								Admin Main Menu
							</p>
							<hr className="mt-2 border-indigo-500" />
						</div>
						<ul className="flex flex-col gap-2">
							{tabs.map((tabInfo, index) => (
								<li key={index}>
									<Link
										href={tabInfo.links}
										className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 w-full hover:bg-indigo-500 ${
											pathname.includes(tabInfo.links)
												? "bg-indigo-400 shadow-lg"
												: "text-white hover:text-white"
										}`}
										onClick={() => {
											// Close mobile menu when clicking a link
											if (window.innerWidth < 768) {
												setShowSidebar(false);
											}
										}}
									>
										<span className="flex-shrink-0">{tabInfo.icon}</span>
										<span className="font-medium">{tabInfo.title}</span>
									</Link>
								</li>
							))}
						</ul>
					</nav>
				</div>

				{/* Bottom Section */}
				<div className="bottom-links flex flex-col items-center gap-4 w-full mt-auto">
					{/* BSU Logo */}
					<div className="bsu-logo flex flex-col items-center gap-2 text-center text-sm w-full p-3 rounded-lg">
						<Image
							src="/bsu-meneses-logo.png"
							width={40}
							height={40}
							alt="bulsu meneses logo"
							className="w-10 h-10 object-contain"
						/>
						<p
							className={`leading-snug text-xs text-indigo-200 ${alegreyaSC.className}`}
						>
							Bulacan State University <br /> Meneses Campus
						</p>
					</div>

					{/* Admin Profile Link */}
					<Link
						className={`admin-info flex items-center gap-3 transition-all duration-200 border border-indigo-500 hover:bg-indigo-500 p-3 rounded-lg w-full ${
							pathname === "/admin/admin-profile"
								? "bg-indigo-400 border-indigo-300"
								: ""
						}`}
						href="/admin/admin-profile"
						onClick={() => {
							// Close mobile menu when clicking profile
							if (window.innerWidth < 768) {
								setShowSidebar(false);
							}
						}}
					>
						<div className="facilium-bg-profile w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
							AU
						</div>
						<div className="flex-1 min-w-0">
							<h2 className="text-sm font-medium truncate">Admin User</h2>
							<h3 className="text-xs text-indigo-200 truncate">
								{auth?.user?.email}
							</h3>
						</div>
						<ChevronRight size={20} className="flex-shrink-0" />
					</Link>
				</div>
			</div>

			{/* Right Content Area */}
			<div className="right-container flex-1 facilium-bg-white text-black overflow-y-auto max-h-screen md:ml-0">
				{/* Mobile Header Space */}
				<div className="h-16 md:hidden" />{" "}
				{/* Space for mobile hamburger button */}
				{/* Content with responsive padding */}
				<main className="p-4 md:p-6 lg:p-8">{children}</main>
			</div>
		</div>
	);
};

export default AdminSideBar;
