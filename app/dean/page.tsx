import FacultyHeader from "@/components/faculty-header";
import FacultyMainInterface from "@/components/faculty-main-interface";
import { getBuildingData } from "@/data/faculty-building";
import React from "react";

const Page = async () => {
	const buildings = await getBuildingData();

	return (
		<div>
			<FacultyHeader>
				<FacultyMainInterface data={buildings} />
			</FacultyHeader>
		</div>
	);
};

export default Page;
