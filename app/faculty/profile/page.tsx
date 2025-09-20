import FacultyHeader from "@/components/faculty-header";
import FacultyProfile from "@/components/faculty-profile";
import { getCurrentUserData } from "@/data/actions";
import React from "react";

const Page = async () => {
	const user = await getCurrentUserData();
	return (
		<FacultyHeader>
			<FacultyProfile user={user} />
		</FacultyHeader>
	);
};

export default Page;
