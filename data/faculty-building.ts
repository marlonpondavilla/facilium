import {
	getDocumentsByFieldIds,
	getDocumentsFromFirestore,
	getSingleDocumentFromFirestore,
	getCurrentUserData,
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

// Get classrooms filtered by user's department
export const getClassroomsByDepartment = async (
	buildingId: string,
	userDepartment: string
) => {
	const allClassrooms = await getDocumentsByFieldIds<
		Classroom & { departments: string[] }
	>("classrooms", "buildingId", buildingId);

	// Filter classrooms that include the user's department
	return allClassrooms.filter(
		(classroom) =>
			classroom.departments && classroom.departments.includes(userDepartment)
	);
};

// Get classrooms filtered by current logged-in user's department
export const getFilteredClassrooms = async (buildingId: string) => {
	const currentUser = await getCurrentUserData();

	if (!currentUser) {
		return [];
	}

	// Allow Deans to view all classrooms in any building, regardless of department
	const designation = String(currentUser.designation || "")
		.trim()
		.toLowerCase();
	if (designation === "dean") {
		return await getClassrooms(buildingId);
	}

	// For non-deans, require department and filter accordingly
	if (!currentUser.department) {
		return [];
	}

	return await getClassroomsByDepartment(buildingId, currentUser.department);
};

export const getBuildingName = async (id: string) => {
	return await getSingleDocumentFromFirestore(id, "buildings", "buildingName");
};
