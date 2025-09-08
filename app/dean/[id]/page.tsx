import FacultyHeader from "@/components/faculty-header";
import FacultyScheduleInterface from "@/components/faculty-schedule-interface";
import { getDocumentsWithNestedObject } from "@/data/actions";
import {
	Classroom,
	getBuildingName,
	getClassrooms,
	getScheduleData,
} from "@/data/faculty-building";
import { ScheduleItem } from "@/types/SceduleInterface";
import React from "react";

type PageProps = {
	params: {
		id: string;
	};
};

type PendingSchedule = {
	classroomId: string;
	scheduleItems: ScheduleItem[];
	submitted: string;
};

const Page = async ({ params }: PageProps) => {
	const { id } = await Promise.resolve(params);

	const pendingScheduleDocs =
		await getDocumentsWithNestedObject<PendingSchedule>(
			"pendingScheduleData",
			"submitted"
		);
	const buildingName = await getBuildingName(id);
	const clasrooms: Classroom[] = await getClassrooms(id);
	// Flatten the nested scheduleItems
	const scheduleItems: ScheduleItem[] = pendingScheduleDocs.flatMap(
		(doc) => doc.scheduleItems
	);

	return (
		<FacultyHeader>
			<FacultyScheduleInterface
				scheduleItems={scheduleItems}
				buildingName={buildingName}
				data={clasrooms}
			/>
		</FacultyHeader>
	);
};

export default Page;
