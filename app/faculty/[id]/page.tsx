import FacultyHeader from "@/components/faculty-header";
import FacultyScheduleInterface from "@/components/faculty-schedule-interface";
import {
	Classroom,
	getBuildingName,
	getClassrooms,
	getScheduleData,
} from "@/data/faculty-building";
import React from "react";

type PageProps = {
	params: {
		id: string;
	};
};

const Page = async ({ params }: PageProps) => {
	const { id } = await Promise.resolve(params);

	const scheduleData = await getScheduleData();
	const buildingName = await getBuildingName(id);
	const clasrooms: Classroom[] = await getClassrooms(id);

	return (
		<FacultyHeader>
			<FacultyScheduleInterface
				scheduleItems={scheduleData}
				buildingName={buildingName}
				data={clasrooms}
			/>
		</FacultyHeader>
	);
};

export default Page;
