import FacultyHeader from "@/components/faculty-header";
import FacultyMainInterface from "@/components/faculty-main-interface";
import { getDocumentsFromFirestore } from "@/data/actions";
import { colors } from "@/data/colors";
import React from "react";

type Building = {
	id: string;
	buildingName: string;
	color?: string;
};

const Page = async () => {
	const buildingData: Building[] = (
		(await getDocumentsFromFirestore("buildings", true)) as Building[]
	).map((bg, i) => ({
		...bg,
		color: colors[i % colors.length],
	}));

	return (
		<div>
			<FacultyHeader>
				<FacultyMainInterface data={buildingData} />
			</FacultyHeader>
		</div>
	);
};

export default Page;
