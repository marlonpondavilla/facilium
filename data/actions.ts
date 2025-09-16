"use server";

import { firestore } from "@/firebase/server";
import { ScheduleItem } from "@/types/SceduleInterface";
import {
	CollectionReference,
	DocumentData,
	FieldValue,
	Query,
} from "firebase-admin/firestore";

// Generic user shape subset for lookups
export type BasicUserRecord = {
	id: string;
	uid?: string;
	firstName?: string;
	lastName?: string;
	designation?: string;
};

type DeleteDocumentOptions = {
	id: string;
	collectionName: string;
	relatedFields?: {
		collectionName: string;
		fieldName: string;
	}[];
};

type AssignDesignationOptions = {
	uid: string;
	collectionName?: string;
	role: string;
};

export const deleteDocumentById = async ({
	id,
	collectionName,
	relatedFields,
}: DeleteDocumentOptions): Promise<void> => {
	await firestore.collection(collectionName).doc(id).delete();

	// delete related documents if passed
	if (relatedFields && relatedFields.length > 0) {
		for (const { collectionName: relCollection, fieldName } of relatedFields) {
			const snapshot = await firestore
				.collection(relCollection)
				.where(fieldName, "==", id)
				.get();

			const batch = firestore.batch();
			snapshot.forEach((doc) => batch.delete(doc.ref));
			await batch.commit();
		}
	}
};

export const assignDesignationByUid = async ({
	uid,
	collectionName = "userData",
	role,
}: AssignDesignationOptions): Promise<void> => {
	if (!uid) throw new Error("UID is required");

	const snapshot = await firestore
		.collection(collectionName)
		.where("uid", "==", uid)
		.limit(1)
		.get();

	if (snapshot.empty) {
		throw new Error(`User document with uid "${uid}" not found`);
	}

	const userDoc = snapshot.docs[0];
	await userDoc.ref.update({ designation: role });
};

export const updateDocumentById = async (
	docId: string,
	collectionName: string,
	fieldName: string,
	newData: string
): Promise<void> => {
	await firestore
		.collection(collectionName)
		.doc(docId)
		.update({ [fieldName]: newData });
};

export const updateDocumentsByBatch = async (
	updates: {
		docId: string;
		collectionName: string;
		data: Record<string, any>;
	}[]
): Promise<void> => {
	const batch = firestore.batch();

	updates.forEach(({ docId, collectionName, data }) => {
		const docRef = firestore.collection(collectionName).doc(docId);
		batch.update(docRef, data);
	});

	await batch.commit();
};

export const addDocumentToFirestore = async (
	collectionName: string,
	data: Record<string, any>
): Promise<{ success: true } | { success: false; error: unknown }> => {
	try {
		await firestore.collection(collectionName).add(data);
		return { success: true };
	} catch (e) {
		console.error("Error adding document", e);
		return { success: false, error: e };
	}
};

export const getDocumentsFromFirestore = async <T>(
	collectionName: string,
	sort?: boolean
): Promise<T[]> => {
	try {
		let collectionRef: CollectionReference<DocumentData> | Query<DocumentData> =
			firestore.collection(collectionName);

		if (sort) {
			collectionRef = collectionRef.orderBy("created", "asc");
		}

		const snapshot = await collectionRef.get();

		const documents = snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		})) as T[];

		return documents;
	} catch (e) {
		console.error("error fetching documents", e);
		return [];
	}
};

export const getDocumentsByFieldIds = async <T>(
	collectionName: string,
	fieldName: string,
	searchId: string
): Promise<T[]> => {
	try {
		let collectionRef: CollectionReference<DocumentData> =
			firestore.collection(collectionName);
		const queryRef: Query<DocumentData> = collectionRef.where(
			fieldName,
			"==",
			searchId
		);

		const snapshot = await queryRef.get();

		const documents: T[] = snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		})) as T[];

		return documents;
	} catch (error) {
		console.error("Error on fetching documents field by id", error);
		return [];
	}
};

export const getFirstUserByDesignation = async (
	designation: string
): Promise<BasicUserRecord | null> => {
	try {
		const snapshot = await firestore
			.collection("userData")
			.where("designation", "==", designation)
			.limit(1)
			.get();

		if (snapshot.empty) return null;

		const doc = snapshot.docs[0];
		const data = doc.data();
		return {
			id: doc.id,
			uid: data.uid,
			firstName: data.firstName,
			lastName: data.lastName,
			designation: data.designation,
		};
	} catch (error) {
		console.error("Error fetching user by designation", error);
		return null;
	}
};

export const getDocumentsWithNestedObject = async <T>(
	collectionName: string,
	sortField?: string,
	sortDirection: "asc" | "desc" = "asc"
): Promise<(T & { id: string })[]> => {
	try {
		let collectionRef: CollectionReference<DocumentData> | Query<DocumentData> =
			firestore.collection(collectionName);

		if (sortField) {
			collectionRef = collectionRef.orderBy(sortField, sortDirection);
		}

		const snapshot = await collectionRef.get();

		return snapshot.docs.map((doc) => ({
			id: doc.id,
			...(doc.data() as T),
		}));
	} catch (error) {
		console.error(`Error fetching documents from ${collectionName}`, error);
		return [];
	}
};

export const getSingleDocumentFromFirestore = async (
	id: string,
	collectionName: string,
	fieldName: string
): Promise<any | null> => {
	try {
		const docRef = firestore.collection(collectionName).doc(id);
		const docSnap = await docRef.get();

		if (!docSnap.exists) {
			console.warn(
				`Document with ID "${id}" not found in collection "${collectionName}".`
			);
			return null;
		}

		const data = docSnap.data();
		return data?.[fieldName] ?? null;
	} catch (e) {
		console.error("Error fetching document field value:", e);
		throw e;
	}
};

export const getCollectionSize = async (
	collectionName: string
): Promise<number> => {
	try {
		const collectionRef = firestore.collection(collectionName);
		const snapshot = await collectionRef.count().get();
		return snapshot.data().count ?? 0;
	} catch (e) {
		console.error("error fetching collection size", e);
		throw e;
	}
};

export const incrementDocumentCountById = async (
	id: string,
	collectionName: string,
	fieldName: string,
	amount: number
): Promise<void> => {
	await firestore
		.collection(collectionName)
		.doc(id)
		.update({
			[fieldName]: FieldValue.increment(amount),
		});
};

export const checkIfDocumentExists = async <T = string | number>(
	collectionName: string,
	normalizedFieldName: string,
	value: T,
	foreignField?: string,
	foreignValue?: string
): Promise<boolean> => {
	try {
		const baseQuery = firestore
			.collection(collectionName)
			.where(normalizedFieldName, "==", value);

		const snapshot = await baseQuery.get();

		if (snapshot.empty) return false;

		if (!foreignField || !foreignValue) return true;

		// will return true if a matching value exists with different foreignValue
		const exists = snapshot.docs.some(
			(doc) => doc.get(foreignField) === foreignValue
		);

		return exists;
	} catch (e) {
		console.error("Error checking document existence", e);
		return false;
	}
};

// export const checkIfScheduleConflictExists = async (
// 	newSchedule: ScheduleItem
// ): Promise<boolean> => {
// 	try {
// 		// Query all schedule entries on the same day (excluding the current one if editing)
// 		const snapshot = await firestore
// 			.collection("scheduleData")
// 			.where("day", "==", newSchedule.day)
// 			.get();

// 		// Iterate through all items, check for time overlap and resource conflict
// 		const conflictExists = snapshot.docs.some((doc) => {
// 			const existing: ScheduleItem = {
// 				id: doc.id,
// 				...doc.data(),
// 			} as ScheduleItem;

// 			// If editing an existing schedule, ignore the same record
// 			if (existing.id === newSchedule.id) return false;

// 			// Check time overlap
// 			const existingStart = existing.start;
// 			const existingEnd = existing.start + existing.duration;
// 			const newStart = newSchedule.start;
// 			const newEnd = newSchedule.start + newSchedule.duration;

// 			const timeOverlap = !(newEnd <= existingStart || newStart >= existingEnd);

// 			if (!timeOverlap) return false;

// 			// Check for conflicts on professor, classroom, or section
// 			const professorConflict = existing.professor === newSchedule.professor;
// 			const classroomConflict =
// 				existing.classroomId === newSchedule.classroomId;
// 			const sectionConflict = existing.section === newSchedule.section;

// 			return professorConflict || classroomConflict || sectionConflict;
// 		});

// 		return conflictExists;
// 	} catch (error) {
// 		console.error("Error checking for schedule conflicts:", error);
// 		return false;
// 	}
// };

export const checkIfScheduleConflictExists = async (
	newSchedule: ScheduleItem
): Promise<string | null> => {
	try {
		// Query all schedule entries on the same day (excluding the current one if editing)
		const snapshot = await firestore
			.collection("scheduleData")
			.where("day", "==", newSchedule.day)
			.get();

		// Iterate through all items, check for time overlap and resource conflict
		const conflictingDoc = snapshot.docs.find((doc) => {
			const existing: ScheduleItem = {
				id: doc.id,
				...doc.data(),
			} as ScheduleItem;

			// If editing an existing schedule, ignore the same record
			if (existing.id === newSchedule.id) return false;

			// Check for time overlap
			const existingStart = existing.start;
			const existingEnd = existing.start + existing.duration;
			const newStart = newSchedule.start;
			const newEnd = newSchedule.start + newSchedule.duration;

			// Allow adjacent schedules (if one ends exactly when another starts)
			const timeOverlap = !(newEnd <= existingStart || newStart >= existingEnd);

			if (!timeOverlap) return false; // No time overlap -> no conflict

			// Check for conflicts on professor, classroom, or section
			const professorConflict = existing.professor === newSchedule.professor;
			const classroomConflict =
				existing.classroomId === newSchedule.classroomId;
			const sectionConflict = existing.section === newSchedule.section;

			return professorConflict || classroomConflict || sectionConflict; // Return conflict if any match
		});

		// Return the ID of the conflicting document if a conflict exists, otherwise null
		return conflictingDoc ? conflictingDoc.id : null;
	} catch (error) {
		console.error("Error checking for schedule conflicts:", error);
		return null;
	}
};
