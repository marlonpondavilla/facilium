"use server";

import { firestore } from "@/firebase/server";
import { User } from "@/types/userType";

type GetUsersOptions = {
	pagination?: {
		pageSize?: number;
		page?: number;
	};
};

export const getUsers = async (options?: GetUsersOptions) => {
	const page = options?.pagination?.page || 1;
	const pageSize = options?.pagination?.pageSize || 10;

	const usersQuery = firestore
		.collection("userData")
		.orderBy("created", "desc");
	const propertiesSnapshot = await usersQuery
		.limit(pageSize)
		.offset((page - 1) * pageSize)
		.get();

	const properties = propertiesSnapshot.docs.map(
		(doc) =>
			({
				id: doc.id,
				...doc.data(),
			} as User)
	);

	return { data: properties };
};
