"use server";

import { firestore } from "@/firebase/server";
import {
	CollectionReference,
	DocumentData,
	FieldValue,
	Query,
} from "firebase-admin/firestore";

type DeleteDocumentOptions = {
	id: string;
	collectionName: string;
	relatedFields?: {
		collectionName: string;
		fieldName: string;
	}[];
};

type AssignDeanByUidOptions = {
	uid: string;
	collectionName?: string;
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

export const assignDeanByUid = async ({
	uid,
	collectionName = "userData",
}: AssignDeanByUidOptions): Promise<void> => {
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
	await userDoc.ref.update({ designation: "Dean" });
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

export const checkIfDocumentExists = async (
	collectionName: string,
	normalizedFieldName: string,
	value: string,
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
