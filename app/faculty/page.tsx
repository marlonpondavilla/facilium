import FacultyHeader from "@/components/faculty-header";
import LogoutAuthButton from "@/components/logout";
import React from "react";

const Page = () => {
	return (
		<div>
			<FacultyHeader>
				<LogoutAuthButton />
			</FacultyHeader>
		</div>
	);
};

export default Page;
