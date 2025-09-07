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

	const approvedScheduleData = await getScheduleData("approvedScheduleData");
	const buildingName = await getBuildingName(id);
	const clasrooms: Classroom[] = await getClassrooms(id);

	return (
		<FacultyHeader>
			<FacultyScheduleInterface
				scheduleItems={approvedScheduleData}
				buildingName={buildingName}
				data={clasrooms}
			/>
		</FacultyHeader>
	);
};

export default Page;
