"use server";

import { firestore } from "@/firebase/server";

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
