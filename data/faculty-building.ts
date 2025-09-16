import {
	getDocumentsByFieldIds,
	getDocumentsFromFirestore,
	getSingleDocumentFromFirestore,
} from "@/data/actions";
import { colors } from "@/data/colors";
import { ApprovedScheduleDoc, ScheduleItem } from "@/types/SceduleInterface";

type Building = {
	id: string;
	buildingName: string;
	color?: string;
};

export type Classroom = {
	id: string;
	classroomName: string;
	status: string;
};

export const getBuildingData = async (): Promise<Building[]> => {
	const data = (await getDocumentsFromFirestore(
		"buildings",
		true
	)) as Building[];
	return data.map((bg, i) => ({
		...bg,
		color: colors[i % colors.length],
	}));
};

export const getScheduleData = async (collectionName: string) => {
	const docs = await getDocumentsFromFirestore(collectionName, true);
	// If this is the approved schedule collection we might have nested docs
	if (collectionName === "approvedScheduleData" && Array.isArray(docs)) {
		// Heuristic: if any doc has scheduleItems array, return as ApprovedScheduleDoc[] for caller to flatten
		const hasNested = (docs as any[]).some((d) =>
			Array.isArray(d?.scheduleItems)
		);
		if (hasNested) {
			return docs as ApprovedScheduleDoc[];
		}
	}
	return docs as ScheduleItem[];
};

export const getClassrooms = async (id: string) => {
	return await getDocumentsByFieldIds<Classroom>(
		"classrooms",
		"buildingId",
		id
	);
};

export const getBuildingName = async (id: string) => {
	return await getSingleDocumentFromFirestore(id, "buildings", "buildingName");
};
