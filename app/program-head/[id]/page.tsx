import FacultyHeader from "@/components/faculty-header";
import FacultyScheduleInterface from "@/components/faculty-schedule-interface";
import { getDocumentsFromFirestore } from "@/data/actions";
import {
	Classroom,
	getBuildingName,
	getClassrooms,
	getScheduleData,
} from "@/data/faculty-building";
import { AcademicYear } from "@/types/academicYearType";
import React from "react";

type PageProps = { params: Promise<{ id: string }> };

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
	termId: string;
	yearLevelId: string;
	courseCode: string;
};

type AcademicTerms = {
	id: string;
	programId: string;
	yearLevelId: string;
	term: string;
};

type Professors = {
	id: string;
	designation: string;
	firstName: string;
	lastName: string;
};

const Page = async ({ params }: PageProps) => {
	const { id } = await params;

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

	const academicTerms: AcademicTerms[] = await getDocumentsFromFirestore(
		"academic-terms",
		true
	);

	const academicYears: AcademicYear[] = await getDocumentsFromFirestore(
		"academic-years"
	);

	// console.log(academicYears);

	// note: hindi naka sort by created field, just add the second argument(boolean) if needed.
	const professors: Professors[] = await getDocumentsFromFirestore("userData");

	const scheduleData = await getScheduleData("scheduleData");
	const classrooms: Classroom[] = await getClassrooms(id);
	const buildingName = await getBuildingName(id);

	return (
		<FacultyHeader>
			<FacultyScheduleInterface
				buildingName={buildingName}
				data={classrooms}
				programs={programs}
				yearLevels={yearLevels}
				sections={sections}
				courses={courses}
				academicTerms={academicTerms}
				academicYears={academicYears}
				professors={professors}
				scheduleItems={scheduleData}
			/>
		</FacultyHeader>
	);
};

export default Page;
