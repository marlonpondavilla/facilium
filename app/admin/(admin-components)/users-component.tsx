"use client";

import AdminHeaderTitle from "@/components/admin-header-title";
import { Search } from "lucide-react";

type UsersComponentProps = {
	userCount: number;
	children: React.ReactNode;
};

const UsersComponent = ({ userCount, children }: UsersComponentProps) => {
	return (
		<div className="flex flex-col gap-8">
			<AdminHeaderTitle title="Users" />

			<div className="search-wrapper">
				<div className="facilium-bg-whiter tracking-wide p-8 flex justify-between">
					<h2 className="text-2xl">Total Users: {userCount}</h2>
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
