"use server";

import { auth as adminAuth, firestore } from "@/firebase/server";
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

// Fully delete a user: removes their auth account (by uid) and the Firestore user document.
// Accepts either the firestore document id (docId) and uid. If uid is unknown we try to look it up first.
export const deleteUserCompletely = async (
	userDocId: string,
	options?: { userCollectionName?: string }
): Promise<{ success: true } | { success: false; error: unknown }> => {
	const userCollection = options?.userCollectionName || "userData";
	try {
		if (!userDocId) throw new Error("User document id is required");

		// Fetch doc to obtain uid
		const docRef = firestore.collection(userCollection).doc(userDocId);
		const snap = await docRef.get();
		if (!snap.exists) {
			// Nothing to delete in firestore; treat as success (idempotent)
			return { success: true };
		}
		const data = snap.data() as { uid?: string } | undefined;
		const uid = data?.uid;

		// Delete Firestore user document first to remove surface data
		await docRef.delete();

		if (uid && adminAuth) {
			try {
				await adminAuth.deleteUser(uid);
			} catch (authErr) {
				// If auth delete fails we log it but surface a controlled failure so UI can react.
				console.error("Failed to delete auth user", authErr);
				throw authErr;
			}
		}

		return { success: true };
	} catch (e) {
		console.error("deleteUserCompletely error", e);
		return { success: false, error: e };
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

// Update a user's designation while enforcing: at most one Program Head per department.
// If setting to "Program Head", this checks whether another active Program Head exists in the same department.
// Returns a success flag and human-readable error on violation.
export const updateUserDesignationWithGuard = async (
	params: { docId: string; newDesignation: string }
): Promise<{ success: true } | { success: false; error: string }> => {
	const { docId, newDesignation } = params || ({} as any);
	if (!docId || !newDesignation) {
		return { success: false, error: "docId and newDesignation are required" };
	}

	try {
		const userRef = firestore.collection("userData").doc(docId);
		const snap = await userRef.get();
		if (!snap.exists) {
			return { success: false, error: "User not found" };
		}

		const data = snap.data() as { department?: string; designation?: string; status?: string } | undefined;
		const department = (data?.department || "").trim();

	// Enforce at most one active Dean across the campus
	if (newDesignation === "Dean") {
		const existingDeanSnap = await firestore
			.collection("userData")
			.where("designation", "==", "Dean")
			.get();

		const deanConflict = existingDeanSnap.docs.some((d) => {
			if (d.id === docId) return false; 
			const s = (d.get("status") as string | undefined)?.trim();
			return s !== "Disabled";
		});

		if (deanConflict) {
			return {
				success: false,
				error:
					"There is already an active Dean. Demote the current Dean before assigning a new one.",
			};
		}
	}

	// Enforce at most one active Program Head per department
	if (newDesignation === "Program Head") {
		if (!department) {
			return { success: false, error: "User has no department set" };
		}

		// Find any other Program Head in the same department
		const existingSnap = await firestore
			.collection("userData")
			.where("designation", "==", "Program Head")
			.where("department", "==", department)
			.get();

		const conflict = existingSnap.docs.some((d) => {
			if (d.id === docId) return false;
			const s = (d.get("status") as string | undefined)?.trim();
			return s !== "Disabled";
		});

		if (conflict) {
			return {
				success: false,
				error: `This department ("${department}") already has an active Program Head.`,
			};
		}
	}

		await userRef.update({ designation: newDesignation });
		return { success: true };
	} catch (e) {
		console.error("updateUserDesignationWithGuard failed", e);
		return { success: false, error: "Failed to update designation" };
	}
};

// Helper: determine if there is currently an active Dean (status != "Disabled")
export const hasActiveDean = async (): Promise<boolean> => {
	try {
		const snap = await firestore
			.collection("userData")
			.where("designation", "==", "Dean")
			.get();
		return snap.docs.some((d) => ((d.get("status") as string | undefined)?.trim() ?? "") !== "Disabled");
	} catch (e) {
		console.error("hasActiveDean check failed", e);
		return false;
	}
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

// Update current user's name fields by document id
export const updateUserNameById = async (
	docId: string,
	firstName: string,
	lastName: string,
	middleName?: string
): Promise<void> => {
	if (!docId) throw new Error("User document id is required");
	const data: Record<string, any> = {
		firstName: firstName?.trim(),
		lastName: lastName?.trim(),
	};
	if (typeof middleName !== "undefined") {
		data.middleName = middleName?.trim() || "";
	}

	await firestore.collection("userData").doc(docId).update(data);
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

// Update an existing schedule document with partial fields
export const updateScheduleDocument = async (
	id: string,
	data: Partial<ScheduleItem>
): Promise<{ success: true } | { success: false; error: unknown }> => {
	try {
		if (!id) throw new Error("Schedule document id is required");
		await firestore
			.collection("scheduleData")
			.doc(id)
			.update(data as any);
		return { success: true };
	} catch (e) {
		console.error("Error updating schedule document", e);
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

export const checkIfScheduleConflictExists = async (
	newSchedule: ScheduleItem
): Promise<string | null> => {
	try {
		// Helper to test a snapshot for a qualifying overlap and return the first match
		const toHalf = (v: any): number => {
			if (!v && v !== 0) return 0;
			// numeric 30 means 30 minutes stored; treat as 0.5 hours
			if (typeof v === "number") {
				if (v === 30) return 0.5;
				return v === 0.5 ? 0.5 : 0;
			}
			if (typeof v === "string") {
				if (v === "30") return 0.5;
				if (v === "0.5") return 0.5;
			}
			if (typeof v === "boolean") {
				return v ? 0.5 : 0;
			}
			return 0;
		};

		const findOverlapInSnapshot = (snapshot: FirebaseFirestore.QuerySnapshot): string | null => {
			for (const doc of snapshot.docs) {
				const existing: ScheduleItem = { id: doc.id, ...doc.data() } as ScheduleItem;
				if (existing.id === newSchedule.id) continue; // ignore editing item

				const existingStart = Number(existing.start || 0);
				const existingEnd = existingStart + Number(existing.duration || 0) + toHalf(existing.halfHour);
				const newStart = Number(newSchedule.start || 0);
				const newEnd = newStart + Number(newSchedule.duration || 0) + toHalf(newSchedule.halfHour);
				const timeOverlap = !(newEnd <= existingStart || newStart >= existingEnd);
				if (!timeOverlap) continue;

				// Only treat as conflict when overlapping AND either same classroom or same professor.
				const professorConflict = Boolean(existing.professor) && existing.professor === newSchedule.professor;
				const classroomConflict = Boolean(existing.classroomId) && existing.classroomId === newSchedule.classroomId;

				if (professorConflict || classroomConflict) {
					return existing.id as string;
				}
			}
			return null;
		};

		// 1) Prefer checking the same classroom first (most relevant to current UI context)
		if (newSchedule.classroomId) {
			const snap = await firestore
				.collection("scheduleData")
				.where("day", "==", newSchedule.day)
				.where("classroomId", "==", newSchedule.classroomId)
				.get();
			const found = findOverlapInSnapshot(snap);
			if (found) return found;
		}

		// 2) Then check for professor conflicts (double booking)
		if (newSchedule.professor) {
			const snap = await firestore
				.collection("scheduleData")
				.where("day", "==", newSchedule.day)
				.where("professor", "==", newSchedule.professor)
				.get();
			const found = findOverlapInSnapshot(snap);
			if (found) return found;
		}

		// 3) Fallback: check all items on the day but still enforce only classroom/professor matches
		const fallback = await firestore
			.collection("scheduleData")
			.where("day", "==", newSchedule.day)
			.get();
		return findOverlapInSnapshot(fallback);
	} catch (error) {
		console.error("Error checking for schedule conflicts:", error);
		return null;
	}
};

// Delete documents by field value match (similar to relatedFields but standalone)
export const deleteDocumentsByFieldValue = async (
	collectionName: string,
	fieldName: string,
	fieldValue: string
): Promise<void> => {
	const snapshot = await firestore
		.collection(collectionName)
		.where(fieldName, "==", fieldValue)
		.get();

	const batch = firestore.batch();
	snapshot.forEach((doc) => batch.delete(doc.ref));
	await batch.commit();
};

// Cascade deletion for building and all related data
export const deleteBuildingWithCascade = async (
	buildingId: string
): Promise<void> => {
	try {
		// 1. Get all classroom IDs that belong to this building
		const classroomsSnapshot = await firestore
			.collection("classrooms")
			.where("buildingId", "==", buildingId)
			.get();

		const classroomIds = classroomsSnapshot.docs.map((doc) => doc.id);

		// 2. Delete all schedules that reference those classroom IDs
		if (classroomIds.length > 0) {
			const scheduleCollections = [
				"scheduleData",
				"pendingScheduleData",
				"approvedScheduleData",
			];

			for (const collection of scheduleCollections) {
				for (const classroomId of classroomIds) {
					await deleteDocumentsByFieldValue(
						collection,
						"classroomId",
						classroomId
					);
				}
			}
		}

		// 3. Delete all classrooms that belong to this building
		await deleteDocumentsByFieldValue("classrooms", "buildingId", buildingId);

		// 4. Delete the building itself
		await firestore.collection("buildings").doc(buildingId).delete();
	} catch (error) {
		console.error(`Error deleting building ${buildingId} with cascade:`, error);
		throw error;
	}
};

// Get classroom IDs for building batch deletion (helper for DeleteDocumentWithConfirmation)
export const getBuildingBatchFields = async (
	buildingId: string
): Promise<
	Array<{ id: string; collectionName: string; fieldName: string }>
> => {
	try {
		// Get all classroom IDs that belong to this building
		const classroomsSnapshot = await firestore
			.collection("classrooms")
			.where("buildingId", "==", buildingId)
			.get();

		const classroomIds = classroomsSnapshot.docs.map((doc) => doc.id);
		const batchFields: Array<{
			id: string;
			collectionName: string;
			fieldName: string;
		}> = [];

		// Add batch fields for all schedule collections that reference these classrooms
		const scheduleCollections = [
			"scheduleData",
			"pendingScheduleData",
			"approvedScheduleData",
		];

		for (const classroomId of classroomIds) {
			for (const collection of scheduleCollections) {
				batchFields.push({
					id: classroomId,
					collectionName: collection,
					fieldName: "classroomId",
				});
			}
		}

		// Add batch field for classrooms themselves
		batchFields.push({
			id: buildingId,
			collectionName: "classrooms",
			fieldName: "buildingId",
		});

		return batchFields;
	} catch (error) {
		console.error(
			`Error getting batch fields for building ${buildingId}:`,
			error
		);
		return [];
	}
};

// Get user data by UID (for getting current user's department)
export const getUserDataByUid = async (uid: string) => {
	try {
		const snapshot = await firestore
			.collection("userData")
			.where("uid", "==", uid)
			.limit(1)
			.get();

		if (snapshot.empty) {
			return null;
		}

		const userDoc = snapshot.docs[0];
		return {
			id: userDoc.id,
			...userDoc.data(),
		} as any;
	} catch (error) {
		console.error(`Error getting user data for UID ${uid}:`, error);
		return null;
	}
};

// Get current user data from server-side cookies
export const getCurrentUserData = async () => {
	const { cookies } = await import("next/headers");
	const token = (await cookies()).get("firebaseAuthToken")?.value;

	if (!token) {
		return null;
	}

	try {
		const { decodeJwt } = await import("jose");
		const decodedToken = decodeJwt(token);
		const uid = decodedToken?.sub;

		if (!uid) {
			return null;
		}

		return await getUserDataByUid(uid as string);
	} catch (error) {
		console.error("Error getting current user data:", error);
		return null;
	}
};

// Update current user's name (Firestore userData + Firebase Auth displayName)
export const updateCurrentUserName = async (params: {
	firstName: string;
	lastName: string;
	middleName?: string;
}) => {
	const { firstName, lastName, middleName } = params || {};
	if (!firstName || !lastName) {
		return {
			success: false,
			error: "First and last name are required.",
		} as const;
	}

	try {
		const current = await getCurrentUserData();
		if (!current?.id || !current?.uid) {
			return { success: false, error: "Not authenticated." } as const;
		}

		// Update Firestore userData doc
		await firestore
			.collection("userData")
			.doc(current.id)
			.update({
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				middleName: (middleName ?? "").trim(),
			});

		// Update Firebase Auth displayName via Admin SDK
		const displayName = `${firstName.trim()} ${lastName.trim()}`;
		if (adminAuth) {
			await adminAuth.updateUser(current.uid, { displayName });
		}

		return { success: true } as const;
	} catch (e) {
		console.error("updateCurrentUserName failed", e);
		return { success: false, error: "Failed to update name." } as const;
	}
};

// Update current user's photoURL (Firestore userData + Firebase Auth photoURL)
export const updateCurrentUserPhoto = async (params: { photoURL: string }) => {
	const { photoURL } = params || ({} as any);
	if (!photoURL || typeof photoURL !== "string") {
		return { success: false, error: "photoURL is required" } as const;
	}
	try {
		const current = await getCurrentUserData();
		if (!current?.id || !current?.uid) {
			return { success: false, error: "Not authenticated." } as const;
		}

		// Update Firestore userData doc
		await firestore.collection("userData").doc(current.id).update({ photoURL });

		// Update Firebase Auth photoURL via Admin SDK
		if (adminAuth) {
			await adminAuth.updateUser(current.uid, { photoURL });
		}

		return { success: true } as const;
	} catch (e) {
		console.error("updateCurrentUserPhoto failed", e);
		return {
			success: false,
			error: "Failed to update profile photo.",
		} as const;
	}
};

// (removed) getApprovedScheduleCountByClassroomId and getApprovedScheduleCounts

// Update current user's degree attainment (Firestore userData)
export const updateCurrentUserDegree = async (params: {
	degreeEarned: string;
}) => {
	const { degreeEarned } = params || ({} as any);
	if (!degreeEarned || typeof degreeEarned !== "string") {
		return { success: false, error: "degreeEarned is required" } as const;
	}
	try {
		const current = await getCurrentUserData();
		if (!current?.id) {
			return { success: false, error: "Not authenticated." } as const;
		}

		await firestore
			.collection("userData")
			.doc(current.id)
			.update({ degreeEarned });

		return { success: true } as const;
	} catch (e) {
		console.error("updateCurrentUserDegree failed", e);
		return {
			success: false,
			error: "Failed to update degree attainment.",
		} as const;
	}
};

// ---------------- Faculty Load APIs ----------------
// Collection name
const FACULTY_LOAD_COLLECTION = "facultyLoadData";

// Add a faculty load entry (program head assigns a course+section to a professor)
export const addFacultyLoad = async (data: {
	professorId: string;
	programId: string;
	yearLevelId: string;
	sectionId: string;
	courseCode: string;
	programHeadId: string;
}): Promise<{ success: true } | { success: false; error: unknown }> => {
	try {
		// Prevent duplicates for the same professor and exact same assignment
		const dupSnap = await firestore
			.collection(FACULTY_LOAD_COLLECTION)
			.where("professorId", "==", data.professorId)
			.where("programId", "==", data.programId)
			.where("yearLevelId", "==", data.yearLevelId)
			.where("sectionId", "==", data.sectionId)
			.where("courseCode", "==", data.courseCode)
			.where("programHeadId", "==", data.programHeadId)
			.get();
		if (!dupSnap.empty) {
			return { success: false, error: "Duplicate load for this professor." } as const;
		}
		const payload = { ...data, created: new Date().toISOString() };
		await firestore.collection(FACULTY_LOAD_COLLECTION).add(payload);
		return { success: true };
	} catch (e) {
		console.error("Error adding faculty load", e);
		return { success: false, error: e };
	}
};

// Get loads by professor, program, or section
export const getFacultyLoads = async (filters?: {
	professorId?: string;
	programId?: string;
	sectionId?: string;
	yearLevelId?: string;
	programHeadId?: string;
}): Promise<Array<{ id: string } & Record<string, any>>> => {
	try {
		let ref: CollectionReference<DocumentData> | Query<DocumentData> =
			firestore.collection(FACULTY_LOAD_COLLECTION);
		if (filters?.professorId) ref = ref.where("professorId", "==", filters.professorId);
		if (filters?.programId) ref = ref.where("programId", "==", filters.programId);
		if (filters?.yearLevelId) ref = ref.where("yearLevelId", "==", filters.yearLevelId);
		if (filters?.sectionId) ref = ref.where("sectionId", "==", filters.sectionId);
		if (filters?.programHeadId) ref = ref.where("programHeadId", "==", filters.programHeadId);
		const snap = await ref.get();
		return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
	} catch (e) {
		console.error("Error fetching faculty loads", e);
		return [];
	}
};

// Delete a faculty load by id
export const deleteFacultyLoad = async (id: string): Promise<void> => {
	await firestore.collection(FACULTY_LOAD_COLLECTION).doc(id).delete();
};

// Update a faculty load by id
export const updateFacultyLoad = async (
	id: string,
	data: {
		professorId: string;
		programId: string;
		yearLevelId: string;
		sectionId: string;
		courseCode: string;
		programHeadId: string;
	}
): Promise<{ success: true } | { success: false; error: unknown }> => {
	try {
		// Prevent duplicates for the same professor and exact same assignment (excluding this id)
		const dupSnap = await firestore
			.collection(FACULTY_LOAD_COLLECTION)
			.where("professorId", "==", data.professorId)
			.where("programId", "==", data.programId)
			.where("yearLevelId", "==", data.yearLevelId)
			.where("sectionId", "==", data.sectionId)
			.where("courseCode", "==", data.courseCode)
			.where("programHeadId", "==", data.programHeadId)
			.get();
		const hasOther = dupSnap.docs.some((d) => d.id !== id);
		if (hasOther) {
			return { success: false, error: "Duplicate load for this professor." } as const;
		}
		await firestore.collection(FACULTY_LOAD_COLLECTION).doc(id).update({
			professorId: data.professorId,
			programId: data.programId,
			yearLevelId: data.yearLevelId,
			sectionId: data.sectionId,
			courseCode: data.courseCode,
			programHeadId: data.programHeadId,
		});
		return { success: true };
	} catch (e) {
		console.error("Error updating faculty load", e);
		return { success: false, error: e };
	}
};

// For scheduling: get professors eligible for a given program/year/section/course
export const getEligibleProfessorsForLoad = async (params: {
	programId: string;
	yearLevelId: string;
	sectionId: string;
	courseCode: string;
}): Promise<string[]> => {
	try {
		const { programId, yearLevelId, sectionId, courseCode } = params;
		const snap = await firestore
			.collection(FACULTY_LOAD_COLLECTION)
			.where("programId", "==", programId)
			.where("yearLevelId", "==", yearLevelId)
			.where("sectionId", "==", sectionId)
			.where("courseCode", "==", courseCode)
			.get();
		return snap.docs.map((d) => d.get("professorId") as string);
	} catch (e) {
		console.error("Error fetching eligible professors for load", e);
		return [];
	}
};

