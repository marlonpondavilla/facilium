import FacultyHeader from "@/components/faculty-header";
import LogoutAuthButton from "@/components/logout";
import React from "react";

const Page = () => {
	return (
		<FacultyHeader>
			<LogoutAuthButton />
		</FacultyHeader>
	);
};

export default Page;
