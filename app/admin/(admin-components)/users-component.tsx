"use client";

import AdminHeaderTitle from "@/components/admin-header-title";
import SearchHeader from "@/components/search-header";
import { departments } from "@/data/department";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";

type UsersComponentProps = {
	userCount: number;
	children: React.ReactNode;
	search: string;
	department: string;
};

const UsersComponent = ({
	userCount,
	children,
	search,
	department,
}: UsersComponentProps) => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [dept, setDept] = React.useState(department || "all");

	React.useEffect(() => {
		const params = new URLSearchParams(searchParams.toString());
		if (dept && dept !== "all") params.set("department", dept);
		else params.delete("department");
		params.delete("page");
		params.delete("cursor");
		params.delete("previousCursors");
		router.push(`?${params.toString()}`);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dept]);

	React.useEffect(() => {
		setDept(department || "all");
	}, [department]);
	return (
		<div className="flex flex-col gap-8">
			<AdminHeaderTitle title="Users" />

			<SearchHeader
				search={search}
				placeholder="Search by Email"
				usersCount={userCount}
			/>

			<div className="facilium-bg-whiter p-4 -mt-6 flex flex-wrap gap-4 items-center">
				<label className="text-sm font-medium" htmlFor="user-department-filter">
					Filter by Department
				</label>
				<select
					id="user-department-filter"
					value={dept}
					onChange={(e) => setDept(e.target.value)}
					className="border border-gray-400 rounded py-2 px-3 text-sm bg-white"
				>
					<option value="all">All</option>
					{departments.map((d) => (
						<option key={d} value={d}>
							{d}
						</option>
					))}
				</select>
			</div>

			<div className="table-wrapper flex flex-col gap-2">{children}</div>
		</div>
	);
};

export default UsersComponent;
