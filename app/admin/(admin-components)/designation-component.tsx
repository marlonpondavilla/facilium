"use client";

import AdminHeaderTitle from "@/components/admin-header-title";
import { Search } from "lucide-react";
import React from "react";

const DesignationComponent = ({ children }: { children: React.ReactNode }) => {
	return (
		<div className="flex flex-col gap-8">
			<AdminHeaderTitle title="Designation" />

			<div className="p-6 facilium-bg-whiter">
				<div className="relative text-base">
					<input
						type="text"
						placeholder="Search Faculty or Program Head"
						className="border border-gray-400 rounded w-[100%] py-2 px-8"
					/>
					<Search size={20} className="absolute top-1 mt-[7px] ml-2" />
				</div>
			</div>

			{children}
		</div>
	);
};

export default DesignationComponent;
