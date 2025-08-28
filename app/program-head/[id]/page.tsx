import FacultyHeader from "@/components/faculty-header";
import FacultyScheduleInterface from "@/components/faculty-schedule-interface";
import {
	getDocumentsByFieldIds,
	getDocumentsFromFirestore,
	getSingleDocumentFromFirestore,
} from "@/data/actions";
import React from "react";

type PageProps = {
	params: {
		id: string;
	};
};

type Classroom = {
	id: string;
	classroomName: string;
};

type Programs = {
	id: string;
	programCode: string;
};

const Page = async ({ params }: PageProps) => {
	const { id } = await Promise.resolve(params);

	const buildingName = await getSingleDocumentFromFirestore(
		id,
		"buildings",
		"buildingName"
	);

	const classrooms = await getDocumentsByFieldIds<Classroom>(
		"classrooms",
		"buildingId",
		id
	);

	// const yearLevels = await getDocumentsFromFirestore("year-levels", true);
	const programs: Programs[] = await getDocumentsFromFirestore(
		"programs",
		true
	);

	return (
		<FacultyHeader>
			<FacultyScheduleInterface
				programs={programs}
				buildingName={buildingName}
				data={classrooms}
			/>
		</FacultyHeader>
	);
};

export default Page;
