import FacultyHeader from "@/components/faculty-header";
import LogoutAuthButton from "@/components/logout";
import React from "react";

const page = () => {
	return (
		<div>
			<FacultyHeader />
			<LogoutAuthButton />
		</div>
	);
};

export default page;
