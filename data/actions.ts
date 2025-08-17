"use server";

import { firestore } from "@/firebase/server";
import { FieldValue } from "firebase-admin/firestore";

type DeleteDocumentOptions = {
	id: string;
	collectionName: string;
	relatedFields?: {
		collectionName: string;
		fieldName: string;
	}[];
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
	collectionName: string
): Promise<T[]> => {
	try {
		const snapshot = await firestore.collection(collectionName).get();

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
	normalizedFieldValueName: string,
	value: string
): Promise<boolean> => {
	try {
		const snapshot = await firestore
			.collection(collectionName)
			.where(normalizedFieldValueName, "==", value)
			.limit(1)
			.get();

		return !snapshot.empty;
	} catch (e) {
		console.error("Error checkig documet exist", e);
		return false;
	}
};
