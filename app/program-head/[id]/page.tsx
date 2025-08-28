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

type YearLevels = {
	id: string;
	programId: string;
	yearLevel: string;
};

type Sections = {
	id: string;
	yearLevelId: string;
	sectionName: string;
};

type Courses = {
	id: string;
	yearLevelId: string;
	courseCode: string;
};

type Professors = {
	id: string;
	designation: string;
	firstName: string;
	lastName: string;
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

	const programs: Programs[] = await getDocumentsFromFirestore(
		"programs",
		true
	);

	const yearLevels: YearLevels[] = await getDocumentsFromFirestore(
		"year-levels",
		true
	);

	const sections: Sections[] = await getDocumentsFromFirestore(
		"sections",
		true
	);

	const courses: Courses[] = await getDocumentsFromFirestore("courses", true);

	// note: hindi naka sort by created field, just add the second argument(boolean) if needed.
	const professors: Professors[] = await getDocumentsFromFirestore("userData");

	return (
		<FacultyHeader>
			<FacultyScheduleInterface
				buildingName={buildingName}
				data={classrooms}
				programs={programs}
				yearLevels={yearLevels}
				sections={sections}
				courses={courses}
				professors={professors}
			/>
		</FacultyHeader>
	);
};

export default Page;
