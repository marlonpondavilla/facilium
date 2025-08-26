import FacultyHeader from "@/components/faculty-header";
import FacultyMainInterface from "@/components/faculty-main-interface";
import { getDocumentsFromFirestore } from "@/data/actions";
import React from "react";

type Building = {
	id: string;
	buildingName: string;
	color?: string;
};

const Page = async () => {
	const colors = [
		"facilium-bg-teal",
		"facilium-bg-hot-pink",
		"facilium-bg-royal-blue",
		"facilium-bg-cornflower",
		"facilium-bg-bubblegum",
		"facilium-bg-fuscia",
	];

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
