import {
	getDocumentsByFieldIds,
	getDocumentsFromFirestore,
	getSingleDocumentFromFirestore,
} from "@/data/actions";
import { colors } from "@/data/colors";
import { ScheduleItem } from "@/types/SceduleInterface";

type Building = {
	id: string;
	buildingName: string;
	color?: string;
};

export type Classroom = {
	id: string;
	classroomName: string;
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
	return (await getDocumentsFromFirestore(
		collectionName,
		true
	)) as ScheduleItem[];
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
