"use server";

import { firestore, getTotalUserCount } from "@/firebase/server";
import { User } from "@/types/userInterface";

type GetUsersOptions = {
	pagination?: {
		pageSize?: number;
		startAfterDocId?: string;
		search?: string;
	};
};

export const getUsersWithPage = async (options?: GetUsersOptions) => {
	const pageSize = options?.pagination?.pageSize || 10;
	const startAfterDocId = options?.pagination?.startAfterDocId;
	const search = options?.pagination?.search?.trim() || "";

	let usersQuery = firestore.collection("userData").orderBy("created", "desc");

	// if search exists it runs (emailk only bro)
	if (search) {
		usersQuery = firestore
			.collection("userData")
			.orderBy("email")
			.startAt(search)
			.endAt(search + "\uf8ff");
	}

	const { totalUsers, totalPages } = await getTotalUserCount(
		usersQuery,
		pageSize
	);

	let query = usersQuery.limit(pageSize);

	if (startAfterDocId) {
		const startAfterDocSnapshot = await firestore
			.collection("userData")
			.doc(startAfterDocId)
			.get();
		if (startAfterDocSnapshot.exists) {
			query = query.startAfter(startAfterDocSnapshot);
		}
	}

	const propertiesSnapshot = await query.get();

	const properties = propertiesSnapshot.docs.map(
		(doc) =>
			({
				id: doc.id,
				...doc.data(),
			} as User)
	);

	// Last visible doc for next cursor
	const lastVisibleDoc =
		propertiesSnapshot.docs[propertiesSnapshot.docs.length - 1];

	return {
		data: properties,
		totalUsers,
		totalPages,
		nextCursor: lastVisibleDoc ? lastVisibleDoc.id : null,
	};
};

export const updateUserField = async (
	userId: string,
	newStatus: string,
	collectionName: string,
	fieldName: string
): Promise<void> => {
	await firestore
		.collection(collectionName)
		.doc(userId)
		.update({ [fieldName]: newStatus });
};
