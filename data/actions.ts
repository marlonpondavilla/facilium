"use server";

import { firestore } from "@/firebase/server";
import { ClassroomType } from "@/types/classroomType";

export const deleteDocumentById = async (
	id: string,
	collectionName: string
): Promise<void> => {
	await firestore.collection(collectionName).doc(id).delete();
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
