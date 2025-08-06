"use server";

import { firestore, getTotalUserCount } from "@/firebase/server";
import { User } from "@/types/userType";

type GetUsersOptions = {
	pagination?: {
		pageSize?: number;
		startAfterDocId?: string;
	};
};

export const getUserData = async () => {
	const snapshot = await firestore.collection("userData").get();

	const users = snapshot.docs.map((doc) => {
		const { created, ...data } = doc.data();
		return {
			id: doc.id,
			...data,
		} as User;
	});

	return users;
};

export const getUsersWithPage = async (options?: GetUsersOptions) => {
	const pageSize = options?.pagination?.pageSize || 10;
	const startAfterDocId = options?.pagination?.startAfterDocId;

	const usersQuery = firestore
		.collection("userData")
		.orderBy("created", "desc");

	//
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

export const setUserStatus = async (
	userId: string,
	newStatus: string
): Promise<void> => {
	await firestore
		.collection("userData")
		.doc(userId)
		.update({ status: newStatus });
};

export const deleteUserById = async (userId: string): Promise<void> => {
	await firestore.collection("userData").doc(userId).delete();
};
