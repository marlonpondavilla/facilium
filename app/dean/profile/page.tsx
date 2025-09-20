import FacultyHeader from "@/components/faculty-header";
import React from "react";
import { getCurrentUserData } from "@/data/actions";
import FacultyProfile from "@/components/faculty-profile";

const Page = async () => {
	const user = await getCurrentUserData();

	return (
		<FacultyHeader>
			<FacultyProfile user={user} />
		</FacultyHeader>
	);
};

export default Page;
