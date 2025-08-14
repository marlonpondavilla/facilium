"use client";

import AdminHeaderTitle from "@/components/admin-header-title";
import SearchHeader from "@/components/search-header";

type UsersComponentProps = {
	userCount: number;
	children: React.ReactNode;
	search: string;
};

const UsersComponent = ({
	userCount,
	children,
	search,
}: UsersComponentProps) => {
	return (
		<div className="flex flex-col gap-8">
			<AdminHeaderTitle title="Users" />

			<SearchHeader
				search={search}
				placeholder="Search by Email"
				usersCount={userCount}
			/>

			<div className="table-wrapper flex flex-col gap-2">{children}</div>
		</div>
	);
};

export default UsersComponent;
