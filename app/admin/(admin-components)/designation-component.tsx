"use client";

import AdminHeaderTitle from "@/components/admin-header-title";
import SearchHeader from "@/components/search-header";

type DesignationComponentProps = {
	children: React.ReactNode;
	search: string;
};

const DesignationComponent = ({
	children,
	search,
}: DesignationComponentProps) => {
	return (
		<div className="flex flex-col gap-8">
			<AdminHeaderTitle title="Designation" />

			<SearchHeader search={search} placeholder="Search Faculty by Email" />

			{children}
		</div>
	);
};

export default DesignationComponent;
