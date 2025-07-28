"use client";

import { currentDate } from "@/lib/date";
import { CalendarFold, Search } from "lucide-react";
import Image from "next/image";

const UsersComponent = ({ children }: { children: React.ReactNode }) => {
	return (
		<div className="flex flex-col gap-8">
			<div className="header-container flex justify-between items-center">
				<div className="flex items-center gap-2">
					<Image
						src={"/icons/window-icon.png"}
						height={25}
						width={25}
						alt="window icon"
					/>
					<h1 className="text-2xl font-semibold">Users</h1>
				</div>

				<div className="date flex gap-2 items-center">
					<CalendarFold />
					<p>{currentDate}</p>
				</div>
			</div>

			<div className="search-wrapper">
				<div className="facilium-bg-whiter tracking-wide p-8 flex justify-between">
					<h2 className="text-2xl">Manage Users</h2>
					<div className="relative text-base">
						<input
							type="text"
							placeholder="Search User"
							className="border border-gray-400 rounded w-[100%] py-2 px-8"
						/>
						<Search size={20} className="absolute top-1 mt-[7px] ml-2" />
					</div>
				</div>
			</div>

			<div className="table-wrapper flex flex-col gap-2">{children}</div>
		</div>
	);
};

export default UsersComponent;
