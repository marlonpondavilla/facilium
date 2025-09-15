import FacultyHeader from "@/components/faculty-header";
import FacultyScheduleInterface from "@/components/faculty-schedule-interface";
import { getDocumentsWithNestedObject } from "@/data/actions";
import {
	Classroom,
	getBuildingName,
	getClassrooms,
} from "@/data/faculty-building";
import { PendingSchedule, ScheduleItem } from "@/types/SceduleInterface";
import React from "react";

type PageProps = { params: Promise<{ id: string }> };

const Page = async ({ params }: PageProps) => {
	const { id } = await params;

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
